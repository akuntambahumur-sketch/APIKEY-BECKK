const nodemailer = require('nodemailer');

// Ambil info akun Gmail dari Environment Variables Vercel
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
// Ambil API Key rahasia Anda
const PROYEK_API_KEY = process.env.PROYEK_API_KEY;

// Email tujuan (misalnya tim support WhatsApp)
const TUJUAN_EMAIL_BANDING = 'support@whatsapp.com'; 

export default async function handler(req, res) {
  // 1. Ambil data dari Bot
  const { nomor, apikey } = req.query;

  // 2. Cek API Key
  if (apikey !== PROYEK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Error: API Key salah.' });
  }

  // 3. Validasi input
  if (!nomor) {
    return res.status(400).json({ success: false, message: 'Error: Nomor wajib diisi.' });
  }

  // 4. Buat koneksi Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  // 5. Tentukan isi email banding (ANDA BISA UBAH INI)
  const subjectBanding = `WhatsApp-Hilfeanfrage : +${nomor}`;
  const textBanding = `
habe Problems bei der Registrierung meiner Hallo WhatsApp-Team, mein Name ist Dian. Ich Telefonnummer +${nomor}. Die Meldung 'Anmeldung nicht verfügbar erscheint. Bitte helfent Sie mir, dieses Problem zu lösen.

Terima kasih.
  `;

  const mailOptions = {
    from: GMAIL_USER,                     // Email pengirim (akun Anda)
    to: accessibilty@support.whatsapp.com,             // Email tujuan (Support WA)
    subject: subjectBanding,
    text: textBanding,
  };

  try {
    // 6. Kirim email
    const info = await transporter.sendMail(mailOptions);
    
    // 7. Kirim balasan SUKSES (JSON)
    return res.status(200).json({
      success: true,
      message: `Email banding untuk nomor ${nomor} berhasil dikirim ke ${TUJUAN_EMAIL_BANDING}.`,
      nomor: nomor,
      response: info.response,
    });

  } catch (error) {
    console.error(error);
    // 8. Kirim balasan GAGAL (JSON)
    return res.status(500).json({ 
      success: false, 
      message: `Gagal mengirim email: ${error.message}` 
    });
  }
}
