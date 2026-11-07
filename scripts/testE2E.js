import "dotenv/config";
import { initDatabase, getLead, getConversationHistory, getAllLeads } from "../src/database/db.js";
import { handleMessage } from "../src/bot/flow.js";

async function runEndToEndTest() {
  console.log("🧪 Starting End-to-End Conversation Flow & Lead Generation Test...\n");
  await initDatabase();

  const testNumber = "+919988776655";

  // Mock reply capturer
  const capturedReplies = [];
  globalThis.__SGB_TEST_MODE__ = true;
  globalThis.__SGB_TEST_REPLIES__ = capturedReplies;

  console.log("Step 1: User sends initial greeting (from social media ad)...");
  await handleMessage(testNumber, "Hi, I saw your ad on Facebook");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 2: User gives their Name...");
  await handleMessage(testNumber, "My name is Ramesh Gowda");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 3: User gives their Place...");
  await handleMessage(testNumber, "I am from Koppa, Chikkamagaluru");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 4: User states interested product...");
  await handleMessage(testNumber, "I want to buy the SGB BC-520 Brush Cutter for my areca nut farm");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 5: User asks an unrelated question (Topic Guard check)...");
  await handleMessage(testNumber, "Can you tell me how to make chicken biryani?");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\nStep 6: User asks a valid product question in Kannada...");
  await handleMessage(testNumber, "ಬ್ರಷ್ ಕಟರ್ ಜೊತೆ ಟ್ರಾಲಿ ಸಿಗುತ್ತಾ?");
  console.log("-> Bot captured replies:", capturedReplies.length);
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  // Verify Lead in Database
  console.log("\n🔍 Verifying Database records for:", testNumber);
  const lead = getLead(testNumber);
  console.log("Lead in DB:", JSON.stringify(lead, null, 2));

  const history = getConversationHistory(testNumber, 10);
  console.log(`Total messages in history: ${history.length}`);

  if (lead && lead.name && lead.place && lead.interested_product) {
    console.log("\n✅ E2E TEST COMPLETED SUCCESSFULLY! Lead captured & saved to DB.");
  } else {
    console.log("\n⚠️ Lead data partially captured. Check step parsing.");
  }
}

runEndToEndTest().catch(console.error);

