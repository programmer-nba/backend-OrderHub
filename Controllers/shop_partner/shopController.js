const { codPercent } = require("../../Models/COD/cod.shop.model");
const { PercentCourier } = require("../../Models/Delivery/ship_pop/percent");
const { priceBase } = require("../../Models/Delivery/weight/priceBase.express");
const { weightAll } = require("../../Models/Delivery/weight/weight.all.express");
const { Admin } = require("../../Models/admin");
const { Blacklist } = require("../../Models/blacklist");
const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { historyWalletShop } = require("../../Models/shop/shop_history");
const { shopPartner, validate } = require("../../Models/shop/shop_partner");
const { historyWallet } = require("../../Models/topUp/history_topup");
const { uploadFileCreate, deleteFile } = require("../../functions/uploadfilecreate");
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const multer = require("multer");
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

create = async (req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const id = req.decoded.userid
        console.log(id_shop)
            if(req.body.shop_status != 'owner' && req.body.shop_status != 'downline'){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุสถานะให้ถูกต้อง"})
            }else if(!id_shop || id_shop == ':id_shop' && req.body.shop_status == 'downline'){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุสาขาหลักที่ท่านต้องการอ้างอิงราคา"})
            }
        const taxOrCom = await shopPartner.findOne({
            $or: [ //$or ใช้เพื่อเช็คถ้าเข้าเงื่อนไขใดเงื่อนไขหนึ่งให้เก็บ ducument ของคนๆนั้นไว้(กรณีด้านล่างมี 6 เงื่อนไข)
              { "tax.taxName": req.body.taxName },
              { "tax.taxNumber": req.body.taxNumber },
              { "commercial.commercialName": req.body.commercialName },
              { "commercial.commercialNumber": req.body.commercialNumber },
              { shop_number: req.body.shop_number },
              { shop_name: req.body.shop_name },
            ]
          })
            if(taxOrCom){
                if(taxOrCom.shop_number == req.body.shop_number){
                    return res
                        .status(401)
                        .send({status:false, message:'หมายเลขสาขานี้มีในระบบแล้ว'})
                }else if(taxOrCom.shop_name == req.body.shop_name){
                    return res
                        .status(401)
                        .send({status:false, message:'มีผู้ใช้ชื่อร้านนี้ไปแล้ว'})
                }
                return res
                        .status(401)
                        .send({status:false, message:'ชื่อที่จดทะเบียนหรือเลขที่จดทะเบียนมีอยู่แล้วในระบบ'})
            }
        
        const findPartnerOne = await Partner.findOne({_id:id})
            if(!findPartnerOne){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีพาร์ทเนอร์นี้ในระบบ"})
            }

            if(req.body.shop_status == 'downline'){ //เป็นการสร้างร้านให้พาร์ทเนอร์คนอื่น

                let findShop = await shopPartner.findOne({_id:id_shop})
                    if(!findShop){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบร้านค้าของท่านในระบบ"})
                    }

                let levelInt = findPartnerOne.upline.level + 1
                console.log(levelInt)

                    if(levelInt > 3){
                        return res
                                .status(400)
                                .send({status:false, message:"ท่านไม่สามารถสร้างร้านค้าพาร์ทเนอร์ให้ผู้อื่นได้"})
                    }

                    const blacklist = await Blacklist.findOne({iden_number: req.body.iden_number})
                          if (blacklist){
                              return res
                                      .status(401)
                                      .send({status: false, message:"หมายเลขบัตรประชาชนนี้ติด Blacklist"})
                          }
                
                    const duplicate = await Partner.findOne({ //ตรวจสอบบัตรประชาชนและ username ของพนักงานว่ามีซ้ำกันหรือไม่
                          $or: [
                            { iden_number: req.body.partner_iden_number },
                            { username: req.body.partner_email }
                        ]});
                          if (duplicate){
                            if (duplicate.iden_number == req.body.partner_iden_number) {
                              // ถ้าพบว่า iden_number ซ้ำ
                              return res
                                      .status(401)
                                      .json({status:false, message: 'มีผู้ใช้บัตรประชาชนนี้ในระบบแล้ว'});
                            } else if (duplicate.username == req.body.partner_email) {
                              // ถ้าพบว่า userid ซ้ำ
                              return res
                                      .status(401)
                                      .json({status:false, message: 'มีผู้ใช้ E-mail นี้ในระบบแล้ว'});
                            }
                          }

                    const [findAdmin, findMemberShop] = await Promise.all([
                            Admin.findOne({ username: req.body.partner_email }),
                            memberShop.findOne({ username: req.body.partner_email })
                        ]);  
                            if (findAdmin) {
                                return res.status(401).send({ status: false, message: "มีผู้ใช้ E-mail นี้ในระบบแล้ว" });
                            }
                        
                            if (findMemberShop) {
                                return res.status(401).send({ status: false, message: "มีผู้ใช้ E-mail นี้ในระบบแล้ว" });
                            }
                    
                    const createPartner = await Partner.create(
                        {
                            antecedent: req.body.partner_antecedent,
                            firstname: req.body.partner_firstname,
                            lastname: req.body.partner_lastname,
                            username: req.body.partner_email,
                            password: req.body.partner_iden_number,
                            iden_number: req.body.partner_iden_number,
                            tel: req.body.partner_tel,
                            email: req.body.partner_email,
                            'upline.head_line': id,
                            'upline.upline_number':findPartnerOne.partnerNumber,
                            'upline.shop_upline':id_shop,
                            'upline.level':levelInt
                        })
                        if(!createPartner){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างพาร์ทเนอร์ได้"})
                        }
                    const createShop = await shopPartner.create(
                        {
                                partnerID:createPartner._id,
                                partner_number:createPartner.partnerNumber,
                                shop_number:req.body.shop_number,
                                shop_name:req.body.shop_name,
                                firstname:createPartner.firstname,
                                lastname:createPartner.lastname,
                                address:req.body.address,
                                street_address:req.body.street_address,
                                type:req.body.type,
                                sub_district: req.body.sub_district, //ตำบล
                                district:req.body.district,
                                province: req.body.province,
                                postcode: req.body.postcode,
                                "tax.taxName":req.body.taxName,
                                "tax.taxNumber":req.body.taxNumber,
                                "commercial.commercialName":req.body.commercialName,
                                "commercial.commercialNumber":req.body.commercialNumber,
                                shop_status:'downline',
                                "upline.head_line":id,
                                "upline.down_line":createPartner._id,
                                "upline.shop_line":id_shop,
                                'upline.level':levelInt,
                                
                        })
                        if(!createShop){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างร้านค้าได้"})
                        }
            
                    // console.log(findLine)
                return res
                        .status(200)
                        .send({
                                status:true, 
                                data:createShop, 
                                partner:createPartner
                            })

            }else if(req.body.shop_status == 'owner'){//เป็นการสร้างร้านของตนเอง
                    
                    const createShop = await shopPartner.create(
                        {
                                partnerID:findPartnerOne._id,
                                partner_number:findPartnerOne.partnerNumber,
                                shop_number:req.body.shop_number,
                                shop_name:req.body.shop_name,
                                firstname:findPartnerOne.firstname,
                                lastname:findPartnerOne.lastname,
                                address:req.body.address,
                                street_address:req.body.street_address,
                                type:req.body.type,
                                sub_district: req.body.sub_district, //ตำบล
                                district:req.body.district,
                                province: req.body.province,
                                postcode: req.body.postcode,
                                "tax.taxName":req.body.taxName,
                                "tax.taxNumber":req.body.taxNumber,
                                "commercial.commercialName":req.body.commercialName,
                                "commercial.commercialNumber":req.body.commercialNumber,
                                shop_status:'owner',
                                "upline.head_line":findPartnerOne.upline.head_line,
                                "upline.down_line":findPartnerOne._id,
                                "upline.shop_line":findPartnerOne.upline.shop_upline,
                                'upline.level':findPartnerOne.upline.level,
                        })
                        
                        if(!createShop){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างร้านค้าได้"})
                        }
                return res
                        .status(200)
                        .send({
                                status:true, 
                                data:createShop
                            })
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
        const findShop = await shopPartner.findOneAndDelete({shop_number:id},{new:true}) //ลบข้อมูลร้านค้าในฐานข้อมูล shop_partner
        if(findShop){
            const delShop_downline = await shopPartner.updateMany(
                {
                    $pull: {
                        "upline.shop_downline":findShop._id
                    }
                }
            )
            const delShop_partner = await Partner.updateMany(
                { 
                    $pull: { 
                        "shop_me": { "_id": findShop._id }, 
                        "shop_partner": { "_id": findShop._id } 
                    } 
                }
            );
            
            const delWeight = await weightAll.deleteMany({shop_id:findShop._id})

            const delCod = await codPercent.findOneAndDelete({shop_id:findShop._id})
                if(!delCod){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถลบ COD ของร้านค้าได้"})
                }
            return res 
                    .status(200)
                    .send({
                        status:true, 
                        message:"ลบข้อมูลสำเร็จ",
                        data:delShop_partner, 
                        del_downline:delShop_downline, 
                        delWeight:delWeight,
                        delCod: delCod
                    })

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
        const id = req.params.id
        const findShop = await shopPartner.findOne({_id:id})
        if(findShop){
            const findMember = await memberShop.find({shop_number:findShop.shop_number})
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

tranfersCreditsToShop = async (req, res)=>{
    try{
        const partner_id = req.decoded.userid
        const id_shop = req.params.id_shop
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
        
        const findPartner = await Partner.findOne(
            {
                _id:partner_id,
                shop_me:{
                    $elemMatch: { _id: id_shop } //การหา _id ที่ตรงกับ id_shop ที่ user ส่งมา
                }
            }
        )
            if(!findPartner){
                return res
                        .status(404)
                        .send({status:false, message:"กรุณาระบุร้านค้าที่ท่านเป็นเจ้าของ"})
            }else if(findPartner.credits <= 0){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาเติมเงินเข้าระบบก่อนที่จะทำการโยกย้ายเงินไปยัง สาขา ที่ท่านต้องการ"})
            }else if(findPartner.credits < amount){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุจำนวนเงินไม่เกิน credits ที่คุณมี"})
            }
        //ตัดเงิน Partner
        const cutCredtisPartner = await Partner.findOneAndUpdate(
            {_id:partner_id},
            {
                $inc: { credits: -amount }
            },
            {new:true,  projection: { credits: 1 }})
            if(!cutCredtisPartner){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบเงิน Partner ได้"})
            }
        //เพิ่มเงิน Shop
        const tranferToShop = await shopPartner.findOneAndUpdate(
            {_id:id_shop},
            {
                $inc: { credit: +amount }
            },
            {new:true,  projection: { credit: 1, shop_number: 1 }})
            if(!tranferToShop){
                // ถ้าไม่สามารถเพิ่มเงินให้กับร้านค้าได้
                // ควรจะยกเลิกการลดเครดิตของ Partner ที่ทำไว้ก่อนหน้านี้
                // โดยการย้อนคืนการลดเครดิตที่ทำไว้
                await Partner.findOneAndUpdate(
                    { _id: partner_id },
                    { $inc: { credits: +amount } }
                );
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเพิ่มเงิน Shop ได้"})
            }
        let plus = tranferToShop.credit - amount
        const partnerToShop = await invoicePTS()
            const dataHistoryShop = {
                    partnerID: partner_id,
                    shop_number: tranferToShop.shop_number,
                    orderid: partnerToShop,
                    amount: amount,
                    before: plus,
                    after: tranferToShop.credit,
                    type: "เงินเข้า",
                    remark: "พาร์ทเนอร์นำเงินเข้าร้านค้า"
                }
            const historyShop = await historyWalletShop.create(dataHistoryShop)
                if(!historyShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินร้านค้าได้"})
                }

            const dataHistoryPartner = {
                    partnerID: partner_id,
                    shop_number: tranferToShop.shop_number,
                    orderid: partnerToShop,
                    amount: amount,
                    before: findPartner.credits,
                    after: "พาร์ทเนอร์นำเงินเข้าร้านค้า",
                    money_now: cutCredtisPartner.credits,
                    type: "เงินออก"
                }
            const historyPartner = await historyWallet.create(dataHistoryPartner)
                if(!historyPartner){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
                }
        return res
                .status(200)
                .send({
                    status:true, 
                    parner: cutCredtisPartner, 
                    shop: tranferToShop,
                    historyShop: historyShop,
                    historyPartner: historyPartner,
                 })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

tranfersShopToPartner = async (req, res)=>{
    try{
            const partner_id = req.decoded.userid
            const id_shop = req.params.id_shop
            const amount = req.body.amount
                if (!amount || isNaN(amount) || amount < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
                    return res.status(400).send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
                }else if (!/^(\d+(\.\d{1,2})?)$/.test(amount.toString())){
                    return res
                            .status(400)
                            .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
                }
            console.log(partner_id)
            const findPartner = await Partner.findOne(
                {
                    _id:partner_id,
                    shop_me:{
                        $elemMatch: { _id: id_shop } //การหา _id ที่ตรงกับ id_shop ที่ user ส่งมา
                    }
                }
            )
                if(!findPartner){
                    return res
                            .status(404)
                            .send({status:false, message:"กรุณาระบุร้านค้าที่ท่านเป็นเจ้าของ"})
                }

            const findCreditShop = await shopPartner.findOne({_id:id_shop})
                if(!findCreditShop){
                    return res
                            .status(404)
                            .send({status:false, message:"กรุณาระบุร้านค้าให้ถูกต้อง"})
                }else if(findCreditShop.credit <= 0){
                    return res
                            .status(400)
                            .send({status:false, message:"ร้านค้านี้ยังไม่มี credits ให้ทำการโยกย้ายเงิน(กรุณาเติมเงินเข้าร้านค้าก่อน)"})
                }else if(findCreditShop.credit < amount){
                    return res
                            .status(400)
                            .send({status:false, message:"กรุณาระบุจำนวนเงินไม่เกิน credits ที่ร้านค้ามี"})
                }

            //ตัดเงิน Shop
            const cutCredtisShop = await shopPartner.findOneAndUpdate(
                {_id:id_shop},
                {
                    $inc: { credit: -amount }
                },
                {new:true,  projection: { credit: 1, shop_number: 1 }})
                if(!cutCredtisShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถลบเงิน Shop ได้"})
                }
            //เพิ่มเงิน Partner
            const tranferToPartner = await Partner.findOneAndUpdate(
                {_id:partner_id},
                {
                    $inc: { credits: +amount }
                },
                {new:true,  projection: { credits: 1 }})
                if(!tranferToPartner){
                    // ถ้าไม่สามารถเพิ่มเงินให้กับพาร์ทเนอร์ได้
                    // ควรจะยกเลิกการลดเครดิตของ Shop ที่ทำไว้ก่อนหน้านี้
                    // โดยการย้อนคืนการลดเครดิตที่ทำไว้
                    await shopPartner.findOneAndUpdate(
                        { _id: id_shop },
                        { $inc: { credit: +amount } }
                    );
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
                }
            const ShopToPartner = await invoiceSTP(dayjsTimestamp)
            const dataHistoryShop = {
                    partnerID: partner_id,
                    shop_number: cutCredtisShop.shop_number,
                    orderid: ShopToPartner,
                    amount: amount,
                    before: findCreditShop.credit,
                    after: cutCredtisShop.credit,
                    type: "เงินออก",
                    remark: "พาร์ทเนอร์นำเงินออกร้านค้า"
                }
            const historyShop = await historyWalletShop.create(dataHistoryShop)
                if(!historyShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินร้านค้าได้"})
                }

            const dataHistoryPartner = {
                    partnerID: partner_id,
                    shop_number: cutCredtisShop.shop_number,
                    orderid: ShopToPartner,
                    amount: amount,
                    before: findPartner.credits,
                    after: "พาร์ทเนอร์นำเงินออกร้านค้า",
                    money_now: tranferToPartner.credits,
                    type: "เงินเข้า",
                }
            const historyPartner = await historyWallet.create(dataHistoryPartner)
                if(!historyPartner){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
                }
        return res
                .status(200)
                .send({
                    status:true, 
                    parner: cutCredtisShop, 
                    shop: tranferToPartner,
                    historyShop: historyShop,
                    historyPartner: historyPartner
                 })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

editExpress = async (req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const id_user = req.decoded.userid
        const role = req.decoded.role
        const {id_express, cancel_contract, on_off} = req.body
        const findShopOne = await shopPartner.findById(id_shop)
            if(!findShopOne){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านค้าได้"})
            }
            if (role != 'admin') {
                if(id_user != findShopOne.upline.head_line){
                    return res.status(400).send({
                        status: false,
                        message: "คุณไม่มีสิทธิ์แก้สถานะของร้านค้านี้"
                    });
                }
            }

        let level_partner 
        if(role == 'admin'){
            level_partner = 0
        }else{
            const findUser = await Partner.findOne({_id:id_user})
            if(!findUser){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูลพาร์ทเนอร์"})
            }
            level_partner = findUser.upline.level
        }
        console.log(level_partner)
        if(on_off == false){
            const p = findShopOne.express.find((item)=> item._id.toString() == id_express.toString())
            console.log(p)
            if(level_partner > p.level){ //ถ้า level ผู้ทำการ ยิง API นี้สูงกว่า level ของผู้ถูกเปลี่ยนข้อมูล จะไม่สามารถเปลี่ยนได้
                return res
                        .status(400)
                        .send({status:false, message:"คุณไม่มีสิทธิ์ เปิด-ปิด ขนส่งนี้"})
            }else{
                try {
                    let id_express_object = new mongoose.Types.ObjectId(id_express)
                    let bulkPush = []
                    let bulkCodPush = []
                    const changLevel = {
                            updateOne: {
                                filter: { _id: id_shop },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                        'express.$[element].level': level_partner,
                                    }
                                },
                                arrayFilters: [{ 'element._id': id_express_object }],
                            }
                        }
                    const changOnOffCod = {
                            updateOne: {
                                filter: { shop_id: id_shop },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                    }
                                },
                                arrayFilters: [{ 'element.express': p.express }],
                            }
                        }
                    const bulk = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { _id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                        'express.$[element].level': level_partner,
                                    }
                                },
                                arrayFilters: [{ 'element.courier_code': p.courier_code }],
                            }
                    }))
                    const bulkCod = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { shop_id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                    }
                                },
                                arrayFilters: [{ 'element.express': p.express }],
                            }
                    }))
                    // console.log(bulkCod)
                    bulkPush = bulkPush.concat(changLevel, bulk);
                    bulkCodPush= bulkCodPush.concat(changOnOffCod, bulkCod)
                    const result = await shopPartner.bulkWrite(bulkPush);
                    const resultCOD = await codPercent.bulkWrite(bulkCodPush)
                    return res
                            .status(200)
                            .send({ 
                                status: true, 
                                message:"อัพเดทข้อมูลสำเร็จ",
                                data: result,
                                cod: resultCOD
                            });
        
                } catch (error) {
                    console.error(error);
                    return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });
                }
            }
        }else if(on_off == true){
            const p = findShopOne.express.find((item)=> item._id.toString() == id_express.toString())
            if(level_partner > p.level){
                return res
                        .status(400)
                        .send({status:false, message:"คุณไม่มีสิทธิ์ เปิด-ปิด ขนส่งนี้"})
            }else{
                try {
                    let id_express_object = new mongoose.Types.ObjectId(id_express)
                    let bulkPush = []
                    let bulkCodPush = []
                    //แก้สถานะ SHOP
                    const changLevel = {
                            updateOne: {
                                filter: { _id: id_shop },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                        'express.$[element].level': 2,
                                    }
                                },
                                arrayFilters: [{ 'element._id': id_express_object }],
                            }
                        }
                    const bulk = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { _id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[element].on_off': on_off,
                                        'express.$[element].level': 2,
                                    }
                                },
                                arrayFilters: [{ 'element.courier_code': p.courier_code }],
                            }
                    }))

                    //แก้ COD SHOP
                    const changOnOffCod = {
                        updateOne: {
                            filter: { shop_id: id_shop },
                            update: { 
                                $set: {
                                    'express.$[element].on_off': on_off,
                                }
                            },
                            arrayFilters: [{ 'element.express': p.express }],
                        }
                    }
                    const bulkCod = findShopOne.upline.shop_downline.map(data => ({
                        updateOne: {
                            filter: { shop_id: data._id },
                            update: { 
                                $set: {
                                    'express.$[element].on_off': on_off,
                                }
                            },
                            arrayFilters: [{ 'element.express': p.express }],
                        }
                    }))
                    bulkPush = bulkPush.concat(changLevel, bulk);
                    bulkCodPush = bulkCodPush.concat(changOnOffCod, bulkCod)

                    const resultCOD = await codPercent.bulkWrite(bulkCodPush)
                    const result = await shopPartner.bulkWrite(bulkPush);

                    return res
                            .status(200)
                            .send({ 
                                status: true, 
                                message:"อัพเดทข้อมูลสำเร็จ",
                                data: result,
                                cod: resultCOD
                             });
        
                } catch (error) {
                    console.error(error);
                    return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });
                }
            }
        }
 
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

editExpressAll = async (req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const id_user = req.decoded.userid
        const on_off = req.body.on_off
        const role = req.decoded.role
            if (on_off !== true && on_off !== false) {
                return res
                        .status(200)
                        .send({status:false, message:"ท่านต้องกรอก true or false เท่านั้น"})
            } 

        const findShopOne = await shopPartner.findById(id_shop)
            if(!findShopOne){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านค้าได้"})
            }
            if (role != 'admin') {
                if(id_user != findShopOne.upline.head_line){
                    return res.status(400).send({
                        status: false,
                        message: "คุณไม่มีสิทธิ์แก้สถานะของร้านค้านี้"
                    });
                }
            }

        let level_partner 
        if(role == 'admin'){
            level_partner = 0
        }else{
            const findUser = await Partner.findOne({_id:id_user})
            if(!findUser){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูลพาร์ทเนอร์"})
            }
            level_partner = findUser.upline.level
        }
        console.log(level_partner)
        if(on_off == false){
                try {
                    let bulkPush = []
                    let bulkCodPush = []
                    const changLevel = {
                            updateOne: {
                                filter: { _id: id_shop },
                                update: { 
                                    $set: {
                                        "express.$[].on_off": on_off,
                                        'express.$[].level': level_partner
                                    }
                                }
                            }
                        }

                    const bulk = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { _id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[].on_off': on_off,
                                        'express.$[].level': level_partner,
                                    }
                                }
                            }
                    }))

                    const changOnOffCod = {
                            updateOne: {
                                filter: { shop_id: id_shop },
                                update: { 
                                    $set: {
                                        'express.$[].on_off': on_off,
                                    }
                                }
                            }
                    }
                    const bulkCod = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { shop_id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[].on_off': on_off,
                                    }
                                }
                            }
                    }))
                    // console.log(bulkCod)
                    bulkPush = bulkPush.concat(changLevel, bulk);
                    bulkCodPush= bulkCodPush.concat(changOnOffCod, bulkCod)
                    const result = await shopPartner.bulkWrite(bulkPush);
                    const resultCOD = await codPercent.bulkWrite(bulkCodPush)
                    return res
                            .status(200)
                            .send({ 
                                status: true, 
                                message:"อัพเดทข้อมูลสำเร็จ",
                                data: result,
                                cod: resultCOD
                            });
        
                } catch (error) {
                    console.error(error);
                    return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });
                }
            
        }else if(on_off == true){
                try {
                    let bulkPush = []
                    let bulkCodPush = []
                    //แก้สถานะ SHOP
                    const changLevel = {
                            updateOne: {
                                filter: { _id: id_shop },
                                update: { 
                                    $set: {
                                        'express.$[].on_off': on_off,
                                        'express.$[].level': 2,
                                    }
                                },
                            }
                        }
                    const bulk = findShopOne.upline.shop_downline.map(data => ({
                            updateOne: {
                                filter: { _id: data._id },
                                update: { 
                                    $set: {
                                        'express.$[].on_off': on_off,
                                        'express.$[].level': 2,
                                    }
                                }
                            }
                    }))

                    //แก้ COD SHOP
                    const changOnOffCod = {
                        updateOne: {
                            filter: { shop_id: id_shop },
                            update: { 
                                $set: {
                                    'express.$[].on_off': on_off,
                                }
                            }
                        }
                    }
                    const bulkCod = findShopOne.upline.shop_downline.map(data => ({
                        updateOne: {
                            filter: { shop_id: data._id },
                            update: { 
                                $set: {
                                    'express.$[].on_off': on_off,
                                }
                            }
                        }
                    }))
                    bulkPush = bulkPush.concat(changLevel, bulk);
                    bulkCodPush = bulkCodPush.concat(changOnOffCod, bulkCod)

                    const resultCOD = await codPercent.bulkWrite(bulkCodPush)
                    const result = await shopPartner.bulkWrite(bulkPush);

                    return res
                            .status(200)
                            .send({ 
                                status: true, 
                                message:"อัพเดทข้อมูลสำเร็จ",
                                data: result,
                                cod: resultCOD
                             });
        
                } catch (error) {
                    console.error(error);
                    return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });

            }
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

pushExpress = async (req, res)=>{//ไม่ได้ใช้แล้ว
    try{
        const id_shop = req.params.id_shop

        const findPercent = await PercentCourier.find()
        const findShop = await shopPartner.find()
        let newData = []
        for (let i = 0; i < findShop.length; i++) {
            const expressShop = findShop[i].express
                // console.log(expressShop)
            const existingCourierCodes = expressShop.map(express => express.courier_code);
            for (const percent of findPercent) {
                if (!existingCourierCodes.includes(percent.courier_code)) { //includes() เป็นเมธอดของ Array ใน JavaScript ที่ใช้เพื่อตรวจสอบว่าค่าที่ระบุมีอยู่ใน Array หรือไม่ ซึ่งจะคืนค่าเป็น true หากค่าที่ระบุมีอยู่ใน Array และคืนค่าเป็น false หากค่าที่ระบุไม่มีอยู่ใน Array
                    // เพิ่มข้อมูลใหม่เข้าไปใน expressShop
                    const expressData = {
                        express: percent.express,
                        courier_code: percent.courier_code,
                        courier_name: percent.courier_name,
                        costBangkok_metropolitan: percent.costBangkok_metropolitan,
                        costUpcountry: percent.costUpcountry,
                        salesBangkok_metropolitan: percent.salesBangkok_metropolitan,
                        salesUpcountry: percent.salesUpcountry,
                        on_off: percent.on_off,
                        cancel_contract: percent.cancel_contract
                    };
                    newData.push({
                        _id:findShop[i]._id,
                        expressData
                    })
                    const updateExpress = await shopPartner.findOneAndUpdate(
                        {
                            _id: findShop[i]._id
                        },
                        {
                            $push: { express: expressData }
                        },
                        { new: true }
                    );
                }
            }
        }
        return res
                .status(200)
                .send({status:true, data:newData})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

statusContract = async (req, res)=>{
    try{
            const status = req.body.status
            const express = req.body.express
                if(status != true && status != false){
                    return res
                            .status(400)
                            .send({status:false, message:"กรุณากรอก true or false เท่านั้น"})
                }
            const findPercent = await PercentCourier.updateMany(
                { express: express },
                { $set: { cancel_contract: status } },
                { returnOriginal: false })
                if(!findPercent){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่มีขนส่งนี้ในระบบ"})
                }
            const update = await shopPartner.updateMany(
                    { "express.express": express }, // เงื่อนไขในการค้นหาเอกสารที่มี "express" ในอาร์เรย์ซึ่งมีค่าเป็น express ที่ถูกส่งเข้ามา
                    { $set: { "express.$[elem].cancel_contract": status } }, // ทำการอัปเดตฟิลด์ "cancel_contract" ของอ็อบเจกต์ในอาร์เรย์ "express"
                    { arrayFilters: [{ "elem.express": express }] } // กำหนดเงื่อนไขในการอัปเดตเฉพาะอ็อบเจกต์ที่มี "express" เท่ากับค่าที่ถูกส่งเข้ามา
                );
                if (update.modifiedCount == 0) {
                    return res.status(200).send({
                        status: true,
                        message: "กรุณาใส่ชื่อขนส่งให้ถูกต้อง"
                    });
                }
        return res 
                .status(200)
                .send({
                    status:true, 
                    message:`แก้ไขสถานะ cancel_contract(${status}) สำเร็จ`, 
                    data: update,
                    courier: findPercent
                })
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

fixNameExpress = async (req, res)=>{
    try{
        const update = await shopPartner.updateMany(
            {}, // ตัวกรอง (ในที่นี้เป็นเงื่อนไขว่าจะให้แก้ทุก Object)
            { $set: { "express.$[].level": 3 } } // การปรับปรุง (ในที่นี้เป็นการเพิ่มฟิลด์ "newValue" ในทุก Object ในอาร์เรย์ "express")
         )
         if(!update){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถอัพเดทได้"})
         }else{
            return res
                    .status(200)
                    .send({status:true, data:update})
         }
        
        // const percent = await PercentCourier.find()
        // const baseWeight = percent.map(({ _id, express, courier_code, courier_name, costBangkok_metropolitan, costUpcountry }) => ({
        //     express,
        //     courier_code,
        //     courier_name,
        //     costBangkok_metropolitan,
        //     costUpcountry
        // }));
        // // const update = await shopPartner.updateMany(
        // //     { "express.express": "shippop" },
        // //     { $set: { "express.$[elem].express": "SHIPPOP" } }, // เซ็ตค่า "express" เป็น "SHIPPOP" ในตำแหน่งที่ตรงกับเงื่อนไขการค้นหา
        // //     { arrayFilters: [{ "elem.express": "shippop" }] } // ตัวกรองอาร์เรย์เพื่อกำหนดเงื่อนไขการค้นหาในอาร์เรย์
        // // );
        // const update = await shopPartner.updateMany(
        //     { $push:{ express : baseWeight }}
        // )
        // if (update) {
        //     // มีการอัพเดท
        //     return res.status(200).send({ status: true, data: update });
        // } else {
        //     // ไม่มีการอัพเดท
        //     return res.status(404).send({ status: false, message: "ไม่สามารถอัพเดทได้" });
        // }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

findShopDownLine = async (req, res)=>{
    try{
        const id = req.params.id
        const findShop = await shopPartner.findById(id)
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบร้านค้าที่ต้องการ"})
            }
        const level = findShop.upline.level + 1
        
        const findDownline = findShop.upline.shop_downline.map(async (item)=>{
            const find = await shopPartner.findById(item._id)
                if(!find){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่มีข้อมูลร้านค้าในระบบ"})
                }else if(find.upline.level == level){
                    return find
                }
        })
        const downlines = (await Promise.all(findDownline)).filter(item => item != undefined);
        return res
                .status(200)
                .send({status:true, data:downlines})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

fixCredits = async(req, res)=>{
    try{
        const id = req.params.id
        const amount = req.body.amount
        
        const findShop = await Partner.findOneAndUpdate(
            {_id:id},
            {
                credits:amount
            },
            {new:true})
            if(!findShop){
                return res  
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านค้าเจอ"})
            }
        return res
                .status(200)
                .send({status:false, data:findShop})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

async function invoicePTS(date) {
    let data = `PTS`
    date = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + date + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + date + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

async function invoiceSTP(date) {
    let data = `STP`
    date = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + date + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + date + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = {create, updateShop, delend, getAll, getShopPartner, getShopOne, 
                getShopPartnerByAdmin, findShopMember, uploadPicture, tranfersCreditsToShop, tranfersShopToPartner, editExpress
                , editExpressAll ,pushExpress, statusContract, fixNameExpress, findShopDownLine, fixCredits}


