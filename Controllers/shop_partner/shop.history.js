const { historyWalletShop } = require("../../Models/shop/shop_history");
const { shopPartner } = require("../../Models/shop/shop_partner");

getAll = async (req, res)=>{
    try{
        const getAll = await historyWalletShop.find()
        if(getAll){
            return res
                    .status(200)
                    .send({status:true, data:getAll})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getOne = async (req, res)=>{
    try{
        const shopNumber = req.params.shop_number
        const findShop = await historyWalletShop.find({shop_number:shopNumber})
        if(!findShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขร้านค้าได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, data:findShop})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getById = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findShop = await historyWalletShop.find({ID:id})
        if(!findShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขร้านค้าได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, data:findShop})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
module.exports = { getAll, getOne, getById }