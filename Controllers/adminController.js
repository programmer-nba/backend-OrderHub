const { Admin, Validate } = require("../Models/admin");
const  { statusContract } = require("../Models/contractPopup")
const  { Partner } = require("../Models/partner")
const jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");

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

module.exports = { createAdmin, confirmContract };