import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import {
  CreateConversationBody,
  GetOpenrouterConversationParams,
  DeleteOpenrouterConversationParams,
  SendOpenrouterMessageParams,
  SendOpenrouterMessageBody,
} from "@workspace/api-zod";
import { TWILIO_OMNI_AGENT_SYSTEM_PROMPT } from "../anthropic/system-prompt";

const router = Router();

router.get("/conversations", async (req, res, next) => {
  try {
    const all = await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    res.json(all);
  } catch (err) {
    next(err);
  }
});

router.post("/conversations", async (req, res, next) => {
  try {
    const body = CreateConversationBody.parse(req.body);
    const [conv] = await db.insert(conversations).values({ title: body.title }).returning();
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
});

router.get("/conversations/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = GetOpenrouterConversationParams.parse(req.params);
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: { messages: { orderBy: messages.createdAt } },
    });
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    res.json(conv);
  } catch (err) {
    next(err);
  }
});

router.delete("/conversations/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = DeleteOpenrouterConversationParams.parse(req.params);
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/conversations/:conversationId/messages", async (req, res, next) => {
  try {
    const { conversationId } = SendOpenrouterMessageParams.parse(req.params);
    const { content, model } = SendOpenrouterMessageBody.parse(req.body);

    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: { messages: { orderBy: messages.createdAt } },
    });

    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    await db.insert(messages).values({ conversationId, role: "user", content });

    const chatMessages = [
      ...conv.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";

    const stream = await openrouter.chat.completions.create({
      model,
      max_tokens: 8192,
      messages: [
        { role: "system", content: TWILIO_OMNI_AGENT_SYSTEM_PROMPT },
        ...chatMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId, role: "assistant", content: fullResponse });
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
