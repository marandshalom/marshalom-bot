const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
... (same as before)`;

// ––– Helper: format customer info –––
function formatCustomerInfo(user) {
  let name = user.first_name || '';
  if (user.last_name) name += ' ' + user.last_name;
  let info = `👤 Customer: ${name}`;
  if (user.username) info += ` (@${user.username})`;
  info += `\n🆔 User ID: ${user.id}`;
  info += `\n🔗 Profile: tg://user?id=${user.id}`;
  return info;
}

// ––– Telegram API helpers –––
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

async function sendPhoto(chatId, photoFileId, caption) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoFileId, caption })
    });
    if (!res.ok) console.error('sendPhoto failed:', res.status, await res.text());
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
    return res.ok;
  } catch(e) { return false; }
}

// ––– Get user's profile photo –––
async function getProfilePhoto(userId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUserProfilePhotos`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, limit: 1 })
    });
    const data = await res.json();
    if (data.ok && data.result.total_count > 0) {
      const photos = data.result.photos[0]; // first photo, largest size at end
      const fileId = photos[photos.length - 1].file_id; // largest
      return fileId;
    }
    return null;
  } catch(e) { return null; }
}

// ––– Gemini –––
async function askGemini(text) {
  if (!GEMINI_API_KEY) return 'busy';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${text}` }] }] })
    });
    const data = await res.json();
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return 'busy';
  } catch(e) { return 'busy'; }
}

// ––– Handler –––
export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).send('Marshalom AI Bot is running! 🤖');
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send('OK');
    const { message } = update;
    const chatId = message.chat.id;
    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    // ––– Owner replies –––
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

    // ––– CUSTOMER MESSAGES –––

    // Helper to send customer info + photo to owner
    async function sendCustomerToOwner(user, question, botReply) {
      const caption = `${formatCustomerInfo(user)}\n\n💬 Question: ${question}\n🤖 Reply: ${botReply}`;
      const photoId = await getProfilePhoto(user.id);
      if (photoId) {
        await sendPhoto(OWNER_CHAT_ID, photoId, caption);
      } else {
        // No photo – send text summary only
        await sendTelegram(OWNER_CHAT_ID, caption + '\n\n(No profile photo available)');
      }
      // Also try forwarding (optional)
      await forwardTelegram(chatId, message.message_id);
    }

    // /test
    if (message.text === '/test') {
      const reply = '✅ Test reply – your message was received!';
      await sendTelegram(chatId, reply);
      await sendCustomerToOwner(message.from, '/test', reply);
      return res.status(200).send('OK');
    }

    // /start
    if (message.text === '/start') {
      const welcome = '✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590';
      await sendTelegram(chatId, welcome);
      await sendCustomerToOwner(message.from, '/start', welcome);
      return res.status(200).send('OK');
    }

    // Voice
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      const reply = '⏳ መልእክትዎ ደርሷል፣ ማርሻሎም በቅርቡ ይደውልልዎታል';
      await sendTelegram(chatId, reply);
      await sendCustomerToOwner(message.from, '🎤 Voice message', reply);
      return res.status(200).send('OK');
    }

    // Text
    if (message.text) {
      const aiReply = await askGemini(message.text);
      const finalReply = aiReply === 'busy' ? '🌟 ... (busy fallback)' : aiReply;
      await sendTelegram(chatId, finalReply);
      await sendCustomerToOwner(message.from, message.text, finalReply);
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    return res.status(200).send('OK');
  }
}