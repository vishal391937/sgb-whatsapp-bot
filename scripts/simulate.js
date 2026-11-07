// =============================================
// Local Test Simulator
// Simulates WhatsApp conversations in terminal
// Run: node scripts/simulate.js
// No real WhatsApp account needed to test!
// =============================================

import "dotenv/config";
import readline from "readline";
import { initDatabase } from "../src/database/db.js";
import { handleMessage } from "../src/bot/flow.js";

// Fake "send" — override sender.js in test mode
process.env.WHATSAPP_PHONE_NUMBER_ID = "test_mode";
process.env.WHATSAPP_ACCESS_TOKEN    = "test_mode";

// Monkey-patch sender to print instead of HTTP call
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Patch the sender module via global override
globalThis.__SGB_TEST_MODE__ = true;

const TEST_NUMBER = "+919876543210"; // Simulated customer number

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🌾 SGB Agro Bot — Local Conversation Simulator");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Simulating customer: ${TEST_NUMBER}`);
console.log("  Type your message and press ENTER.");
console.log("  Type 'quit' to exit.\n");

await initDatabase();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("👤 You: ", async (input) => {
    input = input.trim();
    if (!input || input.toLowerCase() === "quit") {
      console.log("\n👋 Simulation ended.\n");
      rl.close();
      process.exit(0);
    }

    try {
      await handleMessage(TEST_NUMBER, input);
    } catch (err) {
      console.error("❌ Bot error:", err.message);
    }

    prompt();
  });
}

prompt();

