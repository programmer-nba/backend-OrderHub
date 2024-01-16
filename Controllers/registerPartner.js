const { Partner, Validate } = require("../Models/partner");
const jwt = require("jsonwebtoken");

createPartner = async (req, res) => {
  try {
    const {error} = Validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
    if (error)
      return res
        .status(403)
        .send({ status: false, message: error.details[0].message });

    const duplicate = await Partner.findOne({ //ตรวจสอบบัตรประชาชนพนักงานว่ามีซ้ำกันหรือไม่
      iden_number: req.body.iden_number
    });
    if (duplicate)
      return res
        .status(401)
        .send({ status: false,
          message: "มีเลขบัตรประชาชนนี้แล้ว" });

    const duplicateID = await Partner.findOne({ //ตรวจสอบ userID ของพนักงานว่ามีซ้ำกันหรือไม่
      username: req.body.username
    })
    if(duplicateID){
      return res
        .status(401)
        .send({ status: false,
          message: "มีผู้ใช้ User ID นี้แล้ว" });
    }

    const employee = await Partner.create(req.body); //เพิ่มพนักงานเข้าระบบ
    if (employee) {
      return res
        .status(201)
        .send({ status: true, message: "เพิ่มรายชื่อพนักงานเสร็จสิ้น" });
    }
  } catch (err) {
      console.log(err);
      return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};

module.exports = { createPartner };