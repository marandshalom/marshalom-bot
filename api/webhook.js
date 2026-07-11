const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
የቢዝነሱ ባለቤት ስም ማርሻሎም ነው።
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ በዚያው ምላሽ ስጥ። ፈጽሞ ቋንቋ አትቀይር።
ስብዕና: ተፈጥሯዊ፣ ሙቀት ያለው፣ ወዳጃዊ ሁን። ደንበኛው ብዙ ቢናገር ሙሉ መረጃ ስብስብ።
አገልግሎቶቻችን: CCTV ካሜራ (ገጠማ/ጥገና), የኔትወርክ ገጠማ, የኦንላይን ገበያ ምርቶች ማድረስ።
ስለ ዋጋ: "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን" በል።`;

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${text}` }] }] })
    });
    const data = await response.json();
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "busy";
  } catch(e) { return "busy"; }
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("Marshalom AI Bot is running! 🤖");
  if (req.method !== "POST") return res.status(200).send("OK");
  
  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send("OK");
    const { message } = update;
    const chatId = message.chat.id;
    const isOwner = chatId == OWNER_CHAT_ID; // to prevent forwarding to self

    if (message.text === "/start") {
      const welcomeText = "✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590";
      await sendTelegram(chatId, welcomeText);
      if (!isOwner) {
        await sendTelegram(OWNER_CHAT_ID, `👤 ደንበኛ: ${message.from.first_name}\n💬 ጥያቄ: /start\n\n🤖 መልስ: ${welcomeText}`);
      }
      return res.status(200).send("OK");
    }

    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      const voiceReply = "⏳ መልእክትዎ ደርሷል፣ ማርሻሎም በቅርቡ ይደውልልዎታል!";
      await sendTelegram(chatId, voiceReply);
      if (!isOwner) {
        await sendTelegram(OWNER_CHAT_ID, `👤 ደንበኛ: ${message.from.first_name}\n🎤 ድምጽ መልክት (ተላልፏል)\n\n🤖 መልስ: ${voiceReply}`);
      }
      return res.status(200).send("OK");
    }

    if (message.text) {
      const aiReply = await askGemini(message.text);
      if (aiReply === "busy") {
        const busyReply = "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ስላደረሱን እናመሰግናለን። 🙏\nአሁን ላይ እጅግ በጣም ብዙ ጥያቄዎችን በማስተናገድ ላይ ስለሆንን፣ ትክክለኛ ምላሽ ለእርስዎ ለመስጠት የ Shalom Technology  ፍቃድ በመጠበቅ ላይ እገኛለሁ። ⏳\nአትጨነቁ! መልእክትዎ በአስተማማኝ ሁኔታ ተይዟል። 🤝✨\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ፣ ይህን ቅጽ በመከተል ይላኩልን፦\n\nአስቸኳይ ብለው ይጻፉ።\nየችግሩን ወይም የጥያቄዎን ዝርዝር በአጭሩ ይግለጹ።\n(ምሳሌ፦ አስቸኳይ፣ ካሜራዬ አይሰራም ወይም ሌላ... ) 🚨\nማሳሰቢያ፦ ይህንን የእርሶን ጉዳይ በመረዳት በቀጥታ ወደ ማርሻሎም የግል  (SMS) እልካለው ። ደርሶት፣ በአጭር ጊዜ ውስጥ እራሱ ይደውልልዎታል! 📱";
        await sendTelegram(chatId, busyReply);
        if (!isOwner) {
          await sendTelegram(OWNER_CHAT_ID, `👤 ደንበኛ: ${message.from.first_name}\n💬 ጥያቄ: ${message.text}\n\n🤖 መልስ: ${busyReply}`);
        }
      } else {
        await sendTelegram(chatId, aiReply);
        if (!isOwner) {
          await sendTelegram(OWNER_CHAT_ID, `👤 ደንበኛ: ${message.from.first_name}\n💬 ጥያቄ: ${message.text}\n\n🤖 መልስ: ${aiReply}`);
        }
      }
    }
    return res.status(200).send("OK");
  } catch(err) {
    return res.status(200).send("OK");
  }
}