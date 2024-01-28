const { Admin } = require("../../Models/admin");
const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { shopPartner } = require("../../Models/shop/shop_partner");

create = async (req, res)=>{
    try{
        const user = req.body.username
        const findPartner = await Partner.findOne({username:user})
        if(findPartner){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้ User ID นี้แล้ว"})
        }
        const findAdmin = await Admin.findOne({username:user})
        if(findAdmin){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้ User ID นี้แล้ว"})
        }
        const findIden = await memberShop.findOne({iden_number:req.body.iden_number})
        if(findIden){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้บัตรประชาชนนี้แล้ว"})
        }
        const findShop = await shopPartner.findOne({shop_number:req.body.shop_number})
        if(findShop){
            const data = {
                ...req.body,
                shop_name:findShop.shop_name
            }
            const create = await memberShop.create(data)
            return res
                    .status(200)
                    .send({status:false, data:create})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่พบรหัสร้านค้าของท่าน"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}
module.exports = { create }