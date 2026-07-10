const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch(e) { console.error(e); }
}

async function askGemini(text) {
  try {
    // 💡 መፍትሄ: መጀመሪያ የሚገኙትን ሞዴሎች እንፈትሽ
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    
    // ትክክለኛውን ሞዴል ከዝርዝሩ ውስጥ ይፈልጋል
    const model = listData.models.find(m => m.name === "models/gemini-1.5-flash") ? "models/gemini-1.5-flash" : "models/gemini-pro";
    
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `አንተ የShalom Technology ረዳት ነህ። ደንበኛው የጻፈውን በአማርኛ መልስ። ደንበኛው፡ ${text}` }] }]
      })
    });
    
    const data = await response.json();
    if (data.error) return `API Error: ${data.error.message}`;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "መልስ የለም።";
  } catch(e) {
    return `System Error: ${e.message}`;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  const message = req.body?.message;
  if (!message?.text) return res.status(200).send("OK");
  
  const aiReply = await askGemini(message.text);
  await sendTelegram(message.chat.id, aiReply);
  return res.status(200).send("OK");
}