// =============================================
// Setup Checker — validates all env keys
// Run: node scripts/checkSetup.js
// =============================================

import "dotenv/config";

const checks = [
  {
    key: "WHATSAPP_PHONE_NUMBER_ID",
    label: "WhatsApp Phone Number ID",
    required: true,
    howTo: "Meta Developer Console → App → WhatsApp → API Setup",
  },
  {
    key: "WHATSAPP_ACCESS_TOKEN",
    label: "WhatsApp Access Token",
    required: true,
    howTo: "Meta Developer Console → App → WhatsApp → API Setup → Temporary/Permanent Token",
  },
  {
    key: "WHATSAPP_VERIFY_TOKEN",
    label: "Webhook Verify Token",
    required: true,
    howTo: "Any secret string — must match what you enter in Meta webhook settings",
  },
  {
    key: "GEMINI_API_KEY",
    label: "Google Gemini API Key",
    required: true,
    howTo: "https://aistudio.google.com → Get API Key (free)",
  },
  {
    key: "GOOGLE_SHEET_ID",
    label: "Google Sheet ID",
    required: false,
    howTo: "Google Sheets URL → spreadsheets/d/<SHEET_ID>/edit",
  },
  {
    key: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    label: "Google Service Account Email",
    required: false,
    howTo: "Google Cloud Console → IAM → Service Accounts → Create",
  },
  {
    key: "GOOGLE_PRIVATE_KEY",
    label: "Google Service Account Private Key",
    required: false,
    howTo: "Service account JSON file → private_key field",
  },
];

const PLACEHOLDER_VALUES = [
  "your_phone_number_id_here",
  "your_whatsapp_access_token_here",
  "your_gemini_api_key_here",
  "your_google_sheet_id_here",
  "your_service_account@project.iam.gserviceaccount.com",
  "your_private_key_here",
];

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🌾 SGB Agro Bot — Setup Checker");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

let allGood = true;
let requiredPassed = 0;
let requiredTotal  = checks.filter((c) => c.required).length;

for (const check of checks) {
  const val = process.env[check.key];
  const isSet = val && !PLACEHOLDER_VALUES.includes(val.trim());

  const icon   = isSet ? "✅" : check.required ? "❌" : "⚠️ ";
  const status = isSet ? "SET" : "NOT SET";

  console.log(`${icon}  ${check.label}`);

  if (!isSet) {
    console.log(`    └─ ${check.required ? "REQUIRED" : "Optional"} → ${check.howTo}`);
    if (check.required) allGood = false;
  } else {
    requiredPassed += check.required ? 1 : 0;
    console.log(`    └─ OK (${val.slice(0, 8)}...)`);
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
if (allGood) {
  console.log("  🎉 All required keys are set! Run: npm start");
} else {
  console.log(`  ⚠️  ${requiredTotal - requiredPassed}/${requiredTotal} required keys missing.`);
  console.log("  Edit your .env file and re-run: node scripts/checkSetup.js");
}
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

