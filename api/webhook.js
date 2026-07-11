const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
... (same as before)`;

function formatCustomerInfo(user) {
  let name = user.first_name || '';
  if (user.last_name) name += ' ' + user.last_name;
  let info = `👤 Customer: ${name}`;
  if (user.username) info += ` (@${user.username})`;
  info += `\n🆔 User ID: ${user.id}`;
  info += `\n🔗 Profile: tg://user?id=${user.id}`;
  return info;
}

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!res.ok) console.error('send failed:', res.status, await res.text());
  } catch(e) { console.error(e); }
}

async function forwardTelegram(fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
    });
    if (!res.ok) {
      const errText = await res.text();
      // Send error to owner so you see it
      await sendTelegram(OWNER_CHAT_ID, `❌ Forward error: ${res.status} - ${errText}`);
    }
    return res.ok;
  } catch(e) {
    await sendTelegram(OWNER_CHAT_ID, `❌ Forward exception: ${e.message}`);
    return false;
  }
}

async function askGemini(text) { /* same as before */ }

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).send('Marshalom AI Bot is running! 🤖');
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send('OK');
    const { message } = update;
    const chatId = message.chat.id;
    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    // Owner replies
    if (isOwner) {
      if (message.reply_to_message) {
        const replied = message.reply_to_message;
        let targetChatId = null;
        if (replied.forward_from) targetChatId = replied.forward_from.id;
        else if (replied.forward_from_chat) targetChatId = replied.forward_from_chat.id;
        if (targetChatId && message.text) {
          await sendTelegram(targetChatId, `📩 Reply from Owner:\n${message.text}`);
          await sendTelegram(OWNER_CHAT_ID, '✅ Reply sent.');
        } else {
          await sendTelegram(OWNER_CHAT_ID, 'ℹ️ Reply to a forwarded message.');
        }
        return res.status(200).send('OK');
      }
      if (message.text === '/start') {
        await sendTelegram(OWNER_CHAT_ID, '👋 Owner mode – reply to forwarded messages.');
      }
      return res.status(200).send('OK');
    }

    // --- CUSTOMER ---

    // /test
    if (message.text === '/test') {
      const forwarded = await forwardTelegram(chatId, message.message_id);
      const reply = forwarded ? '✅ Forwarded successfully!' : '⚠️ Forward failed – check owner chat for error.';
      await sendTelegram(chatId, reply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n🧪 /test – Forward success: ${forwarded}`);
      return res.status(200).send('OK');
    }

    // /start
    if (message.text === '/start') {
      await forwardTelegram(chatId, message.message_id);
      const welcome = '✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590';
      await sendTelegram(chatId, welcome);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n📝 /start\n🤖 Reply: ${welcome}`);
      return res.status(200).send('OK');
    }

    // Voice
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      const reply = '⏳ መልእክትዎ ደርሷል፣ ማርሻሎም በቅርቡ ይደውልልዎታል!';
      await sendTelegram(chatId, reply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n🎤 Voice\n🤖 Reply: ${reply}`);
      return res.status(200).send('OK');
    }

    // Text
    if (message.text) {
      const forwardOk = await forwardTelegram(chatId, message.message_id);
      if (!forwardOk) {
        // If forward fails, we still send the summary, but also a note
        await sendTelegram(OWNER_CHAT_ID, `⚠️ Forward failed for this message. Check error above.`);
      }
      const aiReply = await askGemini(message.text);
      let finalReply = aiReply === 'busy' ? '... (busy reply)' : aiReply; // short for testing
      await sendTelegram(chatId, finalReply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n💬 Question: ${message.text}\n🤖 Reply: ${finalReply}`);
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    return res.status(200).send('OK');
  }
}