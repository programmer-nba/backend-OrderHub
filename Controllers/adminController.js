const { Admin, Validate } = require("../Models/admin");
const  { statusContract } = require("../Models/contractPopup")
const  { Partner } = require("../Models/partner")
const jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const { TopupWallet } = require("../Models/topUp/topupList");
const { historyWallet } = require("../Models/topUp/history_topup");
const { Blacklist } = require("../Models/blacklist");
const { shopPartner } = require("../Models/shop/shop_partner");
const { memberShop } = require("../Models/shop/member_shop");
const { historyWalletShop } = require("../Models/shop/shop_history");
const { priceBase } = require("../Models/Delivery/weight/priceBase.express");
const { weightAll } = require("../Models/Delivery/weight/weight.all.express");
const { priceWeight } = require("../Models/Delivery/weight/priceWeight");
const { codExpress } = require("../Models/COD/cod.model");
const { codPercent } = require("../Models/COD/cod.shop.model");
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// เพิ่มปลั๊กอินสำหรับ UTC และ timezone ใน dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

let dayjsTimestamp
let dayTime
function updateRealTime() {
    dayjsTimestamp = dayjs().tz('Asia/Bangkok');
    dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
    // console.log(dayTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 1 วินาที
setInterval(updateRealTime, 5000);

createAdmin = async (req, res) => {
  try {
    const {error} = Validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
    if (error)
          return res
                  .status(403)
                  .send({ status: false, message: error.details[0].message });

    const duplicateID = await Admin.findOne({ //ตรวจสอบ userID ของพนักงานว่ามีซ้ำกันหรือไม่
      username: req.body.username
    })
    if(duplicateID){
          return res
                  .status(401)
                  .send({ status: false, message: "มีผู้ใช้ User ID นี้แล้ว" });
    }
    const duplicatePartner = await Partner.findOne({ username: req.body.username})
    if(duplicatePartner){
          return res
                  .status(401)
                  .send({ status: false, message: "มีผู้ใช้ User ID นี้แล้ว" });
    }
    const duplicateMember = await memberShop.findOne({ username: req.body.username})
    if(duplicateMember){
          return res
                  .status(401)
                  .send({ status: false, message: "มีผู้ใช้ User ID นี้แล้ว" });
    }
    const adminCreate = await Admin.create(req.body); //เพิ่มพนักงานเข้าระบบ
    if (adminCreate) {
          return res
                  .status(201)
                  .send({ status: true, message: "เพิ่มรายชื่อ Admin เสร็จสิ้น" });
    }
  } catch (err) {
          console.log(err);
          return res
                  .status(500)
                  .send({ message: "มีบางอย่างผิดพลาด" });
  }
};

findAllAdmin = async (req, res)=>{
    try{
        const find = await Admin.find()
        if(find.length > 0){
            return res
                    .status(200)
                    .send({status:true, data:find})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีแอดมินในระบบ"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

updateAdmin = async (req, res)=>{
    try{
      const upID = req.params.id; //รับไอดีที่ต้องการอัพเดท
      if(!req.body.password){ //กรณีที่ไม่ได้ยิง password
        Admin.findByIdAndUpdate(upID,req.body, {new:true}).then((data) =>{
          if (!data) {
            return res
                    .status(400)
                    .send({status:false, message: "ไม่สามารถแก้ไขผู้ใช้งานนี้ได้"})
          }else {
            return res
                    .status(200)
                    .send({status:true, message: "อัพเดทข้อมูลแล้ว",data: data})
          }
        })
        .catch((err)=>{
          return res
                  .status(500)
                  .send({status: false, message: "มีบางอย่างผิดพลาด"})
      })
    } else { //กรณีที่ได้ยิง password
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        const updateAdmin = await Admin.findByIdAndUpdate(upID, {...req.body,password: hashPassword}, {new:true}); //หา id ที่ต้องการจากนั้นทำการอัพเดท
      if(updateAdmin){
        return res
                .status(200)
                .send({status: true, data: updateAdmin})
      } else {
        return res
                .status(400)
                .send({ status: false, message: "อัพเดทข้อมูลไม่สำเร็จ" });
      }
    }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({ status: false, message: "มีบางอย่างผิดพลาด" });
    }
}

delAdmin = async (req, res)=>{
    try{
        const id = req.params.id
        const del = await Admin.findByIdAndDelete(id)
        if(del){
            return res
                    .status(200)
                    .send({status:true, del: del})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีบัญชีแอดมินนี้อยู่ในระบบ"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

confirmContract = async (req,res)=>{
  try{
    const partnerId = req.params.id //รับ id มาจาก params
    const findId = await Partner.findOne({_id:partnerId}) //หาว่ามี partnerId ที่รับมาจาก params ตรงกับ field _id ของ partnerSchema ไหม
    if(findId){ //กรณีตรง    
        const fixStatus = await statusContract.findOneAndUpdate({partnerID:partnerId},{statusAdmin:"confirm"},{new:true})
        if(fixStatus){
          const fixStatusPartner = await Partner.findOneAndUpdate({_id:partnerId},{status_partner:"ได้รับการอนุมัติแล้ว"},{new:true})
          return res
                  .status(200)
                  .send({status: true, message: "แอดมินได้ทำการยืนยันแล้ว",fixStatus, fixStatusPartner})
        }else{
          return res
                  .status(400)
                  .send({status: false, message: "กรุณายืนยันสัญญาทั้ง 2 ฉบับ"})
        }
    }else{ //กรณีไม่ตรง
        return res
                .status(400)
                .send({status: false, message: "ไม่มี Partner ID ที่ท่านเรียก"})
    }
    
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
}

cancelContract = async (req, res)=>{
  try{
    id = req.params.id
    const cancel = await Partner.findOneAndUpdate(
      {_id:id},
      {status_partner:"blacklist"},
      {new:true})
    const black = await Blacklist.create({
      ...req.body,
      firstname: cancel.firstname,
      lastname: cancel.lastname,
      iden_number: cancel.iden_number,
      role: cancel.role
    })
    if(cancel){
      return res
              .status(200)
              .send({status:false, 
                message:"Partner ติด Blacklist แล้ว",
                data: cancel,
                blacklist: black})
    }else{
      return res
              .status(400)
              .send({status:false, message:"ไม่สามารถยกเลิกได้"})
    }
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
}

confirmTopup = async (req, res)=>{
  try{
    const nameAdmin = req.decoded.firstname
    const lastAdmin = req.decoded.lastname
    const invoiceSlip = req.params.id

    const findSlip = await TopupWallet.findOne({invoice:invoiceSlip})
    if(findSlip){
      const walletCredit = await shopPartner.findOne({shop_number:findSlip.shop_number}) 
      console.log(walletCredit.credit) //เช็คดู credit Wallet ของ shop นั้นว่าเหลือเท่าไหร่
      let result = await credit(findSlip.amount,walletCredit.credit) //นำคำตอบที่ได้จาก fucntion มาเก็บไว้ใน result แต่มันส่งมาเป็น type string 
      console.log(result)
      //อัพเดทส่วน admin และ status ใน Schema รายการเติมเงิน (topupList) เพื่อแสดงว่าแอดมินยืนยันแล้วและแอดมินคนไหนยืนยัน
      const replaceAdmin = await TopupWallet.findOneAndUpdate(
        {invoice:invoiceSlip},
        {
          "admin.name_admin": nameAdmin + " " + lastAdmin,
          status: "ยืนยันแล้ว"
        },
        { new: true })

          if(replaceAdmin){
            //อัพเดทส่วน Credits ใน Schema (shop_partner) เพื่อเอาไปแสดง
            const replaceCredit = await shopPartner.findOneAndUpdate(
              {shop_number:findSlip.shop_number},
              {credit:result},
              {new:true})
              
              //อัพเดท ประวัติเติมเงิน schema (history_topup) ในส่วน after เพื่อแสดงผลลัพธ์หลังแอดมินยืนยัน
              if(replaceCredit){
              const replaceHistory = await historyWallet.findOneAndUpdate(
                {orderid:invoiceSlip},
                { before:walletCredit.credit,
                  after:result},
                {new:true})

                  //อัพเดท ประวัติเติมเงิน schema (historyWallet_shop) ในส่วน after เพื่อแสดงผลลัพธ์หลังแอดมินยืนยัน
                  if(replaceHistory){
                    const replaceHistoryShop = await historyWalletShop.findOneAndUpdate(
                      {orderid:invoiceSlip},
                      { before:walletCredit.credit,
                        after:result},
                      {new:true})

                      return res 
                        .status(200)
                        .send({status:true, 
                        shop: replaceCredit,
                        topup: replaceAdmin,
                        historyTopup: replaceHistory,
                        historyShop: replaceHistoryShop
                        })
                  }
              }else{
                return res
                      .status(400)
                      .send({status:false,message:"ไม่สามารถแก้ไขประวัติการเติมเงินได้"})
              }
          }else{
              return res
                .status(400)
                .send({status:false, message:"ไม่สามารถแก้ไขส่วน Partner Credit ได้"})
          }
      }else{
        return res
                .status(400)
                .send({status:false, message:"ค้นหาหมายเลขธุรกรรมไม่เจอ"})
      }
  
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
}

cancelTopup = async (req, res)=>{
  try{
    const nameAdmin = req.decoded.firstname
    const lastAdmin = req.decoded.lastname
    const invoiceSlip = req.params.id

    const findSlip = await TopupWallet.findOne({invoice:invoiceSlip})
    if(findSlip){

      //อัพเดทส่วน admin และ status ใน Schema (topupList) เพื่อแสดงว่าแอดมินยืนยันแล้วและแอดมินคนไหนยืนยัน
      const replaceAdmin = await TopupWallet.findOneAndUpdate(
        {invoice:invoiceSlip},
        {
          "admin.name_admin": nameAdmin + " " + lastAdmin,
          status: "ไม่อนุมัติ"
        },
        { new: true })

            //อัพเดท ประวัติเติมเงิน schema (history_topup) ในส่วน after เพื่อแสดงผลลัพธ์หลังแอดมินยืนยัน
            if(replaceAdmin){
            const replaceHistory = await historyWallet.findOneAndUpdate(
              {orderid:invoiceSlip},
              { after:'แอดมินไม่อนุมัติ' },
              {new:true})

              return res 
                      .status(200)
                      .send({status:true, 
                      topup: replaceAdmin,
                      historyTopup: replaceHistory
                      })
            }else{
              return res
                    .status(400)
                    .send({status:false,message:"ไม่สามารถแก้ไขรายการเติมเงินได้"})
            }  
    }else{
        return res
                .status(400)
                .send({status:false, message:"ค้นหาหมายเลขธุรกรรมไม่เจอ"})
    }
  
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
}

cancelBlacklist = async (req, res)=>{
  try{
    const id = req.params.id
    const delBl = await Blacklist.findOne({iden_number:id})
    if(delBl){
      return res
              .status(200)
              .send({status:false, data: delBl})
    }else{
      return res
              .status(400)
              .send({status:false, message:"ค้นหาบัตรประชาชน Blacklist ไม่เจอ"})
    }
  }catch(err){
    console.log(err)
    return res
            .status(500)
            .send({status:false, })
  }
}

confirmShop = async (req, res)=>{
    try{
      const shopId = req.params.id
      const findShop = await shopPartner.findOneAndUpdate(
          {shop_number:shopId},
          {status:"อนุมัติแล้ว"},
          {new:true})
        if(!findShop){
          return res
                  .status(400)
                  .send({status:false,message:"ไม่สามารถแก้ไขได้"})
        }
      let shop_line = findShop.upline.shop_line
      let findLine
            while (shop_line != 'ICE') {
              findLine = await shopPartner.findOneAndUpdate(
                  {_id:shop_line},
                  {
                      $push: { "upline.shop_downline": findShop._id }
                  },{new:true})
                shop_line = findLine.upline.shop_line; // อัปเดตค่าของ findForCost สำหรับการวนลูปต่อไป
                      // console.log(shop_line)
            }
      const createBase = await priceBase.find()

        createBase.forEach(async (data) =>{
              let v = {
                    shop_id:findShop._id,
                    owner_id:findShop.partnerID,
                    head_line:findShop.upline.head_line,
                    shop_line:findShop.upline.shop_line,
                    express: data.express,
                    level:findShop.upline.level,
              }
              const baseWeight = data.weight.map(({ weightStart, weightEnd }) => ({ weightStart, weightEnd }));
              v.weight = baseWeight
              // console.log(v)
              const createWeight = await weightAll.create(v)
                // console.log(data.weight)
                    if(!createWeight){
                        console.log("ไม่สามารถสร้างน้ำหนักให้กับร้านค้าได้")
                    }
            })
      const codBase = await codExpress.find()
            if(codBase.length === 0){
              return res
                      .status(400)
                      .send({status:false, message:"ค้นหาข้อมูล cod base ไม่เจอ"})
            }
        let b = {
                  shop_id:findShop._id,
                  owner_id:findShop.partnerID,
                  head_line:findShop.upline.head_line,
                  shop_line:findShop.upline.shop_line,
                  level:findShop.upline.level,
                  express: codBase
            }
      const createCodShop = await codPercent.create(b)
            if(!createCodShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถสร้าง cod shop ได้"})
           }  

      const newData = {
            _id: findShop._id,
            shop_number: findShop.shop_number,
            shop_name: findShop.shop_name,
            address: findShop.address,
            street_address: findShop.street_address,
            sub_district: findShop.sub_district,
            district: findShop.district,
            province: findShop.province,
            postcode: findShop.postcode,
            status: findShop.status,
            shop_line: findShop.upline.shop_line,
            level:findShop.upline.level
        }
        if(findShop.upline.level == 1){
              const updatedPartner = await Partner.findByIdAndUpdate(
                  findShop.partnerID,
                  { $push: { shop_me: newData } },
                  { new: true }
                );      
                if(!updatedPartner){
                  return res
                          .status(400)
                          .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Partner ได้"})
                }
            let data = []
            const newDataMe = updatedPartner.shop_me[updatedPartner.shop_me.length - 1];
            let one = {
                my_id:updatedPartner._id,
                data:newDataMe
            }
            data.push(one)
            return res
                    .status(200)
                    .send({status:true, data:data})

        }else if(findShop.upline.level == 2){

            const updatedPartnerMe = await Partner.findByIdAndUpdate(
                    findShop.partnerID,
                    { $push: { shop_me: newData } },
                    { new: true }
                );    
                if(!updatedPartnerMe){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Downline partner ได้"})
                }

            const updatedPartnerUpline = await Partner.findByIdAndUpdate(
                    findShop.upline.head_line,
                    { $push: { shop_partner: newData } },
                    { new: true }
                );  
                if(!updatedPartnerUpline){
                  return res
                          .status(400)
                          .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Head partner ได้"})
                }

            let data = []
            const newDataDownline = updatedPartnerMe.shop_me[updatedPartnerMe.shop_me.length - 1];
                let one = {
                    downLine_id:updatedPartnerMe._id,
                    data:newDataDownline
                }
                data.push(one)
            const newDataUpline = updatedPartnerUpline.shop_partner[updatedPartnerUpline.shop_partner.length - 1];
                let two = {
                    upLine_id:updatedPartnerUpline._id,
                    data:newDataUpline
                }
                data.push(two)

            return res
                    .status(200)
                    .send({
                          status:true, 
                          data:data
                        })
        }else if(findShop.upline.level == 3){
            const updatedPartnerMe = await Partner.findByIdAndUpdate(
                    findShop.partnerID,
                    { $push: { shop_me: newData } },
                    { new: true }
                  );    
                  if(!updatedPartnerMe){
                      return res
                              .status(400)
                              .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Downline partner ได้"})
                  }

            const updatedPartnerUpline = await Partner.findByIdAndUpdate(
                    findShop.upline.head_line,
                    { $push: { shop_partner: newData } },
                    { new: true }
                  );  
                  if(!updatedPartnerUpline){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Upline partner ได้"})
                  }

            let head = updatedPartnerUpline.upline.head_line

            const updatePartnerHead = await Partner.findByIdAndUpdate(
                    head,
                    { $push: { shop_partner: newData } },
                    { new: true }
                  )
                  if(!updatePartnerHead){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทข้อมูล Head partner ได้"})
                  }

            const data = []
            const newDataDownline = updatedPartnerMe.shop_me[updatedPartnerMe.shop_me.length - 1]; //เลือกข้อมูลล่าสุดที่อัพเดทไปใน Array shop_me
                  let one = {
                        downLine_id:updatedPartnerMe._id,
                        data:newDataDownline
                  }
                  data.push(one)
            const newDataUpline = updatedPartnerUpline.shop_partner[updatedPartnerUpline.shop_partner.length - 1]; //เลือกข้อมูลล่าสุดที่อัพเดทไปใน Array shop_partner
                  let two = {
                        upLine_id:updatedPartnerUpline._id,
                        data:newDataUpline
                  }
                  data.push(two)
            const newDataHead = updatePartnerHead.shop_partner[updatePartnerHead.shop_partner.length - 1];
                  let three = {
                        head_id:updatePartnerHead._id,
                        data:newDataHead
                  }
                  data.push(three)

            return res
                    .status(200)
                    .send({
                          status:true, 
                          data:data
                        })
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

cancelShop = async (req, res)=>{
  try{
      const shopId = req.params.id
      const findShop = await shopPartner.findOneAndUpdate(
        {shop_number:shopId},
        {status:"ไม่อนุมัติ"},
        {new:true})
      if(findShop){
        return res
                .status(200)
                .send({status:true, status:findShop})
      }else{
        return res
                .status(400)
                .send({status:true, message:"ไม่สามารถแก้ไขได้"})
      }
  }catch(err){
      console.log(err)
      return res
              .status(500)
              .send({status:false, message:"มีบางอย่างผิดพลาด"})
  }
}

getMe = async (req, res)=>{
  try{
    const id = req.decoded.userid
    const findAdmin = await Admin.findOne({_id:id})
    if(!findAdmin){
      return res
              .status(404)
              .send({status:false, message:"ไม่สามารถค้นหาข้อมูลของท่านได้"})
    }
    return res
            .status(200)
            .send({status:true, data:findAdmin})
  }catch(err){
    console.log("มีบางอย่างผิดพลาด")
    return res
            .status(400)
            .send({status:false, message:err})
  }
}
async function credit(data, creditPartner){
  let Number = data + creditPartner;
  return Number
}

tranferCreditToPartner = async (req, res)=>{
   try {
       const id = req.params.id
       const { credit } = req.body
         if (!credit || isNaN(credit) || credit < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
             return res
                     .status(400)
                     .send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
         }else if (!/^(\d+(\.\d{1,2})?)$/.test(credit.toString())){ //เช็คทศนิยมไม่เกิน 2 ตำแหน่ง
             return res
                     .status(400)
                     .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
         }
       const findPartner = await Partner.findOne(
           {
               _id:id,
           },{ 
             credits: 1, firstname:1, lastname:1
           })
           if(!findPartner){
               return res
                       .status(404)
                       .send({status:false, message:"กรุณาระบุร้านค้าที่ท่านเป็นเจ้าของ"})
           }
       const creditToPartner = await invoiceCredit(dayTime)
       //เพิ่มเงิน Partner
       const tranferToPartner = await Partner.findOneAndUpdate(
           {_id:id},
           {
               $inc: { credits: +credit }
           },
           {new:true,  projection: { credits: 1, firstname:1, lastname:1 }})
           if(!tranferToPartner){
               return res
                       .status(400)
                       .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
           }
        const dataHistoryPartner = {
                     partnerID: tranferToPartner._id,
                     shop_number: "-",
                     orderid: creditToPartner,
                     firstname: tranferToPartner.firstname,
                     lastname: tranferToPartner.lastname,
                     amount: credit,
                     before: parseFloat(findPartner.credits.toFixed(2)),
                     after: "ADMIN SENT CREDIT",
                     money_now: parseFloat(tranferToPartner.credits.toFixed(2)),
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
               .send({status:true, data:tranferToPartner, history:historyPartner})
   } catch (err) {
       return res
               .status(500)
               .send({status:false, message:err.message})
   }
}

getPartnerCutCredit = async(req, res)=>{
  try{
    const id = req.params.id
    const findPartner = await Partner.findOne({_id:id})
      if(!findPartner){
        return res
                .status(404)
                .send({status:false, message:"ไม่สามารถค้นหาข้อมูลของ Partner ได้"})
      }
    let shop_id = findPartner.shop_me.map(doc => doc._id);
    console.log(shop_id)
    let data = []
    let v = {
        _id:findPartner._id,
        firstname: findPartner.firstname,
        lastname: findPartner.lastname,
        credits:findPartner.credits,
        role: "partner"
    }
    data.push(v)
    if(shop_id){
        const findShop = await shopPartner.find({_id:{$in:shop_id}})
        if(findShop.length > 0){
            for (const item of findShop) {
              v = {
                _id:item._id,
                credits:item.credit,
                shop_number:item.shop_number,
                shop_name: item.shop_name,
                role: "shop"
              }
              data.push(v)
            }
        }
    }
    return res
            .status(200)
            .send({status:true, data:data})
  }catch(err){
    console.log("มีบางอย่างผิดพลาด")
    return res
            .status(400)
            .send({status:false, message:err.message})
  }
}

cutCreditPartner = async(req, res)=>{
  try{
    const id_admin = req.decoded.userid
    const { _id, credit, role } = req.body
      if (!credit || isNaN(credit) || credit < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
        return res
                .status(400)
                .send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
      }else if (!/^(\d+(\.\d{1,2})?)$/.test(credit.toString())){ //เช็คทศนิยมไม่เกิน 2 ตำแหน่ง
          return res
                  .status(400)
                  .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
      }

    const creditToPartner = await invoiceCreditToAdmin(dayTime)
    let tranfer
    if(role == "partner"){
        tranfer = await Partner.findById(_id)
          if(!tranfer){
              return res
                      .status(404)
                      .send({status:false, data:"ไม่สามารถค้นหาข้อมูลของ Partner ได้"})
          }else if(tranfer.credits <= 0){
            return res
                      .status(400)
                      .send({status:false, message:"พาร์ทเนอร์ไม่มีเงินในระบบ"})
          }else if(tranfer.credits < credit){
              return res
                      .status(400)
                      .send({status:false, message:"กรุณาระบุจำนวนเงินไม่เกิน credits ที่พาร์ทเนอร์มี"})
          }

        const tranferToPartner = await Partner.findOneAndUpdate(
            {_id:_id},
            {
                $inc: { credits: -credit }
            },
            {new:true,  projection: { credits: 1, firstname: 1, lastname: 1 } })
            if(!tranferToPartner){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
            }
        const dataHistoryPartner = {
                      partnerID: tranferToPartner._id,
                      shop_number: "-",
                      orderid: creditToPartner,
                      firstname: tranferToPartner.firstname,
                      lastname: tranferToPartner.lastname,
                      amount: credit,
                      before: parseFloat(tranfer.credits.toFixed(2)),
                      after: "ADMIN CUT CREDIT",
                      money_now: parseFloat(tranferToPartner.credits.toFixed(2)),
                      type: "เงินออก",
                  }
        const historyPartner = await historyWallet.create(dataHistoryPartner)
                if(!historyPartner){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
                }

        const tranferToAdmin = await Admin.findOneAndUpdate(
            {_id:id_admin},
            {
                $inc: { wallet: +credit }
            },
            {new:true,  projection: { wallet: 1 }})
            if(!tranferToAdmin){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
            }
      return res
              .status(200)
              .send({status:false, credit:tranferToPartner, admin:tranferToAdmin, history:historyPartner})
    }else if(role == "shop"){
      tranfer = await shopPartner.findById(_id)
        if(!tranfer){
          return res
                  .status(404)
                  .send({status:false, data:"ไม่สามารถค้นหาข้อมูลของ Shop ได้"})
        }else if(tranfer.credit <= 0){
          return res
                    .status(400)
                    .send({status:false, message:"ร้านค้าไม่มีเงินในระบบ"})
        }else if(tranfer.credit < credit){
            return res
                    .status(400)
                    .send({status:false, message:"กรุณาระบุจำนวนเงินไม่เกิน credits ที่ร้านค้ามี"})
        }

      const tranferToPartner = await shopPartner.findOneAndUpdate(
          {_id:_id},
          {
              $inc: { credit: -credit }
          },
          {new:true,  projection: { _id:1, credit: 1, firstname: 1, lastname: 1, shop_number: 1, shop_name: 1 } })
          if(!tranferToPartner){
              return res
                      .status(400)
                      .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
          }

      const dataHistoryPartner = {
                    partnerID: tranferToPartner.partnerID,
                    shop_number: tranferToPartner.shop_number,
                    orderid: creditToPartner,
                    firstname: tranferToPartner.firstname,
                    lastname: tranferToPartner.lastname,
                    amount: credit,
                    before: parseFloat(tranfer.credit.toFixed(2)),
                    after: "ADMIN CUT CREDIT SHOP",
                    money_now: parseFloat(tranferToPartner.credit.toFixed(2)),
                    type: "เงินออก",
                }
      const historyPartner = await historyWallet.create(dataHistoryPartner)
              if(!historyPartner){
                  return res
                          .status(400)
                          .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
              }

      const tranferToAdmin = await Admin.findOneAndUpdate(
          {_id:id_admin},
          {
              $inc: { wallet: +credit }
          },
          {new:true,  projection: { wallet: 1 }})
          if(!tranferToAdmin){
              return res
                      .status(400)
                      .send({status:false, message:"ไม่สามารถเพิ่มเงิน partner ได้"})
          }
    return res
            .status(200)
            .send({status:false, credit:tranferToPartner, admin:tranferToAdmin, history:historyPartner})
    }
  }catch(err){
    return res
            .status(500)
            .send({status:false, data:err.message})
  }
}

getHistoryRentCredits = async(req, res)=>{
  try{
      const partner_id = req.body.partner_id
      const day_start = req.body.day_start
      const day_end = req.body.day_end
      const status = req.body.status
      let find
      if(!day_start && !day_end){
        if(partner_id){
          if(status){
            find = await historyWallet.find({partnerID:partner_id, after:status})
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(0)"})
              }
          }else{
            find = await historyWallet.find({
              partnerID:partner_id,
              after:{$regex:"ADMIN"}
            })
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(1)"})
              }
          }
        }else if(status){ 
            find = await historyWallet.find({after:status})
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(2)"})
              }
        }
      }else if(day_start && day_end){
        if(partner_id){
          if(status){
            find = await historyWallet.find({
              partnerID:partner_id, 
              after:status, 
              day:{
                $gte:day_start, 
                $lte:day_end
              }
            })
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(3)"})
              }
          }else{
            find = await historyWallet.find({
              partnerID:partner_id,
              after:{$regex:"ADMIN"},
              day:{
                $gte:day_start, 
                $lte:day_end
              }
            })
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(4)"})
              }
          }
        }else if(status){
            find = await historyWallet.find({
              after:status, 
              day:{
                $gte:day_start, 
                $lte:day_end
              }
            })
              if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล(5)"})
              }
        }else{
          find = await historyWallet.find({
            after:{
              $regex:"ADMIN"
            },
            day:{
              $gte:day_start, 
              $lte:day_end
            }
          })
            if(find.length == 0){
              return res
                      .status(404)
                      .send({status:false, message:"ไม่พบข้อมูล(6)"})
            }
        }
      }
    return res
            .status(200)
            .send({status:true, data:find})
  }catch(err){
    console.log(err)
    return res
            .status(500)
            .send({status:false, message:err.message})
  }
}

async function invoiceCredit(date) {
  let data = `ATP`
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

async function invoiceCreditToAdmin(date) {
  let data = `PTA`
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

module.exports = { createAdmin, confirmContract, 
  cancelContract, confirmTopup, confirmShop,
  cancelShop, cancelTopup, findAllAdmin,
  updateAdmin, delAdmin, getMe, tranferCreditToPartner, 
  getPartnerCutCredit, cutCreditPartner, getHistoryRentCredits }
