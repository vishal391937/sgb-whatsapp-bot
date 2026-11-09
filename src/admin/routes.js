// =============================================
// Admin Dashboard & API Routes
// View leads, interactive chat history, export Excel, download raw DB
// =============================================

import express from "express";
import { getAllLeads, getLead, getConversationHistory, updateLeadStatus } from "../database/db.js";
import { exportToLocalXLSX } from "../sheets/excelSync.js";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const adminRouter = express.Router();

// ── GET /admin/leads — all leads in JSON ──────────────
adminRouter.get("/leads", (req, res) => {
  const leads = getAllLeads();
  res.json({ total: leads.length, leads });
});

// ── GET /admin/leads/:number — lead + full conversation history ────
adminRouter.get("/leads/:number", (req, res) => {
  const number = decodeURIComponent(req.params.number);
  const lead = getLead(number);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const history = getConversationHistory(number, 500);
  res.json({ lead, conversation: history });
});

// ── POST /admin/leads/:number/status — update status ──
adminRouter.post("/leads/:number/status", (req, res) => {
  const number = decodeURIComponent(req.params.number);
  const { status } = req.body;
  const valid = ["new", "interested", "contacted", "converted", "closed"];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });
  }

  updateLeadStatus(number, status);
  res.json({ success: true, number, status });
});

// ── GET /admin/export — download leads Excel (.xlsx) ───
adminRouter.get("/export", (req, res) => {
  exportToLocalXLSX();
  const filePath = path.join(__dirname, "../../data/sgb_leads.xlsx");
  res.download(filePath, "SGB_Leads.xlsx");
});

// ── GET /admin/database/download — direct SQLite DB download ─────
adminRouter.get("/database/download", (req, res) => {
  const dbPath = path.join(__dirname, "../../data/sgb_leads.db");
  if (!existsSync(dbPath)) {
    return res.status(404).send("Database file not found yet.");
  }
  res.download(dbPath, "sgb_leads.db");
});

// ── GET /admin/dashboard — Interactive Live Web Portal ─
adminRouter.get("/dashboard", (req, res) => {
  const leads = getAllLeads();

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SGB Agro — Customer & Lead Portal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; color: #1c1e21; }
    
    header { background: #128c7e; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    header h1 { font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    
    .actions { display: flex; gap: 10px; }
    .btn { background: #25d366; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { opacity: 0.9; }
    .btn-secondary { background: #075e54; }
    
    .container { max-width: 1400px; margin: 24px auto; padding: 0 16px; display: grid; grid-template-columns: 1fr 420px; gap: 20px; }
    @media (max-width: 1024px) { .container { grid-template-columns: 1fr; } }
    
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .card-header { padding: 14px 18px; border-bottom: 1px solid #edf0f2; display: flex; justify-content: space-between; align-items: center; }
    .card-header h2 { font-size: 15px; font-weight: 600; color: #075e54; }
    
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f8fafb; padding: 10px 14px; text-align: left; font-weight: 600; color: #65676b; border-bottom: 1px solid #edf0f2; }
    td { padding: 12px 14px; border-bottom: 1px solid #f2f4f6; }
    tr:hover { background: #f9fbf9; cursor: pointer; }
    tr.active { background: #e8f5e9; }
    
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.new { background: #e3f2fd; color: #1565c0; }
    .badge.interested { background: #fff9c4; color: #f57f17; }
    .badge.contacted { background: #ffe0b2; color: #e65100; }
    .badge.converted { background: #c8e6c9; color: #1b5e20; }
    .badge.closed { background: #eceff1; color: #546e7a; }
    
    /* Chat Viewer Sidebar */
    .chat-panel { display: flex; flex-direction: column; height: 650px; }
    .chat-header { padding: 14px 18px; background: #ededed; border-bottom: 1px solid #ddd; }
    .chat-header h3 { font-size: 14px; font-weight: 600; color: #333; }
    .chat-header p { font-size: 12px; color: #666; margin-top: 2px; }
    
    .chat-body { flex: 1; overflow-y: auto; padding: 16px; background: #efeae2; display: flex; flex-direction: column; gap: 8px; }
    .msg { max-width: 85%; padding: 8px 12px; border-radius: 7.5px; font-size: 13px; line-height: 1.45; word-wrap: break-word; }
    .msg.user { background: #d9fdd3; align-self: flex-end; border-top-right-radius: 0; box-shadow: 0 1px 0.5px rgba(0,0,0,0.13); }
    .msg.bot { background: white; align-self: flex-start; border-top-left-radius: 0; box-shadow: 0 1px 0.5px rgba(0,0,0,0.13); }
    .msg .time { font-size: 10px; color: #888; text-align: right; margin-top: 4px; }
    
    .status-select { font-size: 12px; padding: 4px 6px; border-radius: 4px; border: 1px solid #ccc; outline: none; }
    .empty-state { text-align: center; padding: 40px 20px; color: #888; font-size: 14px; }
  </style>
</head>
<body>

  <header>
    <h1>🌾 SGB Agro Industries — Customer Portal</h1>
    <div class="actions">
      <a href="/admin/export" class="btn">📊 Download Excel (.xlsx)</a>
      <a href="/admin/database/download" class="btn btn-secondary">💾 Download SQLite Database</a>
    </div>
  </header>

  <div class="container">
    <!-- Left: Leads Table -->
    <div class="card">
      <div class="card-header">
        <h2>All Customers (${leads.length})</h2>
        <span style="font-size: 12px; color: #65676b;">Click any customer to read their chat history</span>
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>WhatsApp</th>
              <th>Name</th>
              <th>Place</th>
              <th>Interested Product</th>
              <th>Language</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="leadsTableBody">
            ${
              leads.length === 0
                ? '<tr><td colspan="7" class="empty-state">No customer leads yet. Once an ad is clicked, data will appear here.</td></tr>'
                : leads
                    .map(
                      (l) => `
                <tr onclick="loadChat('${encodeURIComponent(l.whatsapp_number)}', this)" data-number="${l.whatsapp_number}">
                  <td><strong>${l.whatsapp_number}</strong></td>
                  <td>${l.name || "-"}</td>
                  <td>${l.place || "-"}</td>
                  <td>${l.interested_product || "-"}</td>
                  <td>${l.language || "-"}</td>
                  <td>
                    <select class="status-select" onclick="event.stopPropagation()" onchange="changeStatus('${encodeURIComponent(l.whatsapp_number)}', this.value)">
                      <option value="new" ${l.status === "new" ? "selected" : ""}>New</option>
                      <option value="interested" ${l.status === "interested" ? "selected" : ""}>Interested</option>
                      <option value="contacted" ${l.status === "contacted" ? "selected" : ""}>Contacted</option>
                      <option value="converted" ${l.status === "converted" ? "selected" : ""}>Converted</option>
                      <option value="closed" ${l.status === "closed" ? "selected" : ""}>Closed</option>
                    </select>
                  </td>
                  <td>${l.created_at?.slice(0, 10) || "-"}</td>
                </tr>
              `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Right: Chat History Viewer -->
    <div class="card chat-panel">
      <div class="chat-header">
        <h3 id="chatTitle">Customer Conversation</h3>
        <p id="chatSubtitle">Select a lead from the table to view their full chat history</p>
      </div>
      <div class="chat-body" id="chatBody">
        <div class="empty-state">👈 Click any customer on the left to see every message exchanged with the AI.</div>
      </div>
    </div>
  </div>

  <script>
    async function loadChat(encodedNumber, rowElement) {
      document.querySelectorAll('#leadsTableBody tr').forEach(r => r.classList.remove('active'));
      if (rowElement) rowElement.classList.add('active');

      const chatTitle = document.getElementById('chatTitle');
      const chatSubtitle = document.getElementById('chatSubtitle');
      const chatBody = document.getElementById('chatBody');

      chatBody.innerHTML = '<div class="empty-state">Loading chat history...</div>';

      try {
        const res = await fetch('/admin/leads/' + encodedNumber);
        const data = await res.json();

        if (!data || !data.lead) {
          chatBody.innerHTML = '<div class="empty-state">No history found.</div>';
          return;
        }

        chatTitle.innerText = (data.lead.name || 'Unknown') + ' (' + data.lead.whatsapp_number + ')';
        chatSubtitle.innerText = (data.lead.place || 'Unknown place') + ' • ' + (data.lead.interested_product || 'No product yet');

        if (!data.conversation || data.conversation.length === 0) {
          chatBody.innerHTML = '<div class="empty-state">No messages recorded for this user yet.</div>';
          return;
        }

        chatBody.innerHTML = data.conversation.map(m => {
          const isUser = m.role === 'user';
          const formatted = (m.message || '').replace(/\\*(.*?)\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>');
          return \`
            <div class="msg \${isUser ? 'user' : 'bot'}">
              <div>\${formatted}</div>
              <div class="time">\${(m.timestamp || '').slice(11, 16) || ''}</div>
            </div>
          \`;
        }).join('');

        chatBody.scrollTop = chatBody.scrollHeight;
      } catch (err) {
        chatBody.innerHTML = '<div class="empty-state">Failed to load chat history.</div>';
      }
    }

    async function changeStatus(encodedNumber, status) {
      try {
        await fetch('/admin/leads/' + encodedNumber + '/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (e) {
        alert('Failed to update status');
      }
    }
  </script>
</body>
</html>`);
});
