require('dotenv').config();

exports.isValidIDNumber = (idNumber) => {
    idNumber = idNumber.replace(/\D/g, ""); // Remove non-digit characters
  
    // Check if ID number is exactly 13 digits
    if (idNumber.length !== 13) {
      return false;
    }
  
    // Checksum calculation for Thai ID numbers
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(idNumber.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;
  
    return checksum === parseInt(idNumber.charAt(12));
};

exports.isValidPassport = (passportNumber) =>{
    // ตรวจสอบรูปแบบสำหรับหนังสือเดินทางไทย
    const thaiPassportRegex = /^P\d{8}$/; // ต้องขึ้นต้นด้วย P และตามด้วยตัวเลข 8 หลัก

    // ตรวจสอบว่าผ่านเงื่อนไขหรือไม่
    return thaiPassportRegex.test(passportNumber);
}

exports.isValidTaxID = (taxID) => {
    // ลบตัวอักษรที่ไม่ใช่ตัวเลข
    taxID = taxID.replace(/\D/g, "");

    // ตรวจสอบว่าหมายเลขต้องมี 13 หลัก
    if (taxID.length !== 13) {
      return false;
    }

    // คำนวณ Checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(taxID.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;

    // เปรียบเทียบ Checksum กับหลักที่ 13
    return checksum === parseInt(taxID.charAt(12));
};

// let result = exports.isValidPassport('P12345678')
// console.log(result)