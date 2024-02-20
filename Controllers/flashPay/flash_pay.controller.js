const { generateSign_FP, generateVetify } = require('./generate.signFP')
const axios = require('axios')
const dayjs = require('dayjs')
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const qr = require('qr-image');
const crypto = require('crypto');
const { Partner } = require('../../Models/partner');
const { historyWallet } = require('../../Models/topUp/history_topup');
const { shopPartner } = require("../../Models/shop/shop_partner");

 //เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 const dayjsTimestamp = dayjs(Date.now());
 const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
 const dayTimePlusOneHour = dayjs(dayTime).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

 const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
 const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
 

QRCreate = async (req, res)=>{
    try{
        const number = req.decoded.number
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const amount = req.body.amount
        const shop = req.body.shop_number
        console.log(amount)
        const findPartner = await Partner.findOne(
            {
                partnerNumber:number,
                shop_partner:{
                    $elemMatch: { shop_number: shop }
                }
            })
        if(!findPartner){
            return res
                    .status(400)
                    .send({status:false, message:"กรุณาระบุรหัสร้านค้าที่ท่านเป็นเจ้าของ/สร้างร้านค้าของท่าน"})
        }
        const outTradeNo = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+outTradeNo);
        const amountBath = amount * 100 //เปลี่ยนบาท เป็น สตางค์
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                "outUserId": number,
                "outTradeNo": outTradeNo,
                "outTradeTime": dayTime,
                "paymentAmount": amountBath,
                "cur": "THB",
                "subject": "พาร์ทเนอร์เติมเงินเข้าระบบ",
                "body": "ORDER HUB สแกนเติมเงิน",
                "expireTime": dayTimePlusOneHour,
                "notifyUrl": "http://api.tossaguns.online/orderhub/flashpay/payment/vertify",
            },
            time: dayTime,
            version: 1.1
        }
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
             console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/upay/create-qrcode-payment`, formDataOnly, {
            headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': 'TH',
            },
        });

        
        // const qrRawData  = response.data.data.qrRawData
        // console.log(qrRawData)
        // const qrCodeFilePath = `D:\\QRCODE\\${outTradeNo}.png`
        // // สร้าง QR Code จากข้อมูล
        // qrcode.toFile(`D:\QRCODE/${outTradeNo}.png`, qrRawData, { type: 'png' }, (err) => {
        //     if (err) {
        //         console.error('Error creating QR Code:', err);
        //     } else {
        //         console.log('QR Code created and saved successfully:', qrCodeFilePath);
        //     }
        // });
        const findShop = await shopPartner.findOne({shop_number:shop})
        if(!findShop){
            return res
                    .status(404)
                    .send({status:false, message:"ไม่สามารถค้นหาร้านค้าที่ท่านระบุได้"})
        }
        const new_data = {
            partnerID:findPartner._id,
            shop_number: shop,
            orderid:response.data.data.tradeNo,
            outTradeNo: outTradeNo,
            firstname: findPartner.firstname,
            lastname: findPartner.lastname,
            amount: amount,
            before: findShop.credit,
            type: "QRCODE FLASHPAY"
        }
        const history = await historyWallet.create(new_data)
        return res
                .status(200)
                .send({status:true, data: response.data, history: history})

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
        // console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

notifyTransaction = async (req, res)=>{
    try{
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const outTradeNo = req.body.outTradeNo
        const tradeNo = req.body.tradeNo
        const tradeTime = req.body.tradeTime
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                "outTradeNo": outTradeNo,
                "tradeNo": tradeNo,
                "tradeStatus": 3,
                "tradeTime": tradeTime,
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
        const response = await axios.post(`http://api.tossaguns.online/orderhub/flashpay/payment/vertify`,formDataOnly,{
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'TH',
            },
        })
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        //console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

vertifyNotify = async (req, res)=>{
    try{
        const receivedData = req.body
        const receivedSignature = receivedData.sign;
        const formData = {
            appKey : receivedData.appKey,
            charset: receivedData.charset,
            data: receivedData.data,
            time: receivedData.time,
            version: receivedData.version
        }
        console.log(receivedData)
        const isSignatureValid = await generateVetify(formData, receivedSignature)
        console.log(isSignatureValid)
        if (isSignatureValid) {
            console.log('ลายเซ็นถูกต้อง');
            const tradeNo = receivedData.data.tradeNo
            const tradeStatus = receivedData.data.tradeStatus
            const amount = receivedData.data.paymentAmount / 100
            let findTradeNo
            let findShop
            if(tradeStatus == 3){
                const currentWallet = await historyWallet.findOne({ orderid: tradeNo });
                if(!currentWallet){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่สามารถค้นหาหมายเลข tradeNo ได้"})
                }
                const findBefore = await shopPartner.findOne({shop_number:currentWallet.shop_number})
                let wallet = Number(findBefore.credit) + amount

                findTradeNo = await historyWallet.findOneAndUpdate(
                    {orderid:tradeNo},
                    {
                        before: findBefore.credit,
                        after: wallet
                    },
                    {new:true})
                    if(!findTradeNo){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
                    }
                findShop = await shopPartner.findOneAndUpdate(
                    {shop_number:currentWallet.shop_number},
                    {credit: wallet},
                    {new:true})
                    if(!findShop){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่สามารถค้นหาร้านค้าได้"})
                    }
            }else if(tradeStatus == 2){
                findTradeNo = await historyWallet.findOneAndUpdate(
                    {orderid:tradeNo},
                    {
                        after:"กำลังประมวลผล"
                    }, 
                    {new:true})
                if(!findTradeNo){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
                }
            }else if(tradeStatus == 4){
                findTradeNo = await historyWallet.findOneAndUpdate(
                    {orderid:tradeNo},
                    {
                        after:"รายการเติมเงินล้มเหลว"
                    }, 
                    {new:true})
                if(!findTradeNo){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
                }
            }else{
                findTradeNo = await historyWallet.findOneAndUpdate(
                    {orderid:tradeNo},
                    {
                        after:"QR CODE หมดอายุ"
                    }, 
                    {new:true})
                if(!findTradeNo){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
                }
            }

            return res
                    .status(200)
                    .send({
                        code:0, 
                        // data:findTradeNo, 
                        // shop:findShop,
                        message:"SUCCESS"
                    })
        } else {
            console.log('ลายเซ็นไม่ถูกต้อง');
            return res
                    .status(400)
                    .send({code:0, message:"ลายเซ็นไม่ถูกต้อง"})
        }

    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMM")}`
    let random = Math.floor(Math.random() * 100000000)
    const combinedData = data + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = { QRCreate, paymentResults, transactionResult, notifyTransaction, vertifyNotify}