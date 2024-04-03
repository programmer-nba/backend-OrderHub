const { PercentCourier } = require("../../Models/Delivery/ship_pop/percent");
const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { historyWalletShop } = require("../../Models/shop/shop_history");
const { shopPartner, validate } = require("../../Models/shop/shop_partner");
const { historyWallet } = require("../../Models/topUp/history_topup");
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
                address: req.body.partner_address,
                street_address: req.body.partner_street_address,
                sub_district: req.body.partner_sub_district,
                district: req.body.partner_district,
                province: req.body.partner_province,
                postcode: req.body.partner_postcode
            }
        )
            if(!createPartner){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างพาร์ทเนอร์ได้"})
            }
        const createShop = await shopPartner.create(
                {
                    ...req.body,
                    "tax.taxName":req.body.taxName,
                    "tax.taxNumber":req.body.taxNumber,
                    "commercial.commercialName":req.body.commercialName,
                    "commercial.commercialNumber":req.body.commercialNumber,
                    partnerID:id,
                    partner_number:findId.partnerNumber,
                    firstname:findId.firstname,
                    lastname:findId.lastname
            })
            return res
                    .status(200)
                    .send({status:true, data:createShop})
        
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
                shop_partner:{
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

            const findPartner = await Partner.findOne(
                {
                    _id:partner_id,
                    shop_partner:{
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
            const ShopToPartner = await invoiceSTP()
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
        const {id_express, costBangkok_metropolitan, costUpcountry, salesBangkok_metropolitan, salesUpcountry, on_off} = req.body
        console.log(req.body)
        const findShop = await shopPartner.findByIdAndUpdate(
            id_shop,
            { 
                $set: { 
                    "express.$[element].costBangkok_metropolitan": costBangkok_metropolitan,
                    "express.$[element].costUpcountry": costUpcountry,
                    "express.$[element].salesBangkok_metropolitan": salesBangkok_metropolitan,
                    "express.$[element].salesUpcountry": salesUpcountry,
                    "express.$[element].on_off": on_off
                } 
            },
            {
                new: true, 
                arrayFilters: [{ "element._id": id_express }],
            })
            // console.log(findShop)
            if(!findShop){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านได้"})
            }
        const filteredResult = findShop.express.find(element => element._id.toString() == id_express.toString());
        return res.status(200).send({
                status: true,
                message: "อัพเดตข้อมูลร้านสำเร็จ",
                data: filteredResult
            });
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

editExpressAll = async (req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const on_off = req.body.on_off
            if (on_off !== true && on_off !== false) {
                return res
                        .status(200)
                        .send({status:false, message:"ท่านต้องกรอก true or false เท่านั้น"})
            } 
        const updateExpress = await shopPartner.updateMany(
            {
                _id:id_shop
            }, 
            { 
                $set: { 
                    "express.$[].on_off": on_off
                }
            },
            {new:true})
            if(!updateExpress){
                return res 
                        .status(400)
                        .send({status:false, message:"ไม่สามารถแก้ไขได้"})
            }
        return res
                .status(200)
                .send({status:true,message:"แก้ไขสถานะสำเร็จ", data: updateExpress})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

pushExpress = async (req, res)=>{
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

async function invoicePTS() {
    let data = `PTS`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

async function invoiceSTP() {
    let data = `STP`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}
module.exports = {create, updateShop, delend, getAll, getShopPartner, getShopOne, 
                getShopPartnerByAdmin, findShopMember, uploadPicture, tranfersCreditsToShop, tranfersShopToPartner, editExpress
                , editExpressAll ,pushExpress, statusContract}

