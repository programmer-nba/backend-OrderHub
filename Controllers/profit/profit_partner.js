const { bankRecord } = require("../../Models/bank/bank.record");
const { Partner } = require("../../Models/partner");
const { profitPartner } = require("../../Models/profit/profit.partner");
const { shopPartner } = require("../../Models/shop/shop_partner");
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { profitTemplate } = require("../../Models/profit/profit.template");

const dayjsTimestamp = dayjs(Date.now());

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
        const totalProfit = findMe.reduce((total, document) => total + document.profit, 0);
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    data:findMe,
                    sum:totalProfit
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
        const amount = req.body.amount
        const idBank = req.params.id
        const id = req.decoded.userid
        // console.log("id:", id);
        let flashPay
        const findPartner = await Partner.findOne({_id:id})
            if (!findPartner) {
                return res
                        .status(404)
                        .send({ status: false, message: "ไม่มีพาร์ทเนอร์ที่ท่านตามหา" });
            }else if(findPartner.profit == 0){
                return res
                        .status(400)
                        .send({status: false, message:"ท่านไม่สามารถถอนเงินได้"})
            }else if(findPartner.profit < amount){
                return res
                        .status(400)
                        .send({status: false, message:"จำนวนเงินที่ท่านกรอกมากกว่ากำไรของท่าน"})
            } else {
                    const result = await bankRecord.findOne({ ID: id }); // หาเอกสารที่มี ID เท่ากับ id

                    if (result) {
                        flashPay = result.flash_pay.find(item => item._id.toString() === idBank); // ค้นหา flash_pay ที่มี _id เท่ากับ idBank
                        if (flashPay) {
                            console.log(flashPay); // แสดงข้อมูลทั้งหมดใน Object ที่ตรงกับเงื่อนไข
                        } else {
                            console.log('ไม่พบ flash_pay ที่มี _id เท่ากับ idBank');
                        }
                    } else {
                        console.log('ไม่พบเอกสารที่มี ID เท่ากับ id');
                    }
                    const orderid = await invoiceNumber(dayjsTimestamp)
                    console.log(orderid)
                    let v = {
                            orderid: orderid,
                            partner_number: findPartner.partnerNumber,
                            account_name:flashPay.name,
                            account_number:flashPay.card_number,
                            bank:flashPay.aka,
                            amount:amount,
                            phone_number: findPartner.tel ,
                            email:findPartner.email,
                    }
                    const createProfit = await profitTemplate.create(v)
                        if(!createProfit){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างรายการถอนเงินได้"})
                        }
                    const difProfitPartner = await Partner.findOneAndUpdate(
                        {_id:id},
                        { $inc: { profit: -amount } },
                        {new:true, projection: { profit: 1 }})
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
                                profit: createProfit,
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

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 100000)
    const combinedData = `WD`+data + random;
    const findInvoice = await profitPartner.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000);
        combinedData = `WD`+data + random;

        // เช็คใหม่
        findInvoice = await profitPartner.find({orderid: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

module.exports = { getAll, getSumForMe, Withdrawal }