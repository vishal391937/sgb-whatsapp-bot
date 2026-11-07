// =============================================
// Webhook Handler — Meta WhatsApp Cloud API
// Handles: verification + incoming messages
// =============================================

import express from "express";
import { handleMessage } from "../bot/flow.js";

export const webhookRouter = express.Router();

// ── GET /webhook — Meta verification handshake ────────
webhookRouter.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "sgb_webhook_verify_2024";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified by Meta");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Webhook verification failed — token mismatch");
  res.sendStatus(403);
});

// ── POST /webhook — Incoming messages ─────────────────
webhookRouter.post("/webhook", async (req, res) => {
  // Acknowledge quickly (Meta needs 200 within 5s)
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") return;

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages;
        if (!messages || messages.length === 0) continue;

        for (const msg of messages) {
          const from = msg.from;

          if (msg.type === "text") {
            const text = msg.text?.body?.trim();
            if (!text) continue;

            console.log(`📩 Incoming from ${from}: "${text}"`);
            await handleMessage(from, text);
          }

          if (msg.type === "interactive") {
            const buttonId    = msg.interactive?.button_reply?.id;
            const buttonTitle = msg.interactive?.button_reply?.title;
            const text = buttonTitle || buttonId || "";

            if (text) {
              console.log(`🔘 Button reply from ${from}: "${text}"`);
              await handleMessage(from, text);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
  }
});

