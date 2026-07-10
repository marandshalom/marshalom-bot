const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት። 
ቋንቋ: አማርኛ ብቻ። ፈጽሞ ቋንቋ አትቀይር። 
ስብዕና: ወዳጃዊ ሁን። 
አገልግሎቶች: CCTV ካሜራ ገጠማ፣ ጥገና፣ የኔትወርክ ገጠማ፣ የኦንላይን ገበያ።
ዋጋ: ምንም ቁጥር አትጥቀስ። "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን" በል።`;

async function sendTelegram(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    return await res.json();
  } catch(e) { return null; }
}

async function askGemini(text) {
  try {
    // 💡 የተረጋጋው ሞዴል: gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nደንበኛ፡ ${text}` }] }]
      })
    });
    
    const data = await response.json();
    
    // 🔍 ስህተት ካለ በቴሌግራም ላይ በግልጽ እንዲያሳይህ ተደርጓል
    if (data.error) {
        return `❌ API Error: ${data.error.message}`;
    }
    
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return "❌ የጌሚኒ መልስ አልተገኘም።";
  } catch(e) {
    return `❌ System Error: ${e.message}`;
  }
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  try {
    const message = req.body?.message;
    if (!message || !message.text) return res.status(200).send("OK");
    
    const aiReply = await askGemini(message.text);
    await sendTelegram(message.chat.id, aiReply);
    return res.status(200).send("OK");
  } catch(err) {
    return res.status(200).send("OK");
  }
}