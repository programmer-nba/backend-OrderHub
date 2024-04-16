const { generateSign_FP, generateVetify } = require('./generate.signFP')
const axios = require('axios')
const dayjs = require('dayjs');
const fs = require('fs');
const crypto = require('crypto');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { Partner } = require('../../Models/partner');
const { historyWallet } = require('../../Models/topUp/history_topup');
const { shopPartner } = require("../../Models/shop/shop_partner");

// เพิ่มปลั๊กอินสำหรับ UTC และ timezone ใน dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

let dayjsTimestamp
let dayTime
let dayTimePlusOneHour

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 function updateRealTime() {
    dayjsTimestamp = dayjs().tz('Asia/Bangkok');
    dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss');
    dayTimePlusOneHour = dayjs(dayTime).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 1 วินาที
setInterval(updateRealTime, 1000);

const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที

QRCreate = async (req, res)=>{
    try{
        const number = req.decoded.number
        const KEY = process.env.FLASHPAY_KEY
        const apiUrl = process.env.FLASHPAY_URL
        const amount = req.body.amount
        const id = req.decoded.userid

        const findPartner = await Partner.findById({_id:id})
            if(!findPartner){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาพาร์ทเนอร์เจอ"})
            }
        
        const outTradeNo = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+outTradeNo);
        const amountBath = amount * 100 //เปลี่ยนบาท เป็น สตางค์
        console.log(dayTimePlusOneHour)
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
                "expireTime": dayTimePlusOneHour, //2024-02-21 00:00:00
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
        // if(response.data.code == 0){
        //     return res
        //             .status(400)
        //             .send({status:false, message:"ไม่สามารถ"})
        // }
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

        const new_data = {
            partnerID:findPartner._id,
            shop_number: '-',
            orderid:response.data.data.tradeNo,
            outTradeNo: outTradeNo,
            firstname: findPartner.firstname,
            lastname: findPartner.lastname,
            amount: amount,
            before: findShop.credits,
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
        const trade_No = req.body.tradeNo
        const fromData = {
            appKey : KEY,
            charset : 'UTF-8',
            data:{
                "tradeNo": trade_No
            },
            time: dayTime,
            version: 1.1
        }
        
        const newData = await generateSign_FP(fromData)
        const formDataOnly = newData.newSortData
        
        const response = await axios.post(`${apiUrl}/upay/get-payment-result`, formDataOnly, {
                headers:{
                            'Content-Type': 'application/json',
                            'Accept-Language': 'TH',
                        },
        });
        const receivedData = response.data
        const tradeNo = receivedData.data.tradeNo
        const tradeStatus = receivedData.data.tradeStatus
        const amount = receivedData.data.paymentAmount / 100
            let findTradeNo
                if(tradeStatus == 3){
                    const currentWallet = await historyWallet.findOne({ orderid: tradeNo });
                        if(!currentWallet){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลข tradeNo ได้"})
                        }
                    const findBefore = await Partner.findOneAndUpdate(
                        {_id:currentWallet.partnerID},
                        { $inc: { credits: +amount }},
                        {new:true})
                        if(!findBefore){
                            return res 
                                    .status(404)
                                    .send({status:false, message:"ไม่สามารถค้นหาพาร์ทเนอร์เจอ"})
                        }
                    let walletBefore = Number(findBefore.credits) - amount
                    findTradeNo = await historyWallet.findOneAndUpdate(
                        {orderid:tradeNo},
                        {
                            before: walletBefore,
                            after: 'เติมเงินสำเร็จ',
                            money_now: findBefore.credits
                        },
                        {new:true})
                        if(!findTradeNo){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
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
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้(2)"})
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
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้(4)"})
                    }
                }else if(tradeStatus == 5){
                    findTradeNo = await historyWallet.findOneAndUpdate(
                        {orderid:tradeNo},
                        {
                            after:"QR CODE หมดอายุ"
                        }, 
                        {new:true})
                    if(!findTradeNo){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้(5)"})
                    }
                }
        return res
                .status(200)
                .send({
                    status:true, 
                    data: response.data, 
                    history: findTradeNo
                })
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
                sendingBank: 'SCB'
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

// vertifyNotify = async (req, res)=>{
//     try{
//         const receivedData = req.body
//         const receivedSignature = receivedData.sign;
//         const formData = {
//             appKey : receivedData.appKey,
//             charset: receivedData.charset,
//             data: receivedData.data,
//             time: receivedData.time,
//             version: receivedData.version
//         }
//         console.log(receivedData)
//         const isSignatureValid = await generateVetify(formData, receivedSignature)
//         console.log(isSignatureValid)
//         if (isSignatureValid) {
//             console.log('ลายเซ็นถูกต้อง');
//             const tradeNo = receivedData.data.tradeNo
//             const tradeStatus = receivedData.data.tradeStatus
//             const amount = receivedData.data.paymentAmount / 100
//             let findTradeNo
//             let findShop
//             if(tradeStatus == 3){
//                 const currentWallet = await historyWallet.findOne({ orderid: tradeNo });
//                 if(!currentWallet){
//                     return res
//                             .status(404)
//                             .send({status:false, message:"ไม่สามารถค้นหาหมายเลข tradeNo ได้"})
//                 }
//                 const findBefore = await shopPartner.findOne({shop_number:currentWallet.shop_number})
//                 let wallet = Number(findBefore.credit) + amount

//                 findTradeNo = await historyWallet.findOneAndUpdate(
//                     {orderid:tradeNo},
//                     {
//                         before: findBefore.credit,
//                         after: wallet
//                     },
//                     {new:true})
//                     if(!findTradeNo){
//                             return res
//                                     .status(400)
//                                     .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
//                     }
//                 findShop = await shopPartner.findOneAndUpdate(
//                     {shop_number:currentWallet.shop_number},
//                     {credit: wallet},
//                     {new:true})
//                     if(!findShop){
//                         return res
//                                 .status(404)
//                                 .send({status:false, message:"ไม่สามารถค้นหาร้านค้าได้"})
//                     }
//             }else if(tradeStatus == 2){
//                 findTradeNo = await historyWallet.findOneAndUpdate(
//                     {orderid:tradeNo},
//                     {
//                         after:"กำลังประมวลผล"
//                     }, 
//                     {new:true})
//                 if(!findTradeNo){
//                         return res
//                                 .status(400)
//                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
//                 }
//             }else if(tradeStatus == 4){
//                 findTradeNo = await historyWallet.findOneAndUpdate(
//                     {orderid:tradeNo},
//                     {
//                         after:"รายการเติมเงินล้มเหลว"
//                     }, 
//                     {new:true})
//                 if(!findTradeNo){
//                         return res
//                                 .status(400)
//                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
//                 }
//             }else if(tradeStatus == 5){
//                 findTradeNo = await historyWallet.findOneAndUpdate(
//                     {orderid:tradeNo},
//                     {
//                         after:"QR CODE หมดอายุ"
//                     }, 
//                     {new:true})
//                 if(!findTradeNo){
//                         return res
//                                 .status(400)
//                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลขรายการได้"})
//                 }
//             }

//             return res
//                     .status(200)
//                     .send({
//                         code:0, 
//                         data:findTradeNo, 
//                         shop:findShop,
//                         message:"SUCCESS"
//                     })
//         } else {
//             console.log('ลายเซ็นไม่ถูกต้อง');
//             return res
//                     .status(400)
//                     .send({code:0, message:"ลายเซ็นไม่ถูกต้อง"})
//         }

//     }catch(err){
//         console.log(err)
//         return res
//                 .status(500)
//                 .send({status:false, message:err.message})
//     }
// }

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 1000000)
    const combinedData = data + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 1000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = { QRCreate, paymentResults, transactionResult, notifyTransaction}