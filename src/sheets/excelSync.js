// =============================================
// Excel / Google Sheets Sync
// Writes lead data to Google Sheets in real-time
// Falls back to local XLSX export
// =============================================

import { google } from "googleapis";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { getAllLeads } from "../database/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.join(__dirname, "../../data/sgb_leads.xlsx");

// ── Google Sheets Auth ────────────────────────────────
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key || email.includes("your_service_account")) {
    return null; // Not configured
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// ── Sync a single new lead to Google Sheets ───────────
export async function syncLeadToSheets(lead) {
  const sheets = getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (sheets && sheetId && !sheetId.includes("your_google_sheet")) {
    try {
      await appendToGoogleSheet(sheets, sheetId, lead);
      console.log(`📊 Lead synced to Google Sheets: ${lead.whatsapp_number}`);
    } catch (err) {
      console.warn("⚠️  Google Sheets append failed:", err.message);
      exportToLocalXLSX();
    }
  } else {
    // Fallback: regenerate local Excel file
    exportToLocalXLSX();
    console.log(`📁 Lead saved to local Excel: ${XLSX_PATH}`);
  }
}

// ── Append one row to Google Sheet ───────────────────
async function appendToGoogleSheet(sheets, spreadsheetId, lead) {
  const row = [
    lead.whatsapp_number || "",
    lead.name            || "",
    lead.place           || "",
    lead.interested_product || "",
    lead.language        || "",
    lead.status          || "new",
    lead.created_at      || new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Leads!A:G",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

// ── Ensure headers exist on first use ─────────────────
export async function ensureSheetHeaders() {
  const sheets = getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheets || !sheetId || sheetId.includes("your_google_sheet")) return;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Leads!A1:G1",
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Leads!A1:G1",
        valueInputOption: "RAW",
        requestBody: {
          values: [[
            "WhatsApp Number",
            "Name",
            "Place",
            "Interested Product",
            "Language",
            "Status",
            "Date",
          ]],
        },
      });
      console.log("📊 Google Sheets headers created");
    }
  } catch (err) {
    console.warn("⚠️  Could not check/create Sheet headers:", err.message);
  }
}

// ── Export ALL leads to local XLSX file ──────────────
export function exportToLocalXLSX() {
  try {
    const leads = getAllLeads();

    const rows = leads.map((l) => ({
      "WhatsApp Number":    l.whatsapp_number,
      "Name":               l.name           || "",
      "Place":              l.place          || "",
      "Interested Product": l.interested_product || "",
      "Language":           l.language       || "",
      "Status":             l.status         || "new",
      "Date":               l.created_at     || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, XLSX_PATH);
    console.log(`📁 Excel exported: ${XLSX_PATH} (${rows.length} leads)`);
  } catch (err) {
    console.error("❌ XLSX export failed:", err.message);
  }
}

