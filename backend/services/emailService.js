const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@localhost';

function getTransporter() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  const isGmail = !SMTP_HOST || SMTP_HOST === 'smtp.gmail.com';
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    ...(SMTP_PORT === 587 && { secure: false, requireTLS: true })
  });
}

/**
 * Отправляет письмо с кодом для подтверждения email.
 * Если SMTP не настроен — код выводится в консоль (режим разработки).
 * @param {string} to - email получателя
 * @param {string} code - 6-значный код
 * @param {function} callback - (err)
 */
function sendVerificationCodeEmail(to, code, callback) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] SMTP не настроен. Код для верификации:', code);
    return callback(null);
  }
  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject: 'Код подтверждения (6 цифр) — не ссылка',
    text: `Код для входа в аккаунт (введите на сайте): ${code}\n\nСкопируйте только эти 6 цифр и вставьте в поле «Код из письма» на странице подтверждения. Код действителен 15 минут. Ссылку переходить не нужно.`,
    html: `
      <p>Здравствуйте!</p>
      <p><strong>Ваш код для входа (6 цифр):</strong></p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0;">${code}</p>
      <p>Введите эти 6 цифр на сайте на странице «Подтверждение email» в поле «Код из письма». Ссылку в письме переходить не нужно — только код.</p>
      <p style="color:#666;">Код действителен 15 минут.</p>
    `
  };
  try {
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('[Email] Ошибка отправки:', err.message);
      }
      callback(null);
    });
  } catch (e) {
    console.error('[Email] Исключение:', e.message);
    callback(null);
  }
}

module.exports = { sendVerificationCodeEmail, getTransporter };
