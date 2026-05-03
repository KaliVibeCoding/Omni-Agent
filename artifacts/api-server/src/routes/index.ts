import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import openrouterRouter from "./openrouter";
import twilioRouter from "./twilio";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anthropic", anthropicRouter);
router.use("/openrouter", openrouterRouter);
router.use("/twilio", twilioRouter);

export default router;
