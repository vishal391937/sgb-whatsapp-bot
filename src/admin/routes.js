// =============================================
// Admin API Routes — View leads & conversations
// GET /admin/leads          — all leads
// GET /admin/leads/:number  — one lead + history
// GET /admin/export         — download Excel
// POST /admin/leads/:number/status — update status
// =============================================

import express from "express";
import { getAllLeads, getLead, getConversationHistory,
         updateLeadStatus } from "../database/db.js";
import { exportToLocalXLSX } from "../sheets/excelSync.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const adminRouter = express.Router();

// ── GET /admin/leads — all leads ──────────────────────
adminRouter.get("/leads", (req, res) => {
  const leads = getAllLeads();
  res.json({ total: leads.length, leads });
});

// ── GET /admin/leads/:number — lead + conversation ────
adminRouter.get("/leads/:number", (req, res) => {
  const number = decodeURIComponent(req.params.number);
  const lead   = getLead(number);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const history = getConversationHistory(number, 100);
  res.json({ lead, conversation: history });
});

// ── POST /admin/leads/:number/status — update status ─
adminRouter.post("/leads/:number/status", (req, res) => {
  const number = decodeURIComponent(req.params.number);
  const { status } = req.body;
  const valid = ["new","interested","contacted","converted","closed"];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });
  }

  updateLeadStatus(number, status);
  res.json({ success: true, number, status });
});

// ── GET /admin/export — download Excel ───────────────
adminRouter.get("/export", (req, res) => {
  exportToLocalXLSX();
  const filePath = path.join(__dirname, "../../data/sgb_leads.xlsx");
  res.download(filePath, "SGB_Leads.xlsx");
});

// ── GET /admin/dashboard — simple HTML dashboard ─────
adminRouter.get("/dashboard", (req, res) => {
  const leads = getAllLeads();
  const rows = leads.map(l => `
    <tr>
      <td>${l.whatsapp_number}</td>
      <td>${l.name || "-"}</td>
      <td>${l.place || "-"}</td>
      <td>${l.interested_product || "-"}</td>
      <td>${l.language || "-"}</td>
      <td><span class="badge ${l.status}">${l.status}</span></td>
      <td>${l.created_at?.slice(0,10) || "-"}</td>
      <td><a href="/admin/leads/${encodeURIComponent(l.whatsapp_number)}">View Chat</a></td>
    </tr>
  `).join("");

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>SGB Agro — Lead Dashboard</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1   { color: #2d6a2d; }
    table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px #0001; }
    th   { background:#2d6a2d; color:#fff; padding:12px 8px; text-align:left; }
    td   { padding:10px 8px; border-bottom:1px solid #eee; }
    tr:hover { background:#f0f7f0; }
    .badge { padding:3px 8px; border-radius:12px; font-size:12px; }
    .new       { background:#e3f2fd; color:#1565c0; }
    .interested { background:#fff9c4; color:#f57f17; }
    .contacted { background:#ffe0b2; color:#e65100; }
    .converted { background:#c8e6c9; color:#1b5e20; }
    .closed    { background:#f5f5f5; color:#616161; }
    .header    { display:flex; justify-content:space-between; align-items:center; }
    .export-btn { background:#2d6a2d; color:#fff; padding:10px 20px; border:none; border-radius:6px; cursor:pointer; text-decoration:none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌾 SGB Agro Industries — Lead Dashboard</h1>
    <a href="/admin/export" class="export-btn">⬇️ Export Excel</a>
  </div>
  <p>Total leads: <strong>${leads.length}</strong></p>
  <table>
    <thead>
      <tr>
        <th>WhatsApp</th><th>Name</th><th>Place</th>
        <th>Interested Product</th><th>Language</th>
        <th>Status</th><th>Date</th><th>Chat</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8" style="text-align:center;padding:30px;">No leads yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`);
});

