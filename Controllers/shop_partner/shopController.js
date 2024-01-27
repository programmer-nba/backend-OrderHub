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
                    const newData = {
                        shop_name: createShop.shop_name,
                        address: createShop.address,
                        street_address: createShop.street_address,
                        sub_district: createShop.sub_district,
                        district: createShop.district,
                        province: createShop.province,
                        postcode: createShop.postcode 
                    }
                    const updatedPartner = await Partner.findByIdAndUpdate(
                        findId._id,
                        { $push: { shop_partner: newData } },
                        { new: true }
                      );
                    
                return res
                        .status(200)
                        .send({status:true, data:createShop, person:updatedPartner})
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
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

updateShop = async (req, res)=>{
    try{
        const id = req.params.id
        const partnop_id = req.decoded.userid
        const findId = await shopPartner.findOneAndUpdate(
            {_id:id},
            {...req.body,
            "tax.name_regis":req.body.name_regis,
            "tax.number_regis":req.body.number_regis},
            {new:true})
        if(findId){
            const updateShop = await Partner.findOneAndUpdate(
                {
                    _id:partnop_id,
                    "shop_partner._id":findId._id
                },
                {
                    $set:{
                        "shop_partner.$.shop_name":req.body.shop_name,
                        "shop_partner.$.address": req.body.address,
                        "shop_partner.$.street_address": req.body.street_address,
                        "shop_partner.$.sub_district": req.body.sub_district,
                        "shop_partner.$.district": req.body.district,
                        "shop_partner.$.province": req.body.province,
                        "shop_partner.$.postcode": req.body.postcode,
                    } 
                },
                {new:true})
                if(updateShop){
                    return res
                            .status(200)
                            .send({status:true, data:findId, partner:updateShop})
                }else{
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทส่วนของ Partner ได้"})
                }
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถแก้ไขข้อมูลร้านค้าได้"})
        }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

delend = async (req, res)=>{
    try{
        const id = req.params.id
        const partner_id = req.decoded.userid
        const findShop = await shopPartner.findOneAndDelete({_id:id},{new:true})
        if(findShop){
            const delShop_partner = await Partner.updateOne(
                { _id: partner_id },
                { $pull: { shop_partner: { _id:findShop._id } } },
                { multi: false, new: true }
              );
            if(delShop_partner){
                return res 
                        .status(200)
                        .send({status:true,data:findShop, del_partner:delShop_partner})
            }
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถหาร้านค้าได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getAll = async (req, res)=>{
    try{
        const get = await shopPartner.find()
        if(get){
            return res
                    .status(200)
                    .send({status:true, data: get})       
         }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถดึงข้อมูลด้วย"})
         }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getShopPartner = async (req, res)=>{
    try{
        const id = req.decoded.userid
        console.log(id)
        const getShop = await shopPartner.find({partnerID:id})
        if(getShop){
            return res
                    .status(200)
                    .send({status:true, data: getShop})       
         }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถดึงข้อมูลด้วย"})
         }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}
module.exports = {create, updateShop, delend, getAll, getShopPartner}