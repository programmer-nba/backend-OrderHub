const { bankRecord } = require("../../Models/bank/bank.record");
const { Partner } = require("../../Models/partner");
const { profitPartner } = require("../../Models/profit/profit.partner");
const { shopPartner } = require("../../Models/shop/shop_partner");
const mongoose = require('mongoose')

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
        const findPartner = await Partner.findOneAndUpdate(
            { _id: id },
            { $inc: { profit: -amount } },
            { new: true }
        );
        let flashPay
        if (!findPartner) {
            return res
                .status(404)
                .send({ status: false, message: "ไม่มีพาร์ทเนอร์ที่ท่านตามหา" });
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

            let v = {
                partner_number: findPartner.partnerNumber,
                // account_name:,
                // account_number:,
                // bank:,
                // amount:,
                // phone_number: ,
                // email:,
            }
        }
        return res
                .status(200)
                .send({
                    status:true,
                    data: flashPay
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

WithdrawalReverse = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const filter = { wallet_owner: id, status: "กำลังรออนุมัติ" };
        const update = { $set: { status: "เงินเข้า" } };

        const result = await profitPartner.updateMany(filter, update);
            if(!result){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหา หรีอ อัพเดทได้"})
            }
        return res
                .status(200)
                .send({status:false, data:result})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, getSumForMe, Withdrawal, WithdrawalReverse }