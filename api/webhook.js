const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ረዳት። ደንበኛው በምን ቋንቋ ቢጽፍ በዚያው ምላሽ ስጥ። 
ስብዕና: ወዳጃዊ፣ ተፈጥሯዊ። አገልግሎቶች: CCTV ካሜራ (ገጠማ/ጥገና)، የኔትወርክ ገጠማ። 
ዋጋ አትጥቀስ: "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን" በል።`;

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function askGemini(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${text}` }] }] })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch(e) { return null; }
}

export default async function handler(req, res) {
  const { message } = req.body;
  if (!message) return res.status(200).send("OK");
  
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || "ደንበኛ";

  // 1. /start ለWelcome message
  if (message.text === "/start") {
    await sendTelegram(chatId, "✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590");
    return res.status(200).send("OK");
  }

  // 2. የድምጽ መልእክት (Voice Notification)
  if (message.voice) {
    await sendTelegram(OWNER_CHAT_ID, `🎤 አዲስ የድምጽ መልእክት ከ ${firstName} መጣ!`);
    await sendTelegram(chatId, "⏳ የድምጽ መልእክትዎን ተቀብለናል፣ ማርሻሎም በቅርቡ ይደውልልዎታል!");
    return res.status(200).send("OK");
  }

  // 3. የጽሁፍ መልእክት እና AI
  if (message.text) {
    const aiReply = await askGemini(message.text);
    
    if (aiReply) {
      await sendTelegram(chatId, aiReply);
      // ለአንተ ሪፖርት መላክ
      await sendTelegram(OWNER_CHAT_ID, `👤 ${firstName}:\n${message.text}\n\n🤖 AI:\n${aiReply}`);
    } else {
      // AI ካልሰራ (የአስቸኳይ መልእክት)
      await sendTelegram(chatId, "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\n\nሰላም! መልእክትዎን ተቀብለናል፣ አሁን ላይ እጅግ ብዙ ጥያቄዎችን በማስተናገድ ላይ ነን።\n\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ 'አስቸኳይ' ብለው ይጻፉ።");
    }
  }
  return res.status(200).send("OK");
}
