import { Router } from "express";
import { createWebhookRouter } from "../webhooks.js";

const router = Router();
router.use("/", createWebhookRouter());

export default router;
