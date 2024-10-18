const dayjs = require('dayjs')
const crypto = require('crypto')

generateSign = async(formData)=>{
        const key = process.env.SECRET_KEY
        const asciiSortedSignature = Object.keys(formData)
            .sort()
            .map(key => {
                let value = formData[key];
                // ตรวจสอบว่า key เป็น subItemTypes และเป็น object
                if (Array.isArray(value)) {
                    // จัดการ object ภายใน subItemTypes และแปลงเป็น string
                    value = `[${value.map(item => `{${Object.keys(item)
                        .sort()
                        .map(k => `${k}=${item[k]}`)
                        .join('&')}}`).join(',')}]`;  // แปลง object ภายใน array ให้เป็น string
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);  // แปลง object อื่นๆ ให้เป็น string
                }
                return `${key}=${value}`;  // ส่งคืน key=value ที่จัดการแล้ว
            })
            .join('&');

        const stringSignTemp = asciiSortedSignature +`&key=${key}` //นำไปรวมกับ secret_key
        const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
        await hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.
        // console.log(stringSignTemp)
        const sign = await hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
        // console.log("generate :",sign);
        formData.sign = sign
        return {formData}
}
module.exports = { generateSign }
