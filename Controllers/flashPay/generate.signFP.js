const dayjs = require('dayjs')
const crypto = require('crypto')

generateSign_FP = async(formData)=>{
 
        // Parse the JSON string in the 'data' field
        const jsonData = JSON.parse(formData.data);

        // Sort keys within the JSON object
        const sortedJsonData = Object.keys(jsonData)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = jsonData[key];
                return acc;
            }, {});

        // Update the 'data' field in formData
        formData.data = JSON.stringify(sortedJsonData, Object.keys(sortedJsonData).sort());

        // Sort the rest of the formData
        const sortedFormData = Object.keys(formData)
            .sort((a, b) => a.localeCompare(b))
            .map(key => `${key}=${formData[key]}`)
            .join('&');

        const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
        hash.update(sortedFormData, 'utf-8');//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

        const sign = hash.digest('hex')//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)
        //console.log("generate :",sign);
        formData.sign = sign
        return {formData}
}

module.exports = { generateSign_FP }
