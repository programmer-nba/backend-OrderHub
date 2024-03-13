const { Partner } = require('../../Models/partner')
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

module.exports = {getAll, findId, findIdForUser, findShop}