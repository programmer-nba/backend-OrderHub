const { Admin, Validate } = require("../Models/admin");
const  { statusContract } = require("../Models/contractPopup")
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

/*confirmContract = async (req,res)=>{
  try{
    const updateStatus = await PreOrderProducts.findOne({_id: id});
    console.log(updateStatus);
  }catch(err){

  }
}*/

module.exports = { createAdmin };