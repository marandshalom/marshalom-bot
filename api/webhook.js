const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ረዳት። አማርኛ ብቻ ተጠቀም። አገልግሎቶች: CCTV፣ ኔትወርክ፣ ኦንላይን ገበያ። ዋጋ አትጥቀስ።`;

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
    // 💡 የመጨረሻ መፍትሄ: ሊንኩን ሙሉ በሙሉ ቀይረነዋል
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nደንበኛ፡ ${text}` }] }]
      })
    });
    
    const data = await response.json();
    if (data.error) return `API Error: ${data.error.message}`;
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "መልስ የለም።";
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