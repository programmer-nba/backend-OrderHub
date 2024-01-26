const { Partner } = require("../../Models/partner");
const { shopPartner, validate } = require("../../Models/shop/shop_partner");

create = async (req, res)=>{
    try{
        const id = req.decoded.userid
        console.log(id)
        const {error} = validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
        if (error){
            return res
                    .status(403)
                    .send({ status: false, message: error.details[0].message });
        }
        const findId = await Partner.findOne({_id:id})
        if(findId){
            const createShop = await shopPartner.create(
                {...req.body,
                partnerID:id,
                firstname:findId.firstname,
                lastname:findId.lastname})
            if(createShop){
                findId.shop_id.push(createShop._id)
                await findId.save();
                return res
                        .status(200)
                        .send({status:true, data:createShop, person:findId})
            }else{
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้าง shop ได้"})
            }
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มี partner ID ของท่านในระบบ"})
        }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

delend = async (req, res)=>{

}
module.exports = {create}