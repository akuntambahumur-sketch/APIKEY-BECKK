const nodemailer = require('nodemailer');

// Ambil info akun Gmail dari Environment Variables Vercel
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
// Ambil API Key rahasia Anda
const PROYEK_API_KEY = process.env.PROYEK_API_KEY;

export default async function handler(req, res) {
  // 1. Ambil data dari Bot (via query URL)
  const { email, pesan, apikey } = req.query;

  // 2. Cek API Key (SANGAT PENTING untuk keamanan)
  if (apikey !== PROYEK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Error: API Key salah.' });
  }

  // 3. Validasi input
  if (!email || !pesan) {
    return res.status(400).json({ success: false, message: 'Error: Email dan Pesan wajib diisi.' });
  }

  // 4. Buat koneksi Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  // 5. Tentukan isi email
  const mailOptions = {
    from: `"BECKK STORE" <${GMAIL_USER}>`, // Email pengirim (akun Anda)
    to: email,                              // Email tujuan (dari perintah user)
    subject: `Pesan Tes dari Bot Anda: ${pesan.substring(0, 20)}...`,
    text: `Ini adalah pesan tes yang dikirim dari bot Anda:\n\n"${pesan}"`,
    html: `<p>Ini adalah pesan tes yang dikirim dari bot Anda:</p><br><blockquote>${pesan}</blockquote>`,
  };

  try {
    // 6. Kirim email
    const info = await transporter.sendMail(mailOptions);
    
    // 7. Kirim balasan SUKSES (JSON)
    return res.status(200).json({
      success: true,
      message: 'Email tes berhasil dikirim!',
      email: email,
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
