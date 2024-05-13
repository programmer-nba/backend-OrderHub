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

        // ตรวจสอบว่าทุก orderid มี status เป็น "เซ็นรับแล้ว" หรือไม่
        const allSign = await Promise.all(orderids.map(async item => {
            const order = await profitTemplate.findOne({ orderid: item });
            // console.log(order)
            return order && order.status == "เซ็นรับแล้ว";
        }));
        console.log(allSign)
        const allSigned = allSign.every(status => status);

        if (allSigned) {
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
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ออเดอร์ของท่านยังไม่ได้รับการเซ็นรับ"})
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

calCod = async(req, res)=>{ //เช็คจำนวนผู้เซ็นรับแล้ว กับ excel ของ J&T ที่คุณไอซ์ได้รับมา
    try{
        const data = [] //ใส่ รหัส order ของ J&T ทั้งหมดใน excel ที่เป็นรหัสร้านเรา โดยเอามาจากการแปลงเป็น JSON จากเว็ป https://jsoneditoronline.org/#right=local.reqiza&left=local.xocoru
        let findThere = [];
            console.log(data.length);
            try {
                const newData = await Promise.all(data.map(async item => {
                    try {
                        const findByOrderid = await profitTemplate.findOne({ orderid: item });
                        if (!findByOrderid) {
                            console.log(item);
                            return item;
                        } else {
                            // console.log(findByOrderid);
                            findThere.push(findByOrderid);
                        }
                    } catch (error) {
                        // Handle error here
                        console.error("Error occurred:", error);
                        throw error;
                    }
                }));
            
                // รอให้ Promise.all() เสร็จสิ้นและทำการประมวลผลข้อมูลต่อไป
                console.log(findThere.length);
                return res.status(200).send({ status: false, data: findThere });
            } catch (error) {
                // Handle error here
                console.error("Error occurred:", error);
                return res.status(500).send({ error: "Internal Server Error" });
            }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getSignDay = async(req, res)=>{
    try{
        const day = req.body.day
        const status = req.body.status
        const findTemplate = await profitTemplate.find({status:status, day_sign:day})
            if(findTemplate.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:`ไม่พบข้อมูลการเซ็นรับในที่ ${day}`})
            }
        const totalAmount = findTemplate.reduce((accumulator, currentItem) =>{
            // ตรวจสอบว่า currentItem.template.amount มีค่าหรือไม่
            if (currentItem.template && currentItem.template.amount) {
                // ถ้ามีให้เพิ่มค่า amount เข้ากับ accumulator
                return accumulator + currentItem.template.amount;
            } else {
                // ถ้าไม่มีให้คืนค่าเดิมของ accumulator
                return accumulator;
            }
        }, 0)
        return res
                .status(200)
                .send({
                    status:true, 
                    length:findTemplate.length,
                    total: totalAmount,
                    data:findTemplate})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getDayPay = async(req, res)=>{
    try{
        const day = req.body.day
        const partner_id = req.body.partner_id
        if(partner_id){
                const data = await profitTemplate.find({
                    owner_id: partner_id, 
                    day_sign: { $regex: new RegExp('^' + day) }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
        }else{
                const data = await profitTemplate.find({ 
                    day_sign: { $regex: new RegExp('^' + day) }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
        }
    }catch(err){
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

module.exports = { getAll, getSignDay, calCod, getSumForMe, Withdrawal, changStatus, getCod, calCod, getDayPay }