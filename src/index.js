// =============================================
// Entry Point — SGB Agro WhatsApp Bot Server
// =============================================

import "dotenv/config";
import express from "express";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { initDatabase } from "./database/db.js";
import { webhookRouter } from "./whatsapp/webhook.js";
import { adminRouter } from "./admin/routes.js";
import { testRouter } from "./test/testRouter.js";
import { ensureSheetHeaders } from "./sheets/excelSync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Ensure data directory exists ─────────────────────
const dataDir = path.join(__dirname, "../data");
mkdirSync(dataDir, { recursive: true });

// ── Express app ───────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────
app.use("/", webhookRouter);          // WhatsApp webhook
app.use("/admin", adminRouter);       // Admin dashboard & API
app.use("/test", testRouter);         // 🧪 Visual browser chat tester

// ── Health check ─────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "SGB Agro Industries WhatsApp Bot",
    status: "running ✅",
    version: "1.0.0",
    endpoints: {
      tester:    "GET /test (interactive WhatsApp UI)",
      dashboard: "GET /admin/dashboard",
      leads:     "GET /admin/leads",
      export:    "GET /admin/export",
      webhook:   "GET/POST /webhook",
    },
  });
});

// ── Bootstrap: init DB then start server ─────────────
async function bootstrap() {
  await initDatabase();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`\n🌾 SGB Agro WhatsApp Bot running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
    console.log(`🔗 Webhook:   http://localhost:${PORT}/webhook\n`);

    // Setup Google Sheets headers if configured
    await ensureSheetHeaders();
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});

export default app;
