const crypto = require('crypto');

generateJT = async (formData)=>{
    try{
        const key = process.env.JT_KEY;
        // 1. Combine logistics_interface and key
        const logistics = JSON.stringify(formData.logistics_interface);
        const combinedData = logistics + key;
        //console.log(logistics)

        // 2. Calculate MD5 hash
        const md5Hash = crypto.createHash('md5').update(combinedData, 'utf-8').digest('hex');

        // 3. Base64 encode the Buffer
        const base64Encoded = md5Hash.toString('base64');

        // 4. Print or use the resulting data_digest
        const data_digest = base64Encoded;

        const base64EncodedTest = Buffer.from(data_digest, 'utf-8').toString('base64')
        //console.log('The data_digest obtained above is:', base64EncodedTest);
        formData.logistics_interface = logistics
        formData.data_digest = base64EncodedTest
        return formData

    }catch(err){
        console.log("ออเรอร์",err)
    }
}
module.exports = { generateJT }

// การ Decoded เพื่อพิสูจน์ว่าตรง
// const base64 = 'NGE3N2Y4ZDA0MGVmYTdlMTNhYzIzMTE5YTg3ZTQwM2I=';
// const decodedText = Buffer.from(base64, 'base64').toString('utf-8');
// console.log("decoded",decodedText);