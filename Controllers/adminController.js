const { Admin, Validate } = require("../Models/admin");
const  { statusContract } = require("../Models/contractPopup")
const  { Partner } = require("../Models/partner")
const jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const { TopupWallet } = require("../Models/topUp/topupList");
const { historyWallet } = require("../Models/topUp/history_topup");
const { Blacklist } = require("../Models/blacklist");
const { shopPartner } = require("../Models/shop/shop_partner");

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
        .send({ status: false,
          message: "มีผู้ใช้ User ID นี้แล้ว" });
    }

    const adminCreate = await Admin.create(req.body); //เพิ่มพนักงานเข้าระบบ
    if (adminCreate) {
      return res
        .status(201)
        .send({ status: true, message: "เพิ่มรายชื่อ Admin เสร็จสิ้น" });
    }
  } catch (err) {
      console.log(err);
      return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};

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
                  .send({status: false, message: "ไม่สามารถยืนยันได้"})
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
      const walletCredit = await Partner.findOne({_id:findSlip.partnerID}) 
      console.log(walletCredit.credit) //เช็คดู credit Wallet ของ partner คนนั้นว่าเหลือเท่าไหร่
      let result = await credit(findSlip.amount,walletCredit.credit) //นำคำตอบที่ได้จาก fucntion มาเก็บไว้ใน result แต่มันส่งมาเป็น type string 
      console.log(result)
      //อัพเดทส่วน admin และ status ใน Schema (topupList) เพื่อแสดงว่าแอดมินยืนยันแล้วและแอดมินคนไหนยืนยัน
      const replaceAdmin = await TopupWallet.findOneAndUpdate(
        {invoice:invoiceSlip},
        {
          "admin.name_admin": nameAdmin + " " + lastAdmin,
          status: "ยืนยันแล้ว"
        },
        { new: true })

          if(replaceAdmin){
            //อัพเดทส่วน Credits ใน Schema (partner) เพื่อเอาไปแสดง
            const replaceCredit = await Partner.findOneAndUpdate(
              {_id:findSlip.partnerID},
              {credit:result},
              {new:true})
              
              //อัพเดท ประวัติเติมเงิน schema (history_topup) ในส่วน after เพื่อแสดงผลลัพธ์หลังแอดมินยืนยัน
              if(replaceCredit){
              const replaceHistory = await historyWallet.findOneAndUpdate(
                {orderid:invoiceSlip},
                { before:walletCredit.credit,
                  after:result},
                {new:true})

                return res 
                        .status(200)
                        .send({status:true, 
                        partner: replaceCredit,
                        topup: replaceAdmin,
                        historyTopup: replaceHistory
                        })
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
        if(findShop){
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
              status: findShop.status
          }
          const updatedPartner = await Partner.findByIdAndUpdate(
              findShop.partnerID,
              { $push: { shop_partner: newData } },
              { new: true }
          );      
          return res
                  .status(200)
                  .send({status:true, status:findShop, data:updatedPartner})
      }else{
          return res
                  .status(400)
                  .send({status:false, message:"ไม่สามารถหา shop ได้"})
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

async function credit(data, creditPartner){
  let Number = data + creditPartner;
  return Number
}
module.exports = { createAdmin, confirmContract, 
  cancelContract, confirmTopup, confirmShop,
  cancelShop, cancelTopup };