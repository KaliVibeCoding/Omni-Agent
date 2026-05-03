import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";
import { TWILIO_OMNI_AGENT_SYSTEM_PROMPT } from "./system-prompt";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const router = Router();

// List conversations
router.get("/conversations", async (req, res, next) => {
  try {
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
    res.json(allConversations);
  } catch (err) {
    next(err);
  }
});

// Create conversation
router.post("/conversations", async (req, res, next) => {
  try {
    const body = CreateConversationBody.parse(req.body);
    const [conversation] = await db
      .insert(conversations)
      .values({ title: body.title })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

// Get conversation with messages
router.get("/conversations/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = GetConversationParams.parse(req.params);
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: { messages: { orderBy: messages.createdAt } },
    });
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

// Delete conversation
router.delete("/conversations/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = DeleteConversationParams.parse(req.params);
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Send message and stream response
router.post(
  "/conversations/:conversationId/messages",
  async (req, res, next) => {
    try {
      const { conversationId } = SendAnthropicMessageParams.parse(req.params);
      const { content } = SendAnthropicMessageBody.parse(req.body);

      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: { messages: { orderBy: messages.createdAt } },
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      // Save the user message
      await db.insert(messages).values({
        conversationId,
        role: "user",
        content,
      });

      // Build message history for Claude
      const chatMessages: MessageParam[] = [
        ...conversation.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content },
      ];

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      let fullResponse = "";

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: TWILIO_OMNI_AGENT_SYSTEM_PROMPT,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullResponse += event.delta.text;
          res.write(
            `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
          );
        }
      }

      // Save the assistant message
      await db.insert(messages).values({
        conversationId,
        role: "assistant",
        content: fullResponse,
      });

      // Update conversation updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
