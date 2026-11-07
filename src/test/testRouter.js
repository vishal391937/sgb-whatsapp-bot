// =============================================
// Web Chat Tester — served at /test
// A browser UI to test the bot without WhatsApp
// =============================================

import express from "express";
import { handleMessage } from "../bot/flow.js";
import { getConversationHistory, getLead, getAllLeads } from "../database/db.js";

export const testRouter = express.Router();

// ── POST /test/chat — simulate an incoming message ───
testRouter.post("/chat", async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: "number and message are required" });
  }
  const replies = [];
  globalThis.__SGB_TEST_REPLIES__ = replies;
  globalThis.__SGB_TEST_MODE__    = true;

  try {
    await handleMessage(number, message.trim());
    res.json({ ok: true, replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    globalThis.__SGB_TEST_MODE__    = false;
    globalThis.__SGB_TEST_REPLIES__ = null;
  }
});

// ── GET /test/history/:number — conversation history ─
testRouter.get("/history/:number", (req, res) => {
  const number  = decodeURIComponent(req.params.number);
  const history = getConversationHistory(number, 100);
  const lead    = getLead(number) || {};
  res.json({ lead, history });
});

// ── GET /test — full chat UI ─────────────────────────
testRouter.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SGB Bot Tester</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #e5ddd5; height: 100vh; display: flex; flex-direction: column; }

  .header {
    background: #075e54; color: white; padding: 14px 20px;
    display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 6px #0003;
  }
  .avatar { width: 42px; height: 42px; background: #25d366; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .header-info h2 { font-size: 16px; }
  .header-info p  { font-size: 12px; opacity: 0.8; }
  .header-right { margin-left: auto; display: flex; gap: 10px; align-items: center; }
  .number-input { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
    color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; outline: none; width: 180px; }
  .number-input::placeholder { color: rgba(255,255,255,0.6); }

  .chat-box {
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }

  .bubble {
    max-width: 72%; padding: 8px 12px; border-radius: 8px; font-size: 14px;
    line-height: 1.5; word-wrap: break-word; position: relative;
  }
  .bubble .time { font-size: 10px; opacity: 0.6; margin-top: 4px; text-align: right; }
  .bubble.user { background: #dcf8c6; align-self: flex-end; border-radius: 8px 0 8px 8px; }
  .bubble.bot  { background: #fff;    align-self: flex-start; border-radius: 0 8px 8px 8px;
    box-shadow: 0 1px 2px #0001; }
  .bubble.system { background: #fef9c3; align-self: center; font-size: 12px;
    padding: 4px 10px; border-radius: 12px; color: #856404; }

  .typing { display: none; align-self: flex-start; background: #fff;
    padding: 10px 16px; border-radius: 0 8px 8px 8px; box-shadow: 0 1px 2px #0001; }
  .typing span { display: inline-block; width: 7px; height: 7px; background: #aaa;
    border-radius: 50%; animation: bounce 1s infinite; margin: 0 1px; }
  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }

  .input-bar {
    display: flex; gap: 10px; padding: 12px 16px; background: #f0f0f0;
    border-top: 1px solid #ddd; align-items: center;
  }
  .msg-input {
    flex: 1; padding: 10px 16px; border-radius: 24px; border: none;
    background: white; font-size: 14px; outline: none;
    box-shadow: 0 1px 3px #0001;
  }
  .send-btn {
    width: 44px; height: 44px; border-radius: 50%; background: #075e54; border: none;
    color: white; font-size: 20px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; box-shadow: 0 2px 5px #0002;
  }
  .send-btn:hover { background: #128c7e; }
  .lang-badge { font-size: 11px; background: #25d366; color: white;
    padding: 2px 8px; border-radius: 10px; margin-left: 8px; display: none; }

  /* Lead sidebar */
  .sidebar { width: 280px; background: white; border-left: 1px solid #ddd;
    padding: 16px; overflow-y: auto; display: none; }
  .sidebar.show { display: block; }
  .sidebar h3 { font-size: 14px; color: #075e54; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  .lead-field { margin-bottom: 10px; }
  .lead-field label { font-size: 11px; color: #888; display: block; }
  .lead-field span  { font-size: 13px; font-weight: 500; color: #333; }
  .main { display: flex; flex: 1; overflow: hidden; }
</style>
</head>
<body>

<div class="header">
  <div class="avatar">🌾</div>
  <div class="header-info">
    <h2>SGB Agro Industries Bot</h2>
    <p id="statusText">WhatsApp Bot Tester</p>
  </div>
  <div class="header-right">
    <span class="lang-badge" id="langBadge">EN</span>
    <input class="number-input" id="phoneNumber" placeholder="+91 phone number" value="+919000000001">
    <button onclick="toggleSidebar()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;padding:6px 12px;border-radius:16px;cursor:pointer;font-size:12px;">
      Lead Info
    </button>
  </div>
</div>

<div class="main">
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
    <div class="chat-box" id="chatBox">
      <div class="bubble system">🔵 This is a local bot simulator. Send any message to start!</div>
    </div>
    <div class="typing" id="typingIndicator">
      <span></span><span></span><span></span>
    </div>
    <div class="input-bar">
      <input class="msg-input" id="msgInput" placeholder="Type a message..." autofocus>
      <button class="send-btn" onclick="sendMessage()">➤</button>
    </div>
  </div>
  <div class="sidebar" id="sidebar">
    <h3>👤 Lead Info</h3>
    <div class="lead-field"><label>WhatsApp</label><span id="lPhone">-</span></div>
    <div class="lead-field"><label>Name</label><span id="lName">-</span></div>
    <div class="lead-field"><label>Place</label><span id="lPlace">-</span></div>
    <div class="lead-field"><label>Interested Product</label><span id="lProduct">-</span></div>
    <div class="lead-field"><label>Language</label><span id="lLang">-</span></div>
    <div class="lead-field"><label>Status</label><span id="lStatus">-</span></div>
    <hr style="margin:12px 0;">
    <button onclick="resetChat()" style="width:100%;padding:8px;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
      🔄 Reset Chat (New Number)
    </button>
    <a href="/admin/dashboard" target="_blank" style="display:block;text-align:center;margin-top:8px;font-size:12px;color:#075e54;">
      📊 Open Admin Dashboard →
    </a>
  </div>
</div>

<script>
  let msgCount = 0;
  const chatBox = document.getElementById('chatBox');
  const typingEl = document.getElementById('typingIndicator');

  function getNumber() {
    return document.getElementById('phoneNumber').value.trim() || '+919000000001';
  }

  function now() {
    return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  }

  function addBubble(text, type) {
    const div = document.createElement('div');
    div.className = 'bubble ' + type;
    // Convert *bold* to <strong>
    const formatted = text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    div.innerHTML = formatted + '<div class="time">' + now() + '</div>';
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showTyping(show) {
    typingEl.style.display = show ? 'flex' : 'none';
    if (show) chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function updateLeadSidebar() {
    try {
      const r = await fetch('/test/history/' + encodeURIComponent(getNumber()));
      const d = await r.json();
      document.getElementById('lPhone').textContent   = getNumber();
      document.getElementById('lName').textContent    = d.lead?.name || '-';
      document.getElementById('lPlace').textContent   = d.lead?.place || '-';
      document.getElementById('lProduct').textContent = d.lead?.interested_product || '-';
      document.getElementById('lLang').textContent    = d.lead?.language || '-';
      document.getElementById('lStatus').textContent  = d.lead?.status || '-';

      const lang = d.lead?.language;
      if (lang) {
        const badge = document.getElementById('langBadge');
        badge.textContent = lang === 'kannada' ? 'ಕನ್ನಡ' : lang === 'hindi' ? 'हिंदी' : 'EN';
        badge.style.display = 'inline';
      }
    } catch(e) {}
  }

  async function sendMessage() {
    const input = document.getElementById('msgInput');
    const text  = input.value.trim();
    if (!text) return;

    input.value = '';
    addBubble(text, 'user');
    showTyping(true);

    try {
      const res = await fetch('/test/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: getNumber(), message: text })
      });
      const data = await res.json();

      showTyping(false);

      if (data.replies && data.replies.length > 0) {
        for (const reply of data.replies) {
          addBubble(reply, 'bot');
        }
      } else if (data.error) {
        addBubble('❌ Error: ' + data.error, 'system');
      }

      await updateLeadSidebar();
    } catch(err) {
      showTyping(false);
      addBubble('❌ Could not reach bot server.', 'system');
    }
  }

  document.getElementById('msgInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
  }

  function resetChat() {
    const n = '+91900000000' + Math.floor(Math.random()*9+1);
    document.getElementById('phoneNumber').value = n;
    document.getElementById('statusText').textContent = 'New session: ' + n;
    chatBox.innerHTML = '<div class="bubble system">🔵 New session started. Send a message!</div>';
    document.getElementById('lName').textContent = '-';
    document.getElementById('lPlace').textContent = '-';
    document.getElementById('lProduct').textContent = '-';
  }
</script>
</body>
</html>`);
});

