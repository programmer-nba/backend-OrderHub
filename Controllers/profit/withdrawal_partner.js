const { bankRecord } = require("../../Models/bank/bank.record");
const { Partner } = require("../../Models/partner");
const { profitPartner } = require("../../Models/profit/profit.partner");
const { shopPartner } = require("../../Models/shop/shop_partner");
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { profitTemplate } = require("../../Models/profit/profit.template");

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

getAll = async (req, res)=>{
    try{
        const findAll = await profitPartner.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false ,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumForMe = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findMe = await profitPartner.find({wallet_owner:id, status:"เงินเข้า"})
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    data:findMe,
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

Withdrawal = async (req, res)=>{
    try{
        const idBank = req.params.id
        const id = req.decoded.userid
        const amount = req.body.amount
            if (!amount || isNaN(amount) || amount < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
                return res
                        .status(400)
                        .send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
            }else if (!/^(\d+(\.\d{1,2})?)$/.test(amount.toString())){ //เช็คทศนิยมไม่เกิน 2 ตำแหน่ง
                return res
                        .status(400)
                        .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
            }

        let flashPay
        const findPartner = await Partner.findOne({_id:id})
            if (!findPartner) {
                return res
                        .status(404)
                        .send({ status: false, message: "ไม่มีพาร์ทเนอร์ที่ท่านตามหา" });
            }else if(findPartner.credits == 0){
                return res
                        .status(400)
                        .send({status: false, message:"ท่านไม่สามารถถอนเงินได้"})
            }else if(findPartner.credits < amount){
                return res
                        .status(400)
                        .send({status: false, message:"จำนวนเงินที่ท่านกรอกมากกว่า credits ของท่าน"})
            } else {
                    const result = await bankRecord.findOne({ ID: id }); // หาเอกสารที่มี ID เท่ากับ id

                    if (result) {
                        flashPay = result.flash_pay.find(item => item._id.toString() === idBank); // ค้นหา flash_pay ที่มี _id เท่ากับ idBank
                        if (flashPay) {
                            console.log(flashPay); // แสดงข้อมูลทั้งหมดใน Object ที่ตรงกับเงื่อนไข
                        } else {
                            console.log('ไม่พบ flash_pay ที่มี _id เท่ากับ idBank');
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่พบธนาคารที่ท่านระบุ"})
                        }
                    } else {
                        console.log('ไม่พบเอกสารที่มี ID เท่ากับ id');
                        return res
                                    .status(404)
                                    .send({status:false, message:"ไม่พบข้อมูลธนาคารของท่าน(กรุณาสร้างบัญชี Book bank ของท่าน)"})
                    }
                    const orderid = await invoiceNumber(dayjsTimestamp)
                    console.log(orderid)
                    let v = {
                            orderid: orderid,
                            'template.partner_number': findPartner.partnerNumber,
                            'template.account_name':flashPay.name,
                            'template.account_number':flashPay.card_number,
                            'template.bank':flashPay.aka,
                            'template.amount':amount,
                            'template.phone_number': findPartner.tel ,
                            'template.email':findPartner.email,
                            type: 'ถอนเงิน'
                    }
                    const createTemplate = await profitTemplate.create(v)
                        if(!createTemplate){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างรายการถอนเงินได้"})
                        }

                    const difProfitPartner = await Partner.findOneAndUpdate(
                        {_id:id},
                        { $inc: { credits: -amount } },
                        {new:true, projection: { credits: 1 }})
                        if(!difProfitPartner){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถลบเงินพาร์ทเนอร์ได้"})
                        }
                    let record = {
                            wallet_owner:id,
                            Orderer:id,
                            role:'partner',
                            shop_number: "-",
                            orderid: orderid,
                            profit: amount,
                            express: "-",
                            type:'ถอนเงิน',
                            status:'รอดำเนินการ'
                    }
                    const profitRecord = await profitPartner.create(record)
                        if(!profitRecord){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถบันทึกการถอนเงินได้"})
                        }
                return res
                        .status(200)
                        .send({
                                status:true,
                                // data: flashPay,
                                profit: createTemplate,
                                diffProfit: difProfitPartner,
                                record: profitRecord
                        })
            }

    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

getCod = async(req, res)=>{
    try{
        const status = req.body.status
        let findCod
        if(status){
            findCod = await profitTemplate.find({status:status})
                if(findCod.length == 0){
                    return res
                            .status(200)
                            .send({status:false ,data:[]})
                }
        }else{
            findCod = await profitTemplate.find()
                if(!findCod){
                    return res
                            .status(200)
                            .send({status:false ,data:[]})
                }
        }
    return res
            .status(200)
            .send({status:true, data:findCod})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

changStatus = async (req, res)=>{
    try{
        const orderids = req.body.orderid
        const status = req.body.status
        const code = await invoiceNumber(dayTime)
        let orderBulk = orderids.map(item=>({
            updateOne:{
                filter:{ orderid : item },
                update: { 
                    $set: {
                        status:status,
                        code:code
                    }
            }
        }}))
        const bulkOrder = await profitTemplate.bulkWrite(orderBulk)
        return res
                .status(200)
                .send({status:true, 
                    data:bulkOrder,
                    code:code
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 1000000)
    const combinedData = `COD`+data + random;
    const findInvoice = await profitTemplate.find({code:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 1000000);
        combinedData = `COD`+data + random;

        // เช็คใหม่
        findInvoice = await profitTemplate.find({code: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

module.exports = { getAll, getSumForMe, Withdrawal, changStatus, getCod }