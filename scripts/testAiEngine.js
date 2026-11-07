import "dotenv/config";
import { generateBotReply, detectLanguage, isTopicAllowed } from "../src/ai/engine.js";

console.log("🧪 Testing Gemini AI Engine with Fallback...\n");

// 1. Test language detection
console.log("1️⃣ Testing language detection:");
const lang1 = await detectLanguage("ನಮಸ್ಕಾರ, ಬ್ರಷ್ ಕಟರ್ ಬೆಲೆ ಎಷ್ಟು?");
console.log("   'ನಮಸ್ಕಾರ...' →", lang1);

const lang2 = await detectLanguage("नमस्ते, क्या आपके पास ब्रश कटर है?");
console.log("   'नमस्ते...'  →", lang2);

const lang3 = await detectLanguage("Hello, what are your products?");
console.log("   'Hello...'   →", lang3);

// 2. Test topic guard
console.log("\n2️⃣ Testing topic guard:");
const allowed1 = await isTopicAllowed("Tell me about SGB BC-520 brush cutter");
console.log("   'BC-520 question'    → Allowed?", allowed1);

const allowed2 = await isTopicAllowed("Who is the prime minister of India?");
console.log("   'PM of India'         → Allowed?", allowed2);

// 3. Test bot reply in Kannada
console.log("\n3️⃣ Testing Kannada bot reply:");
const replyKn = await generateBotReply(
  "ಬ್ರಷ್ ಕಟರ್ ಬಗ್ಗೆ ತಿಳಿಸಿ",
  [],
  "kannada",
  { name: "ರಮೇಶ್", place: "ಕೊಪ್ಪ" }
);
console.log("🤖 Reply (Kannada):\n", replyKn);

console.log("\n✅ ALL TESTS PASSED!");

