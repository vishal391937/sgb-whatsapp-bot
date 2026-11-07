// List available Gemini models for this API key
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log("🔍 Fetching available Gemini models...\n");

const res  = await fetch(url);
const data = await res.json();

if (!res.ok) {
  console.error("❌ Error:", JSON.stringify(data, null, 2));
  process.exit(1);
}

const models = data.models || [];
const chatModels = models.filter(m =>
  m.supportedGenerationMethods?.includes("generateContent")
);

console.log(`✅ Found ${chatModels.length} models that support generateContent:\n`);
chatModels.forEach(m => console.log(" •", m.name));

