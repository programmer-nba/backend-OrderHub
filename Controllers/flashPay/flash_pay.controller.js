const { generateSign_FP, generateVetify } = require('./generate.signFP')
const axios = require('axios')
const dayjs = require('dayjs')
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const qr = require('qr-image');
const jsQR = require('jsqr');
const fsPromiss = require('fs').promises;
const crypto = require('crypto')

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
            data:{
                "outUserId": id,
                "outTradeNo": outTradeNo,
                "outTradeTime": dayTime,
                "paymentAmount": 40000,
                "cur": "THB",
                "subject": "พาร์ทเนอร์เติมเงินเข้าระบบ",
                "body": "ORDER HUB สแกนเติมเงิน",
                "expireTime": dayTimePlusOneHour,
                "notifyUrl": "http://localhost:9019/orderhub/flashpay/payment/vertify",
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
             console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/upay/create-qrcode-payment`,formDataOnly,{
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'TH',
            },
        })

        // ข้อมูลขนาดใหญ่ที่ถูกเข้ารหัส base64
        const qrRawData  = response.data.data.qrRawData

        // สร้าง QR Code จากข้อมูล
        qrcode.toFile('./output.png', qrRawData, { type: 'png' }, (err) => {
            if (err) throw err;
            console.log('สร้าง QR Code และบันทึกไฟล์ output.png เรียบร้อยแล้ว');
        });

        return res
                .status(200)
                .send({status:true, data: response.data})

    }catch(err){
        console.log(err)
        return res 
                .status(500)
                .send({status:false, message:err.message})
    }
}

paymentResults = async (req, res)=>{
    try{
        const id = req.decoded.number
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const tradeNo = req.body.tradeNo
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                "tradeNo": tradeNo
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/upay/get-payment-result`,formDataOnly,{
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'TH',
            },
        })
        return res
                .status(200)
                .send({status:true, data: response.data})
        // Reading keys from files.
        // const publicKey = fs.readFileSync('./public.key');

        // const receivedSignature = response.sign;
        // const dataToVerify = {
        //     "code": response.code,
        //     "message": response.message,
        //     "data": response.data
        // };
        // const preparedData = JSON.stringify(dataToVerify);

        // const verify = crypto.createVerify('RSA-SHA256');
        // verify.update(preparedData);

        // const isSignatureValid = verify.verify(publicKey, receivedSignature, 'base64');

        // if (isSignatureValid) {
        //     console.log('ลายเซ็นถูกต้อง');
        //     // ดำเนินการเพิ่มเติมที่นี่
        // } else {
        //     console.log('ลายเซ็นไม่ถูกต้อง');
        //     // ดำเนินการเพิ่มเติมที่นี่
        // }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

transactionResult = async (req, res)=>{
    try{
        const id = req.decoded.number
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const slipId = req.body.slipId
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                slipId: slipId,
                sendingBank: '014'
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/upay/get-payment-result-by-slip`,formDataOnly,{
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'TH',
            },
        })
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

notifyTransaction = async (req, res)=>{
    try{
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                "outTradeNo": "1708164027000",
                "tradeNo": "240217042024925608",
                "tradeStatus": 3,
                "tradeTime": "2024-02-17 16:08:02",
                "completeTime": dayTime,
                "paymentAmount": 40000,
                "cur": "THB",
                "retCode": "610002",
                "retMessage": "Success",
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
            // console.log(formDataOnly)
        const response = await axios.post(`http://localhost:9019/orderhub/flashpay/payment/vertify`,formDataOnly,{
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'TH',
            },
        })
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

vertifyNotify = async (req, res)=>{
    try{
        const receivedData = req.body
        // const receivedSignature = receivedData.sign;
        // const formData = {
        //     appKey : receivedData.appKey,
        //     charset: receivedData.charset,
        //     data: receivedData.data,
        //     time: receivedData.time,
        //     version: receivedData.version
        // }
        // const newData = await generateVetify(formData, receivedSignature)
        // const formDataOnly = newData
        console.log(receivedData)
        // console.log(formDataOnly)
        return res
                .status(200)
                .send({code:0, message:"SUCCESS"})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

module.exports = { QRCreate, paymentResults, transactionResult, notifyTransaction, vertifyNotify}