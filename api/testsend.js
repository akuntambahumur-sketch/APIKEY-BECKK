const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const PROYEK_API_KEY = process.env.PROYEK_API_KEY;

// GANTI "export default" DENGAN "module.exports"
module.exports = async (req, res) => {
  const { email, pesan, apikey } = req.query;

  if (apikey !== PROYEK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Error: API Key salah.' });
  }

  if (!email || !pesan) {
    return res.status(400).json({ success: false, message: 'Error: Email dan Pesan wajib diisi.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"BECKK STORE" <${GMAIL_USER}>`,
    to: email,
    subject: `Pesan Tes dari Bot Anda: ${pesan.substring(0, 20)}...`,
    text: `Ini adalah pesan tes yang dikirim dari bot Anda:\n\n"${pesan}"`,
    html: `<p>Ini adalah pesan tes yang dikirim dari bot Anda:</p><br><blockquote>${pesan}</blockquote>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return res.status(200).json({
      success: true,
      message: 'Email tes berhasil dikirim!',
      email: email,
      response: info.response,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: `Gagal mengirim email: ${error.message}` 
    });
  }
};
