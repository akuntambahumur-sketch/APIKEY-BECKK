const nodemailer = require('nodemailer');

// Variabel rahasia ini akan diambil dari Vercel
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const PROYEK_API_KEY = process.env.PROYEK_API_KEY;

// 1. PENERIMA EMAIL: Diubah sesuai permintaan Anda
const TUJUAN_EMAIL_BANDING = "accessibilty@support.whatsapp.com, support@supportwhatsapp.com"; 

// Ini adalah fungsi yang akan dijalankan Vercel
module.exports = async (req, res) => {
  // Ambil nomor dan apikey dari bot Anda
  const { nomor, apikey } = req.query;

  // Cek apakah API Key dari bot Anda benar
  if (apikey !== PROYEK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Error: API Key salah.' });
  }

  // Cek apakah bot mengirim nomor
  if (!nomor) {
    return res.status(400).json({ success: false, message: 'Error: Nomor wajib diisi.' });
  }

  // Siapkan koneksi ke Gmail Anda
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER, // Ini akan otomatis memakai 'beckkbanding@gmail.com' (dari Vercel)
      pass: GMAIL_PASS, // Ini adalah Sandi Aplikasi 16 digit (dari Vercel)
    },
  });

  // 2. SUBJEK EMAIL: Diubah ke Bahasa Jerman
  const subjectBanding = `Problem bei der Registrierung: +${nomor}`;
  
  // 3. ISI EMAIL: Teks banding Anda dimasukkan di sini
  const textBanding = `
Hallo WhatsApp-Team,

Mein Name ist Dian. Ich habe Probleme bei der Registrierung meiner Telefonnummer +${nomor}. 
Die Meldung 'Anmeldung nicht verfügbar' erscheint. 

Bitte helfen Sie mir, dieses Problem zu lösen.

Danke.
  `;

  // Opsi email yang akan dikirim
  const mailOptions = {
    from: `"Dian (via Beckk)" <${GMAIL_USER}>`, // Email pengirim
    to: TUJUAN_EMAIL_BANDING,                 // Email tujuan
    subject: subjectBanding,
    text: textBanding,
  };

  try {
    // Kirim email
    const info = await transporter.sendMail(mailOptions);
    
    // Kirim balasan SUKSES (JSON) ke bot Anda
    return res.status(200).json({
      success: true,
      message: `Email banding (Jerman) untuk nomor ${nomor} berhasil dikirim.`,
      nomor: nomor,
      response: info.response,
    });

  } catch (error) {
    // Kirim balasan GAGAL (JSON) ke bot Anda
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: `Gagal mengirim email: ${error.message}` 
    });
  }
};
