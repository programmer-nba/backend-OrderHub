const dayjs = require('dayjs')
const crypto = require('crypto')
const qs = require('qs');

generateSign = async(formData)=>{
        const key = process.env.SECRET_KEY
        const asciiSortedSignature = Object.keys(formData)
            .sort()  // ยังคงจัดเรียง key ใน formData ตาม ASCII
            .map(key => {
                let value = formData[key];
                // ตรวจสอบว่า key เป็น subItemTypes และเป็น array
                if (Array.isArray(value)) {
                    // จัดการ object ภายใน subItemTypes โดยไม่จัดเรียงตาม ASCII
                    value = `[\n${value.map(item => `{\n${Object.keys(item)
                        // ไม่ใช้ .sort() เพื่อคงลำดับเดิมของ key ใน object
                        .map(k => `  "${k}":"${item[k]}"`)  // เพิ่มการแบ่งบรรทัดและ indent
                        .join(',\n')}`).join(',')}\n}]`;
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);  // แปลง object อื่นๆ ให้เป็น string
                }
                return `${key}=${value}`;  // ส่งคืน key=value ที่จัดการแล้ว
            })
            .join('&');

        const stringSignTemp = asciiSortedSignature +`&key=${key}` //นำไปรวมกับ secret_key
        const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
        await hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.
        console.log(stringSignTemp)
        const sign = await hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
        // console.log("generate :",sign);
        const asciiSorted = asciiSortedSignature + `&sign=${sign}`
        // console.log(asciiSorted)
        const formDataAscii = qs.parse(asciiSorted);
        // console.log(formDataAscii)
        const queryString = qs.stringify(formDataAscii, {
            encode: true,
        });
        // console.log("gg",queryString)
        formData.sign = sign
        return {formData, queryString}
}
module.exports = { generateSign }
