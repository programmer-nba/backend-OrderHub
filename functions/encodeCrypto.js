const crypto = require('crypto');
require('dotenv').config(); // โหลดค่าตัวแปรแวดล้อมจากไฟล์ .env

// สร้างกุญแจสำหรับการเข้ารหัส (symmetric encryption)
const algorithm = process.env.ALGORITHM;
const secretKey = Buffer.from(process.env.SECRET_KEY_CRYPTO, 'hex');
const iv = Buffer.from(process.env.IV, 'hex');

// ฟังก์ชันสำหรับการเข้ารหัส
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// ฟังก์ชันสำหรับการถอดรหัส
function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };