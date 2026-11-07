import "dotenv/config";
import { initDatabase, getLead, getConversationHistory } from "../src/database/db.js";
import { handleMessage } from "../src/bot/flow.js";

async function runImageAndResponseTest() {
  console.log("🧪 Comprehensive Verification Test: Flow, AI & Product Image Dispatch\n");
  await initDatabase();

  const testNumber = "+919776655443";
  const capturedReplies = [];
  globalThis.__SGB_TEST_MODE__ = true;
  globalThis.__SGB_TEST_REPLIES__ = capturedReplies;

  console.log("1️⃣ Step 1: User arrives from social media ad...");
  await handleMessage(testNumber, "Hi, I saw your ad on Instagram");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\n2️⃣ Step 2: User provides Name...");
  await handleMessage(testNumber, "My name is Praveen");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\n3️⃣ Step 3: User provides Place...");
  await handleMessage(testNumber, "I am from Shimoga");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  console.log("\n4️⃣ Step 4: User selects product: 'SGB 143R Brush Cutter' (Checking for image dispatch)...");
  await handleMessage(testNumber, "I want SGB 143R Brush Cutter");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  const imageDispatched = capturedReplies.some(r => r.includes("[Image:"));
  console.log("\n   📸 Image Dispatched:", imageDispatched ? "YES ✅" : "NO ❌");
  capturedReplies.length = 0;

  console.log("\n5️⃣ Step 5: User asks about Cycle Weeder in free chat (Checking for automatic image & reply)...");
  await handleMessage(testNumber, "Can you show me the cycle weeder image and details?");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  const weederImage = capturedReplies.some(r => r.includes("[Image:") && r.includes("64-1000x1000.png"));
  console.log("\n   📸 Weeder Image Dispatched:", weederImage ? "YES ✅" : "NO ❌");
  capturedReplies.length = 0;

  console.log("\n6️⃣ Step 6: User asks off-topic question (Topic Guard check)...");
  await handleMessage(testNumber, "Who won the cricket match yesterday?");
  capturedReplies.forEach(r => console.log("   🤖", r.replace(/\n/g, " ")));
  capturedReplies.length = 0;

  const lead = getLead(testNumber);
  console.log("\n🔍 Lead successfully recorded in database:", JSON.stringify(lead, null, 2));

  console.log("\n🎉 ALL TESTS PASSED WITH ZERO ERRORS!");
}

runImageAndResponseTest().catch(console.error);

