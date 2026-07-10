const TELEGRAM_TOKEN = "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// 💡 ከዝርዝርህ ውስጥ የተረጋጋውን ሞዴል መረጥን
const MODEL_NAME = "models/gemini-2.0-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  const message = req.body?.message;
  if (!message?.text) return res.status(200).send("OK");

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `አንተ የShalom Technology ረዳት ነህ። አማርኛ ብቻ ተጠቀም። ደንበኛ፡ ${message.text}` }] }]
      })
    });

    const data = await response.json();
    
    // መልሱን ያወጣል ወይም ስህተቱን በግልጽ ያሳያል
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || `ስህተት: ${JSON.stringify(data.error?.message)}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: message.chat.id, text: reply })
    });
  } catch (e) {
    console.error(e);
  }
  return res.status(200).send("OK");
}