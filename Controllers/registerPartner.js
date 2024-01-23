const { Partner, Validate } = require("../Models/partner");
const jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const { google } = require("googleapis");
const { uploadFileCreate, deleteFile } = require("../functions/uploadfilecreate");
const { Blacklist } = require("../Models/blacklist");
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-");
  },
});


createPartner = async (req, res) => {
  try {
    const {error} = Validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
    if (error)
      return res
        .status(403)
        .send({ status: false, message: error.details[0].message });
    const blacklist = await Blacklist.findOne({
      iden_number: req.body.iden_number
    })
    if (blacklist){
      return res
              .status(401)
              .send({status: false, message:"หมายเลขบัตรประชาชนนี้ติด Blacklist"})
    }
    const duplicate = await Partner.findOne({ //ตรวจสอบบัตรประชาชนพนักงานว่ามีซ้ำกันหรือไม่
      iden_number: req.body.iden_number
    });
    if (duplicate){
      return res
        .status(401)
        .send({ status: false,
          message: "มีเลขบัตรประชาชนนี้แล้ว" });
    }
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
        .send({ status: true, message: "เพิ่มรายชื่อพนักงานเสร็จสิ้น",data: employee });
    }
  } catch (err) {
      console.log(err);
      return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};

getAllPartner = async (req,res)=>{
    try{
        const getAll = await Partner.find()
        if(getAll){
            return res
                    .status(200)
                    .send({status:true, Data: getAll})
        }else{
            return res
                    .status(400)
                    .send({ status: false, message: "ดึงข้อมูลไม่สำเร็จ"})
        }
    }catch(err) {
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

getPartnerByID = async (req,res)=>{//การทำ GET ME โดยใช้การ decoded จาก token
    try{
        const getid = req.decoded.userid
        console.log(getid)
        const findId = await Partner.findById(getid)
        if(findId){
            return res 
                    .status(200)
                    .send({ status: true, data: findId})
        }else{
            return res
                    .status(400)
                    .send({ status: false, message: "ดึงข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

getPartnerByStatus = async (req,res)=>{
  try{
    const status = await Partner.find({contractOne:"true",contractTwo:"true"})
    if(status){
      return res
              .status(200)
              .send({status:true, data: status})
    }else{
      return res
              .status(400)
              .send({status:false, message:"ดึงข้อมูลไม่สำเร็จ"})
    }
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
}

upPartnerByID = async (req,res)=>{
    try{
        const upID = req.params.id; //รับไอดีที่ต้องการอัพเดท
        console.log(req.body);
        if(!req.body.password){ //กรณีที่ไม่ได้ยิง password
          Partner.findByIdAndUpdate(upID,req.body, {new:true}).then((data) =>{
            if (!data) {
              res
                .status(400)
                .send({status:false, message: "ไม่สามารถแก้ไขผู้ใช้งานนี้ได้"})
            }else {
              res
                .status(200)
                .send({status:true, message: "อัพเดทข้อมูลแล้ว",data: data})
            }
          })
          .catch((err)=>{
            res
              .status(500)
              .send({status: false, message: "มีบางอย่างผิดพลาด"})
        })
      } else { //กรณีที่ได้ยิง password
          const salt = await bcrypt.genSalt(Number(process.env.SALT));
          const hashPassword = await bcrypt.hash(req.body.password, salt);
          const updatePartner = await Partner.findByIdAndUpdate(upID, {...req.body,password: hashPassword}, {new:true}); //หา id ที่ต้องการจากนั้นทำการอัพเดท
        if(updatePartner){
          return res
            .status(200)
            .send({status: true, data: updatePartner})
        } else {
          return res
            .status(400)
            .send({ status: false, message: " อัพเดทข้อมูลไม่สำเร็จ" });
        }
      }
    } catch(err) {
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

deleteById = async (req,res)=>{
    try{
        const del = req.params.id
        const delPartner = await Partner.findByIdAndDelete({_id:del})
        if(delPartner){
            return res 
                .status(200)
                .send({status:true, Delete: delPartner})
        }else {
            return res
                .status(400)
                .send({ status: false, message: "ไม่พบบุคคลที่ท่านต้องการลบ"})
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

uploadPicture = async (req,res)=>{
  try {
    let upload = multer({ storage: storage })
    const fields = [
      {name: 'pictureIden', maxCount: 1},
      {name: 'pictureTwo', maxCount: 1}
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
      const member = await Partner.findByIdAndUpdate(id, {
          "picture.picture_iden": result[0],
          "picture.picture_two": result[1]
        });
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
module.exports = { createPartner, 
getAllPartner, getPartnerByID, 
upPartnerByID, deleteById,
uploadPicture };