const dayjs = require('dayjs')
const crypto = require('crypto')
const fs = require("fs");
const qr = require('qr-image');

generateSign_FP_test = async(formData)=>{
 
        // Parse the JSON string in the 'data' field
        const jsonData = formData.data;

        // Sort keys within alphabet in ascending order the JSON object
        const sortedJsonData = Object.keys(jsonData)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = jsonData[key];
                return acc;
            }, {});
        // console.log(sortedJsonData)
        //เมื่อทำการ sort ภายใน Object data แบบ alphabet in ascending order ทำการนำ object ที่ได้ไปทับใน Object data ใน formData
        formData.data = sortedJsonData
        
        const newFormData = { ...formData };
        const strFromData = JSON.stringify(sortedJsonData); //นำค่า sortedJsonData มาทำเรียงเป็น String 

        newFormData.data = strFromData; //นำ string formData มาเข้า Object newFormData.data
        
        const sortedFormData = Object.keys(newFormData)  //นำ object newFormData มาเข้าเรียง key แบบ alphabet in ascending
            .sort((a, b) => a.localeCompare(b))
            .map(key => `${key}=${newFormData[key]}`)
            .join('&');

        // แปลงข้อมูลลายเซ็นเป็น UTF-8 encoded byte[]
        const utf8Bytes = Buffer.from(sortedFormData, 'utf-8');
        //console.log(sortedFormData)

        // Reading keys from files.
        const privateKey = fs.readFileSync('./private_test.key')

        // สร้างอ็อบเจ็กต์ Sign สำหรับการลงนามด้วย RSA-SHA256(พ่องตายกว่าจะได้)
        const signature = crypto.sign('RSA-SHA256', utf8Bytes, privateKey).toString("base64")
        formData.sign = signature
        formData.signType = 'RSA2'

        const newSortData = Object.keys(formData)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = formData[key];
                return acc;
        }, {});

        //console.log(`FLASH Notify`,newSortData)
        return {newSortData}
}

generateVetify = async(formData, receivedSignature)=>{
    try{
        const jsonData = formData.data;

        // Sort keys within alphabet in ascending order the JSON object
        const sortedJsonData = Object.keys(jsonData)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = jsonData[key];
                return acc;
            }, {});
        //console.log(sortedJsonData)
        //เมื่อทำการ sort ภายใน Object data แบบ alphabet in ascending order ทำการนำ object ที่ได้ไปทับใน Object data ใน formData
        formData.data = sortedJsonData
        
        const newFormData = { ...formData };
        const strFromData = JSON.stringify(sortedJsonData); //นำค่า sortedJsonData มาทำเรียงเป็น String 

        newFormData.data = strFromData; //นำ string formData มาเข้า Object newFormData.data
        
        const sortedFormData = Object.keys(newFormData)  //นำ object newFormData มาเข้าเรียง key แบบ alphabet in ascending
            .sort((a, b) => a.localeCompare(b))
            .map(key => `${key}=${newFormData[key]}`)
            .join('&');
        
        const utf8Bytes = Buffer.from(sortedFormData, 'utf-8');

        const publicKey = fs.readFileSync('./public_test.key');
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(utf8Bytes);

        const isSignatureValid = verify.verify(publicKey, receivedSignature, 'base64');

        return isSignatureValid
    }catch(err){
        console.log(err)
    }
}

module.exports = { generateSign_FP_test, generateVetify }
