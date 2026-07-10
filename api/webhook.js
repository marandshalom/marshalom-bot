const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
ባለቤት: ማርሻሎም
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ በዚያው ምላሽ ስጥ። 
ስብዕና: ተፈጥሯዊ፣ ወዳጃዊ፣ ሙቀት ያለው።
አገልግሎቶች: CCTV ካሜራ (ገጠማ/ጥገና)، የኔትወርክ ገጠማ፣ ኤሌክትሮኒክስ ምርቶች።
ዋጋ: ምንም ቁጥር አትጥቀስ። እንዲህ በል: "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን"። ሁሉም ሲሟላ: "ማርሻሎም በቅርቡ ይደውልልሃል"።`;

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch(e) { console.error("sendTelegram error:", e); }
}

async function askGemini(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const combinedPrompt = `${SYSTEM_PROMPT}\n\nምላሽ ስጥ፦ ${text}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: combinedPrompt }] }] })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch(e) { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("Bot is running!");
  
  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send("OK");
  
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || "ደንበኛ";
  
  // የደንበኛ መለያ (እዚህ ጋር KV ወይም Database መኖር አለበት - ለምሳሌነት የ localStorage/DB logic)
  const isNew = true; // ይህንን ከDB ጋር ያገናኙት

  const aiReply = await askGemini(message.text);
  
  if (aiReply) {
    await sendTelegram(chatId, aiReply);
  } else {
    if (isNew) {
      await sendTelegram(chatId, "✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\nእኛ በኤሌክትሮኒክስ እና በደህንነት ካሜራዎች ላይ ጥራት ያለው አገልግሎት እንሰጣለን። ✅\n\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n\n📞 ለበለጠ መረጃ፡ 0931556590");
    } else {
      await sendTelegram(chatId, "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ተቀብለናል፣ ቡድናችን በቅርቡ ምላሽ ይሰጥዎታል። 🙏\n\n⚠️ አስቸኳይ ከሆነ 'አስቸኳይ' ብለው ይጻፉ።");
    }
  }
  return res.status(200).send("OK");
}
