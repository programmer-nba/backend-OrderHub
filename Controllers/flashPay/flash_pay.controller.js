const { generateSign_FP } = require('./generate.signFP')
const axios = require('axios')
const dayjs = require('dayjs')

 //เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 const dayjsTimestamp = dayjs(Date.now());
 const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
 const dayTimePlusOneHour = dayjs(dayTime).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

 const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
 const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
 const outTradeNo = milliseconds

QRCreate = async (req, res)=>{
    try{
        const id = req.decoded.number
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            signType : 'RSA2',
            data:{
                "outUserId": id,
                "outTradeNo": outTradeNo,
                "outTradeTime": dayTime,
                "paymentAmount": 200,
                "cur": "THB",
                "subject": "พาร์ทเนอร์เติมเงินเข้าระบบ",
                "body": "ORDER HUB สแกนเติมเงิน",
                "expireTime": dayTimePlusOneHour,
                "notifyUrl": "https://test.com",
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.formData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/upay/create-qrcode-payment`,querystring.stringify(formDataOnly),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
    }catch(err){
        console.log(err)
        return res 
                .status(500)
                .send({status:false, message:err.message})
    }
}