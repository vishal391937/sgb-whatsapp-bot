import "dotenv/config";
import { initDatabase, getLead, getConversationHistory } from "../src/database/db.js";
import { handleMessage } from "../src/bot/flow.js";

async function runHindiE2ETest() {
  console.log("🧪 Starting Hindi End-to-End Conversation Flow Test...\n");
  await initDatabase();

  const testNumber = "+919112233445";
  const capturedReplies = [];
  globalThis.__SGB_TEST_MODE__ = true;
  globalThis.__SGB_TEST_REPLIES__ = capturedReplies;

  console.log("Step 1: Customer messages in Hindi...");
  await handleMessage(testNumber, "नमस्ते, मैंने आपका विज्ञापन देखा है।");
  console.log("-> Bot replied in Hindi:");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 2: Customer gives name in Hindi...");
  await handleMessage(testNumber, "मेरा नाम सुरेश पाटिल है");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 3: Customer gives place in Hindi...");
  await handleMessage(testNumber, "मैं बेलगाम से हूँ");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 4: Customer asks about Cycle Weeder in Hindi...");
  await handleMessage(testNumber, "मुझे साइकिल वीडर के बारे में जानकारी चाहिए");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 5: Customer asks unrelated question (Topic Guard check in Hindi)...");
  await handleMessage(testNumber, "आज का मौसम कैसा रहेगा?");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  const lead = getLead(testNumber);
  console.log("\n🔍 Lead captured in DB:", JSON.stringify(lead, null, 2));

  if (lead && lead.name && lead.place) {
    console.log("\n✅ HINDI E2E TEST COMPLETED SUCCESSFULLY!");
  }
}

runHindiE2ETest().catch(console.error);

