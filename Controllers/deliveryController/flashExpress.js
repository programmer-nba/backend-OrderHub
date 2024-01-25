const axios = require('axios')
const querystring = require('querystring');
const crypto = require('crypto')
const dayjs = require('dayjs')

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
const currentDate = new dayjs().format('YYYY-MM-DD');

// นำวันที่(แบบ string)ไปเข้ารหัสด้วย SHA-256
const hashDate = crypto.createHash('sha256');
hashDate.update(currentDate);
const hashedText = hashDate.digest('hex');

console.log('Text:', currentDate);
console.log('SHA-256 Hash:', hashedText);
const random = generateRandomNonce(20)
console.log(random);
const mchID = process.env.MCH_ID
const secret_key = process.env.SECRET_KEY
const body = "Luby"
const nonce = "yyv6YJP436wCkdpNdghC"
const stringA = `body=${body}&mchId=${mchID}&nonceStr=${nonce}`
const stringSignTemp = stringA+`&key=${secret_key}`

const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

const sign = hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
console.log(sign);

getData = async(req, res)=> {
    try{
        const apiUrl = process.env.TRAINING_URL
        console.log(apiUrl)
        const formData = {
            mchId: mchID,
            nonceStr: nonce,
            body: body,
            sign: sign
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/warehouses`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        console.log(response.data)
    }catch(error){
        console.error(error)
    }
}
getData();

function generateRandomNonce(length){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        nonce += characters.charAt(randomIndex);
    }

    return nonce;
}
