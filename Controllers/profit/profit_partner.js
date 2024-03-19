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
        const id = req.decoded.userid
        console.log("id:", id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ status: false, message: "รูปแบบของ ID ไม่ถูกต้อง" });
        }

        // const objectId = mongoose.Types.ObjectId(id);
        // console.log(objectId);
        const findPartner = await Partner.findOneAndUpdate(
            { _id: id },
            { $inc: { profit: -amount } },
            { new: true }
        );

        if (!findPartner) {
            return res
                .status(404)
                .send({ status: false, message: "ไม่มีพาร์ทเนอร์ที่ท่านตามหา" });
        } else {
            const aggregatedData = await Partner.aggregate([
                {
                    $match: { _id: id } // กรอง Partner ที่ต้องการ
                }
            ]);
            console.log(aggregatedData);
        }
        return res
                .status(200)
                .send({
                    status:true, 
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