const dayjs = require('dayjs')
const crypto = require('crypto')

generateSign = async(id)=>{
        //เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
        const dayjsTimestamp = dayjs(Date.now());
        const dayTime = dayjsTimestamp.format('YYYY/MM/DD HH:mm:ss')

        const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
        const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
        //ใช้ method valueOf ของ dayjs ใช้เพื่อดึงค่า timestamp ของวัตถุนั้นในรูปของจำนวนเต็ม (milliseconds) ที่แสดงถึงเวลาของวัตถุนั้นๆ ตั้งแต่ Epoch (January 1, 1970, 00:00:00 UTC) ไปจนถึงวันที่และเวลาปัจจุบัน.

        const mchId = id
        const key = process.env.SECRET_KEY
        const body = 'ORDER_HUB'
        const nonceStr = milliseconds

        const asciiSortedSignature = [ //ทำให้ parameter เรียงแบบ ASCII
            //`body=${body}`,
            `mchId=${mchId}`,
            `nonceStr=${nonceStr}`,
        ].sort().join('&');

        const stringSignTemp = asciiSortedSignature +`&key=${key}` //นำไปรวมกับ secret_key

        const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
        await hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

        const sign = await hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
        //console.log("generate :",sign);
        return {sign, nonceStr}
}
module.exports = { generateSign }