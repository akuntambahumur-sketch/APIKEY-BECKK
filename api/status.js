const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// GANTI "export default" DENGAN "module.exports"
module.exports = async (req, res) => {
  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ 
      success: false, 
      message: 'Akun Gmail (GMAIL_USER / GMAIL_PASS) belum diatur di Vercel.' 
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    
    return res.status(200).json({
      success: true,
      message: 'SMTP (Gmail) Terhubung dan Siap Mengirim Email.',
      total_email: 'N/A',
      connect: 1,
      disconnect: 0,
      owner: 'BECKK STORE'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: 'Koneksi SMTP Gagal. Cek GMAIL_USER atau GMAIL_PASS.' 
    });
  }
};
