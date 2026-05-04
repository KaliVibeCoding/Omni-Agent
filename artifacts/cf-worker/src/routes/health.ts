import { Hono } from "hono";
import type { Env } from "../index";

const health = new Hono<{ Bindings: Env }>();

health.get("/healthz", (c) => c.json({ ok: true, ts: Date.now() }));

export default health;
