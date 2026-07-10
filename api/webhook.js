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

    // 1. አዲሱ መጨመር: /start ሲላክ
    if (message.text === "/start") {
      await sendTelegram(chatId, "✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590");
      return res.status(200).send("OK");
    }

    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(OWNER_CHAT_ID, `🎤 ድምጽ!\n👤 ${firstName} (${username})`);
      await sendTelegram(chatId, "⏳ ድምጽ መልእክትዎን ተቀብለናል!\nባለቤቱ በቅርቡ ይደውሉልዎታል! 😊");
      return res.status(200).send("OK");
    }

    if (message.text) {
      const aiReply = await askGemini(message.text);
      
      // 2. አዲሱ መጨመር: AI ካልሰራ (ማለትም "ይቅርታ..." የሚለው ሲመለስ) የ"አስቸኳይ" መልእክት ላክ
      if (aiReply.includes("ይቅርታ")) {
        await sendTelegram(chatId, "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ተቀብለናል፣ ቡድናችን በቅርቡ ምላሽ ይሰጥዎታል። 🙏\n\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ 'አስቸኳይ' ብለው ይጻፉ።");
      } else {
        await sendTelegram(chatId, aiReply);
        const reportText = `👤 ደንበኛ: ${firstName} (${username})\n💬 የጻፈው ጥያቄ: ${message.text}\n\n🤖 የ AI መልስ:\n${aiReply}`;
        await sendTelegram(OWNER_CHAT_ID, reportText);
      }
    }
    return res.status(200).send("OK");
  } catch(err) {
    console.error("Handler error:", err);
    return res.status(200).send("OK");
  }
}
