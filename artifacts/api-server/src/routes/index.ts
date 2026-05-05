import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import openrouterRouter from "./openrouter";
import twilioRouter from "./twilio";
import webhookTesterRouter from "./webhook-tester";
import videoRouter from "./video";
import twilioConversationsRouter from "./twilio-conversations";
import telehealthRouter from "./telehealth";
import tenantRouter from "./tenant";
import salesChatRouter from "./sales-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anthropic", anthropicRouter);
router.use("/openrouter", openrouterRouter);
router.use("/twilio", twilioRouter);
router.use("/twilio/video", videoRouter);
router.use("/twilio/conv", twilioConversationsRouter);
router.use("/twilio/telehealth", telehealthRouter);
router.use("/webhook-tester", webhookTesterRouter);
router.use("/tenant", tenantRouter);
router.use("/sales-chat", salesChatRouter);

export default router;
