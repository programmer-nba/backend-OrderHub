const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { shopPartner, validate } = require("../../Models/shop/shop_partner");
const { uploadFileCreate, deleteFile } = require("../../functions/uploadfilecreate");
const multer = require("multer");
const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

create = async (req, res)=>{
    try{
        const id = req.decoded.userid
        console.log(id)
        // const {error} = validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
        // if (error){
        //     return res
        //             .status(403)
        //             .send({ status: false, message: error.details[0].message });
        // }
        const taxOrCom = await shopPartner.findOne({
            $or: [ //$or ใช้เพื่อเช็คถ้าเข้าเงื่อนไขใดเงื่อนไขหนึ่งให้เก็บ ducument ของคนๆนั้นไว้(กรณีด้านล่างมี 4 เงื่อนไข)
              { "tax.taxName": req.body.taxName },
              { "tax.taxNumber": req.body.taxNumber },
              { "commercial.commercialName": req.body.commercialName },
              { "commercial.commercialNumber": req.body.commercialNumber }
            ]
          });
        if(taxOrCom){
            return res
                    .status(400)
                    .send({status:false, message:'ชื่อที่จดทะเบียนหรือเลขที่จดทะเบียนมีอยู่แล้วในระบบ',data:taxOrCom})
        }
        const findId = await Partner.findOne({_id:id})
        if(findId){
            const createShop = await shopPartner.create(
                {...req.body,
                "tax.taxName":req.body.taxName,
                "tax.taxNumber":req.body.taxNumber,
                "commercial.commercialName":req.body.commercialName,
                "commercial.commercialNumber":req.body.commercialNumber,
                partnerID:id,
                partner_number:findId.partnerNumber,
                firstname:findId.firstname,
                lastname:findId.lastname})
            return res
                    .status(200)
                    .send({status:true, data:createShop})
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
                        "shop_partner.$.shop_number":req.body.shop_number,
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
        const findShop = await shopPartner.findOneAndDelete({shop_number:id},{new:true}) //ลบข้อมูลร้านค้าในฐานข้อมูล shop_partner
        if(findShop){
            const delShop_partner = await Partner.updateOne( //ลบข้อมูลร้านค้าในฐานข้อมูลของ partner โดยตรง
                { _id: partner_id },
                { $pull: { shop_partner: { _id:findShop._id } } },
                { multi: false, new: true }
              );
            if(delShop_partner){
                return res 
                        .status(200)
                        .send({status:true,data:findShop, del_partner:delShop_partner})
            }else{
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบข้อมูลได้"})
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
        if(req.decoded.role == "shop_member"){
            const getShopMember = await shopPartner.findOne({shop_number: req.decoded.shop_number})
            if(!getShopMember){
                return res
                    .status(400)
                    .send({status:false, message:"ไม่มีร้านค้านี้ในระบบ"})
            }
            return res
                    .status(200)
                    .send({status:true, data: getShopMember})
        }
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

getShopOne = async (req, res)=>{
    try{
        const shopNumber = req.params.id
        const findShop = await shopPartner.findOne({shop_number:shopNumber})
        if(findShop){
            const findMember = await memberShop.find({shop_number:shopNumber})
            const memberCount = findMember.length
            return res
                    .status(200)
                    .send({status:true, data:findShop, member:memberCount})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีรหัสร้านค้านี้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getShopPartnerByAdmin = async (req, res) =>{
    try{
        const id = req.params.id
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

findShopMember = async (req, res)=>{
    try{
        const idShop = req.params.id
        const findMember = await memberShop.find({shop_number:idShop})
        if(findMember){
            return res
                    .status(200)
                    .send({status:true, data: findMember})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่เจอรหัสร้านค้าที่ท่านต้องการดู"})
        }
    }catch(err){
        console.log(err)
        return res 
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

uploadPicture = async (req,res)=>{
    try {
      let upload = multer({ storage: storage })
      const fields = [
        {name: 'picture', maxCount: 1}
        // {name: 'pictureTwo', maxCount: 1}
      ]
      const uploadMiddleware = upload.fields(fields);
      uploadMiddleware(req, res, async function (err) {
        const reqFiles = [];
        const result = [];
        if (!req.files) {
          return res.status(400).send({ message: 'No files were uploaded.' });
        }
        const url = req.protocol + "://" + req.get("host");
        for (const fieldName in req.files) {
          const files = req.files[fieldName];
          for (var i = 0; i < files.length; i++) {
            const src = await uploadFileCreate(files[i], res, { i, reqFiles });
            result.push(src);
          }
        }
        console.log(result[0])
        const id = req.params.id;
        const member = await shopPartner.findByIdAndUpdate(id, {
            picture: result[0],
          },{new:true});
          if (!member) {
              return res.status(500).send({
              message: "ไม่สามารถเพิ่มรูปภาพได้",
              status: false,
            });
          }else{
              return res.status(200).send({
              message: "เพิ่มรูปภาพสำเร็จ",
              status: true,
              data: member
            });
          }
      });
      
    } catch (error) {
      return res.status(500).send({ status: false, error: error.message });
    }
}

module.exports = {create, updateShop, delend, getAll, getShopPartner, getShopOne, getShopPartnerByAdmin, findShopMember, uploadPicture}