const { Partner } = require('../../Models/partner')
const { historyWalletShop } = require('../../Models/shop/shop_history')
const { historyWallet } = require('../../Models/topUp/history_topup')
const { getContractByID } = require('../contractController')
const { getById } = require('./topupController')

getAll = async (req, res)=>{
    try{
        const get = await historyWallet.find()
        if(get){
            return res  
                    .status(200)
                    .send({status:true,data: get})
        }else{
            return res  
                    .status(400)
                    .send({status:true,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findId = async (req, res)=>{
    try{
        const getid = req.params.id
        const getbyid = await historyWallet.find({partnerID:getid})
        if(getbyid.length > 0){
            return res  
                    .status(200)
                    .send({status:true,data: getbyid})
        }else{
            return res  
                    .status(400)
                    .send({status:false,message:"ไม่มีข้อมูลประวัติการเติมเงินของบุคคลนี้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findIdForUser = async (req, res)=>{
    try{
        const getid = req.decoded.userid
        const getbyid = await historyWallet.find({partnerID:getid})
        if(getbyid){
            return res
                    .status(200)
                    .send({status:true,data: getbyid})
        }else{
            return res
                    .status(400)
                    .send({status:false,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findShop = async (req, res)=>{
    try{
        const shop_number = req.params.shop_number
        const getbyShop_number = await historyWallet.find({shop_number:shop_number})
        if(getbyShop_number){
            return res
                    .status(200)
                    .send({status:true,data: getbyShop_number})
        }else{
            return res
                    .status(400)
                    .send({status:false,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findAmountAll = async(req, res)=>{
    try{
        const partner_id = req.body.partner_id
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        let findPartner
        if(day_start || day_end){
            findPartner = await historyWallet.find({
                partnerID:partner_id, 
                after:"เติมเงินสำเร็จ",
                day: { $gte: day_start, $lte: day_end } 
            })
                if(findPartner.length == 0){
                    return res
                            .status(200)
                            .send({status:true, data:[]})
                }
        }else{
            findPartner = await historyWallet.find({
                partnerID:partner_id, 
                after:"เติมเงินสำเร็จ"
            })
                if(findPartner.length == 0){
                    return res
                            .status(200)
                            .send({status:true, data:[]})
                }
        }
        
        const totalAmount = findPartner.reduce((sum, record) => sum + record.amount, 0);
        console.log(`Total Amount: ${totalAmount}`);
        return res
                .status(200)
                .send({status:true,total: totalAmount, data:findPartner})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

findShopAmountAll = async(req, res)=>{
    try{
        const shop_id = req.body.shop_id
        const findShop = await historyWalletShop.find({shop_id:shop_id, remark:"ยกเลิกขนส่งสินค้า(J&T)"})
            if(findShop.length == 0){
                return res
                        .status(404)
                        .send({status:false, data:[]})
            }
        const totalAmount = findShop.reduce((sum, record) => sum + record.amount, 0);
        console.log(`Total Amount: ${totalAmount}`);
        return res
                .status(200)
                .send({
                    status:true,
                    total:totalAmount, 
                    data:findShop})
    }catch(err){
        return res  
                .status(500)
                .send({status:false, message:err.message})
    }
}
module.exports = {getAll, findId, findIdForUser, findShop, findAmountAll, findShopAmountAll}