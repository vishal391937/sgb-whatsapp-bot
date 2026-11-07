# 🌾 SGB Agro Industries — WhatsApp AI Chatbot

An AI-powered WhatsApp chatbot for SGB Agro Industries (Koppa, Karnataka).  
Greets customers, displays products, collects leads, stores everything in a database and Excel sheet.

---

## 🚀 Quick Start

### 1. Copy and fill in your `.env` file
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
# or for development with auto-restart:
npm run dev
```

### 4. Expose to internet (for Meta webhook)
```bash
# Install ngrok: https://ngrok.com
ngrok http 3000
# Copy the https URL → paste into Meta webhook settings
```

---

## 🔑 Required API Keys

| Key | Where to get |
|-----|-------------|
| `WHATSAPP_PHONE_NUMBER_ID` | [Meta Developer Console](https://developers.facebook.com) → App → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Same page — Temporary or Permanent token |
| `WHATSAPP_VERIFY_TOKEN` | Any secret string you choose (must match Meta settings) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API Key |
| `GOOGLE_SHEET_ID` | Google Sheets URL → `spreadsheets/d/<THIS_PART>/edit` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Console → IAM → Service Accounts |
| `GOOGLE_PRIVATE_KEY` | Service account JSON → `private_key` field |

---

## 📁 Project Structure

```
sgb-whatsapp-bot/
├── src/
│   ├── index.js              # Server entry point
│   ├── ai/
│   │   └── engine.js         # Gemini AI, language detection, topic guard
│   ├── bot/
│   │   └── flow.js           # Conversation state machine
│   ├── whatsapp/
│   │   ├── webhook.js        # Meta webhook handler
│   │   └── sender.js         # Send WhatsApp messages
│   ├── database/
│   │   └── db.js             # SQLite: leads, conversations, states
│   ├── sheets/
│   │   └── excelSync.js      # Google Sheets + local XLSX export
│   ├── admin/
│   │   └── routes.js         # Admin dashboard & REST API
│   └── products/
│       └── catalog.js        # SGB product catalog data
├── data/
│   ├── sgb_leads.db          # SQLite database (auto-created)
│   └── sgb_leads.xlsx        # Excel export (auto-created)
├── .env.example
├── .gitignore
└── package.json
```

---

## 🌐 Supported Languages

The bot **automatically detects** the customer's language and replies in the same language:

| Language | Script |
|----------|--------|
| **Kannada** | ಕನ್ನಡ |
| **Hindi** | हिंदी |
| **English** | English |

---

## 🛡️ Topic Guard

The bot **will NOT answer** questions unrelated to SGB Agro Industries.

**Allowed topics:**
- SGB product information
- Product usage, features, comparisons
- Company location, contact
- Pricing inquiries

**Denied topics:**
- General knowledge, politics, sports, etc.
- Other company products
- Personal topics unrelated to farming

---

## 📊 Admin Dashboard

After starting the server, open:  
`http://localhost:3000/admin/dashboard`

Features:
- View all leads in a table
- See lead status (new / interested / contacted / converted)
- Download Excel file
- View full conversation history per lead

---

## 🔄 Conversation Flow

```
Ad Click → WhatsApp Opens
    ↓
Bot: Welcome + Show All Products
    ↓
Bot: "What's your name?"
    ↓
Bot: "Which city/village?"
    ↓
Bot: "Which product interests you?"
    ↓
Lead Saved to DB + Google Sheets
    ↓
Free AI Chat (SGB topics only)
```

---

## 📦 Products Covered

1. SGB 143R Brush Cutter (43CC)
2. SGB BC-520 Brush Cutter (52CC)
3. SGB G45L Brush Cutter (45CC)
4. SGB Brush Cutter Trolley
5. SGB Brush Cutter Tiller Attachment
6. SGB Cycle Weeder
7. SGB Wheel Barrow / Carry Cart
8. Accessories & Spare Parts

---

## 🚢 Deployment

### Railway (Recommended — Free)
1. Push code to GitHub
2. Connect repo at [railway.app](https://railway.app)
3. Add environment variables
4. Deploy → get public URL for Meta webhook

### Render
1. Connect GitHub repo at [render.com](https://render.com)
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

