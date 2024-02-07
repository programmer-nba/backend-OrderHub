const dayjs = require('dayjs')
const crypto = require('crypto')

generateSign = async(formData)=>{
        const key = process.env.SECRET_KEY
        const asciiSortedSignature = Object.keys(formData)
            .sort()
            .map(key => `${key}=${formData[key]}`)
            .join('&');

        const stringSignTemp = asciiSortedSignature +`&key=${key}` //นำไปรวมกับ secret_key
        const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
        await hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

        const sign = await hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
        //console.log("generate :",sign);
        formData.sign = sign
        return {formData}
}
module.exports = { generateSign }