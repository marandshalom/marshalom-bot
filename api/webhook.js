const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Kp9m6-dSVHPSEMGfNwKymsLya3Apee5ELdKiEWtP0hcg";
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
የቢዝነሱ ባለቤት ስም ማርሻሎም ነው።
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ (አማርኛ፣ እንግሊዝኛ፣ ኦሮምኛ፣ ትግርኛ) በዚያው ምላሽ ስጥ። ፈጽሞ ቋንቋ አትቀይር።
ስብዕና: ተፈጥሯዊ፣ ሙቀት ያለው፣ ወዳጃዊ ሁን። እንደ ሮቦት አትመልስ። ደንበኛው ብዙ ቢናገር ሙሉ መረጃ ስብስብ።
አገልግሎቶቻችን:
1. CCTV ካሜራ ገጠማ — ለማንኛውም ቦታ (ቤት፣ ቢዝነስ፣ ትምህርት ቤት፣ ሆቴል)
2. CCTV ካሜራ ጥገና — ለማንኛውም ቦታ
3. የኔትወርክ ገጠማ — ለካፌ፣ ትምህርት ቤት፣ ሆቴል፣ ቢዝነስ — ለማንኛውም
4. የኦንላይን ገበያ ምርቶች ማድረስ
ስለ ዋጋ (ፈጽሞ አትጣስ): ምንም ቁጥር አትጥቀስ። እንዲህ በል: "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን"። ሁሉም ሲሟላ: "ማርሻሎም በቅርቡ ይደውልልሃል"
ፈጽሞ እንዳታደርግ: ዋጋ ቁጥር አትጥቀስ፣ ቋንቋ አትቀይር፣ ደንበኛ ሳይጨርስ አትቸኩል`;

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch(e) { console.error("sendTelegram error:", e); }
}

async function forwardTelegram(fromChatId, messageId) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
    });
  } catch(e) { console.error("forwardTelegram error:", e); }
}

async function askGemini(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: text }] }]
      })
    });
    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data));
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    if (data && data.error) {
      console.error("Gemini error:", data.error.message);
    }
    return "ይቅርታ፣ እንደገና ይሞክሩ! 🙏";
  } catch(e) {
    console.error("askGemini error:", e);
    return "ይቅርታ፣ እንደገና ይሞክሩ! 🙏";
  }
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("Marshalom AI Bot is running! 🤖");
  if (req.method !== "POST") return res.status(200).send("OK");
  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send("OK");
    const message = update.message;
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "ደንበኛ";
    const username = message.from?.username ? `@${message.from.username}` : "N/A";

    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(OWNER_CHAT_ID, `🎤 ድምጽ!\n👤 ${firstName} (${username})`);
      await sendTelegram(chatId, "⏳ ድምጽ መልእክትዎን ተቀብለናል!\nባለቤቱ በቅርቡ ይደውሉልዎታል! 😊");
      return res.status(200).send("OK");
    }

    if (message.text) {
      const aiReply = await askGemini(message.text);
      await sendTelegram(chatId, aiReply);
      await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ ጻፈ: ${message.text}\n👤 ${firstName} (${username})`);
    }
    return res.status(200).send("OK");
  } catch(err) {
    console.error("Handler error:", err);
    return res.status(200).send("OK");
  }
}
