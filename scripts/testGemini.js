// Quick Gemini API live test
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;

const body = {
  contents: [{ parts: [{ text: "Reply in exactly one sentence: What is the SGB BC-520 Brush Cutter used for?" }] }],
  generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
};

console.log("🧪 Testing Gemini API...\n");

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

const data = await res.json();

if (res.ok) {
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("✅ Gemini API working!\n");
  console.log("🤖 Test reply:", reply);
} else {
  console.error("❌ Gemini API error:", JSON.stringify(data, null, 2));
}

