const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const axios = require('axios');

// ==========================
// KONFIGURASI DASAR
// ==========================
// PASTIKAN ANDA SUDAH MENGATUR INI DI ENVIRONMENT VARIABLES VERCEL
// JANGAN TULIS TOKEN ATAU API KEY DI SINI
const BOT_TOKEN = process.env.BOT_TOKEN || 'TOKEN_BOT_TELEGRAM_ANDA';
const API_KEY = process.env.API_KEY || 'API_KEY_ANDA';

// Ini adalah API "DAPUR" yang Anda panggil
const BASE_URL = 'https://apikeybeckk.vercel.app/api'; 
const ADMIN_ID = 7916275798; // Ganti dengan ID Admin Anda

const bot = new Telegraf(BOT_TOKEN);
const userCooldowns = {}; // { userId: timestamp_end_cooldown }

// ==========================
// HELPER FUNCTION UMUM
// ==========================

function formatResult(data) {
  let out = '📨 *Hasil API:*\n';
  if (data.success !== undefined)
    out += `• Status: ${data.success ? '✅ Berhasil' : '❌ Gagal'}\n`;
  if (data.message) out += `• Pesan: ${data.message}\n`;
  if (data.nomor) out += `• Nomor: ${data.nomor}\n`;
  if (data.email) out += `• Email: ${data.email}\n`;
  if (data.subject) out += `• Subjek: ${data.subject}\n`;
  if (data.response) out += `• Respon: ${data.response}\n`;
  return out;
}

// Helper: panggil API "DAPUR"
async function callApi(endpoint, params = {}) {
  const url = new URL(BASE_URL + endpoint);
  params.apikey = API_KEY;
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
        // Jika Vercel membalas dengan 404 atau 500, ini akan menangkapnya
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  } catch (err) {
    console.error("Gagal memanggil API:", err.message);
    // Kembalikan objek error yang konsisten
    return { success: false, message: `Gagal terhubung ke API: ${err.message}` };
  }
}

// ==========================
// COOLDOWN (Fungsi ini aman)
// ==========================

function startCooldown(ctx, userId, seconds = 120) {
  userCooldowns[userId] = Date.now() + seconds * 1000;
  let elapsed = 0;

  ctx.reply(
    `⏳ *Cooldown Dimulai!*\nProgress: 0/${seconds}`,
    { parse_mode: 'Markdown' }
  ).then(message => {
    const interval = setInterval(async () => {
      elapsed++;
      const remaining = seconds - elapsed;
      const percent = Math.floor((elapsed / seconds) * 100);
      const filledBlocks = Math.floor((elapsed / seconds) * 20);
      const bar = '█'.repeat(filledBlocks) + '░'.repeat(20 - filledBlocks);

      try {
        if (remaining > 0) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            message.message_id,
            undefined,
            `⏳ *Cooldown Berjalan...*\n[${bar}] ${elapsed}/${seconds}s (${percent}%)`,
            { parse_mode: 'Markdown' }
          );
        } else {
          clearInterval(interval);
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            message.message_id,
            undefined,
            `✅ *Cooldown Selesai!*\nAnda bisa menggunakan perintah lagi.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (err) {
        clearInterval(interval);
        console.error('Cooldown update error:', err.message);
      }
    }, 1000); // Update setiap 1 detik
  });
}

// ==========================
// DASHBOARD MENU
// ==========================
function dashboardText() {
  return (
    '🏠 *Dashboard Bot*\n' +
    '──────────────────────\n' +
    '📌 *Menu Utama*\n\n' +
    '• ⚙️  *Status Server*\n' +
    '  └ Periksa koneksi dan status SMTP.\n\n' +
    '• 📲  *Mode Fixto (Fix Merah 🔴)*\n' +
    '  └ Cek nomor WhatsApp secara cepat dan efisien.\n\n' +
    '• ✉️  *Test Kirim Email*\n' +
    '  └ Uji kirim email melalui server SMTP.\n\n' +
    '──────────────────────\n'
  );
}

function dashboardMenu() {
  return {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚡ Status Server', callback_data: 'status' }],
        [
          { text: '📲 Mode Fixto', callback_data: 'fixto' },
          { text: '✉️ Test Email', callback_data: 'testsend' }
        ],
        [{ text: '🛠️ Refresh Dashboard', callback_data: 'menu' }]
      ]
    }
  };
}

// 🎯 Command /start → kirim dashboard utama
bot.start((ctx) => {
  ctx.replyWithMarkdown(dashboardText(), dashboardMenu());
});

// Handler tombol utama dashboard
bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const msgId = ctx.callbackQuery.message.message_id;
  const chatId = ctx.callbackQuery.message.chat.id;

  try {
    // 🏠 DASHBOARD UTAMA
    if (action === 'menu') {
      await ctx.telegram.editMessageText(
        chatId,
        msgId,
        undefined,
        dashboardText(),
        dashboardMenu()
      );
      return;
    }

    // ⚡ STATUS SERVER
    if (action === 'status') {
      const data = await callApi('/status'); // Panggil DAPUR

      const statusText = `
📊 *STATUS SERVER*
━━━━━━━━━━━━━━━
📦 *Total Email:* ${data.total_email || 'N/A'}
✅ *Connect:* ${data.connect || 'N/A'}
❌ *Disconnect:* ${data.disconnect || 'N/A'}
🚀 *${data.message || 'Service tidak merespon'}*
`.trim();

      await ctx.telegram.editMessageText(
        chatId,
        msgId,
        undefined,
        statusText,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 Dashboard', callback_data: 'menu' }],
              [{ text: '🔄 Refresh', callback_data: 'status' }]
            ]
          }
        }
      );
      return;
    }

    // 📲 MODE FIXTO
    if (action === 'fixto') {
      await ctx.telegram.editMessageText(
        chatId,
        msgId,
        undefined,
        '📲 *Mode Fixto*\n' +
          'Gunakan perintah: `/fixto <nomor>`\n' +
          '_Contoh:_ `/fixto 628123456789`',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🏠 Dashboard', callback_data: 'menu' }]]
          }
        }
      );
      return;
    }

    // ✉️ TEST EMAIL
    if (action === 'testsend') {
      await ctx.telegram.editMessageText(
        chatId,
        msgId,
        undefined,
        '✉️ *Test Kirim Email*\n' +
          'Gunakan perintah:\n' +
          '`/testsend <email> <pesan>`\n\n' +
          '_Contoh:_\n' +
          '`/testsend user@mail.com Halo ini tes`',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🏠 Dashboard', callback_data: 'menu' }]]
          }
        }
      );
      return;
    }

  } catch (err) {
    console.error('Callback Error:', err);
    await ctx.answerCbQuery(`❌ Error: ${err.message}`, { show_alert: true });
  }

  await ctx.answerCbQuery();
});

// ==========================
//  COMMANDS UTAMA (FIXTTO & TESTSEND)
// ==========================

bot.command('status', async (ctx) => {
  try {
    const data = await callApi('/status'); // Panggil DAPUR
    const text = `
📊 *STATUS SERVER*
━━━━━━━━━━━━━━━
📦 *Total Email:* ${data.total_email || 'N/A'}
✅ *Connect:* ${data.connect || 'N/A'}
❌ *Disconnect:* ${data.disconnect || 'N/A'}
🚀 *${data.message || 'Service tidak merespon'}*
`;
    await ctx.replyWithMarkdown(text, { disable_web_page_preview: true });
  } catch (err) {
    console.error(err);
    await ctx.reply(`❌ *Error:* ${err.message}`, { parse_mode: 'Markdown' });
  }
});

// /testsend <email> <nomor>
bot.command('testsend', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (!parts[1]) {
    return ctx.reply('❌ Format: /testsend <email> <pesan>');
  }
  const email = parts[1];
  const pesan = parts.slice(2).join(' ');
  if (!pesan) {
    return ctx.reply('❌ Masukkan pesan.\nContoh:\n/testsend email@gmail.com Halo ini tes.');
  }

  try {
    const data = await callApi('/testsend', { email, pesan }); // Panggil DAPUR
    ctx.replyWithMarkdown(formatResult(data));
  } catch (err) {
    ctx.reply(`❌ Error: ${err.message}`);
  }
});

// ==========================
// MODE FIXTO
// ==========================
bot.command('fixto', async (ctx) => {
  const userId = ctx.from.id;
  const now = Date.now();

  const args = ctx.message.text.split(' ').slice(1);
  const nomor = args[0]?.trim();

  if (!nomor) {
    return ctx.reply('⚠️ Contoh:\n/fixto 6281234567890');
  }
  if (!/^\d{8,15}$/.test(nomor)) {
    return ctx.reply('❌ Nomor tidak valid.');
  }

  // Cek cooldown user
  const cooldownEnd = userCooldowns[userId] || 0;
  if (now < cooldownEnd) {
    const wait = Math.ceil((cooldownEnd - now) / 1000);
    return ctx.reply(`🕓 Tunggu ${wait}s sebelum bisa cek nomor lagi.`);
  }

  // Aktifkan cooldown
  startCooldown(ctx, userId, 120);

  try {
    await ctx.reply(`🔍 Memeriksa nomor *${nomor}*...`, { parse_mode: 'Markdown' });
    const data = await callApi('/fixto', { nomor }); // Panggil DAPUR
    await ctx.replyWithMarkdown(`✅ *Hasil nomor ${nomor}:*\n${formatResult(data)}`);
  } catch (err) {
    await ctx.reply(`❌ Terjadi kesalahan: ${err.message}`);
  }
});


// ==========================
// WEBHOOK HANDLER UNTUK VERCEL
// ==========================

// Ini adalah bagian terpenting untuk Vercel
// Ini menggantikan bot.launch()
module.exports = async (req, res) => {
    try {
        // Pastikan ini adalah request POST (dari Telegram)
        if (req.method !== 'POST') {
          res.status(405).send('Method Not Allowed');
          return;
        }
        
        // 'bot' adalah instance Telegraf Anda
        await bot.handleUpdate(req.body, res);
        
    } catch (err) {
        console.error('Error handling update:', err.message);
        res.status(500).send('Internal Server Error');
    }
};
