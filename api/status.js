// Menggunakan Nodemailer untuk mengirim email
const nodemailer = require('nodemailer');

// Ambil info akun Gmail dari Environment Variables Vercel
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS; // Ini adalah App Password, BUKAN password biasa

export default async function handler(req, res) {
  // 1. Cek apakah akun Gmail sudah diatur
  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ 
      success: false, 
      message: 'Akun Gmail (GMAIL_USER / GMAIL_PASS) belum diatur di Vercel.' 
    });
  }

  // 2. Buat koneksi ke Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  try {
    // 3. Verifikasi koneksi ke SMTP Gmail
    await transporter.verify();
    
    // 4. Kirim balasan SUKSES (JSON)
    return res.status(200).json({
      success: true,
      message: 'SMTP (Gmail) Terhubung dan Siap Mengirim Email.',
      total_email: 'N/A', // Anda bisa tambahkan logic database nanti
      connect: 1,
      disconnect: 0,
      owner: 'BECKK STORE'
    });

  } catch (error) {
    console.error(error);
    // 5. Kirim balasan GAGAL (JSON)
    return res.status(500).json({ 
      success: false, 
      message: 'Koneksi SMTP Gagal. Cek GMAIL_USER atau GMAIL_PASS.' 
    });
  }
}
