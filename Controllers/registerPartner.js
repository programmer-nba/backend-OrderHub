const { Partner, Validate } = require("../Models/partner");
const jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const qs = require('qs');
const { google } = require("googleapis");
const { uploadFileCreate, deleteFile } = require("../functions/uploadfilecreate");
const { Blacklist } = require("../Models/blacklist");
const { Admin } = require("../Models/admin");
const { memberShop } = require("../Models/shop/member_shop");
const { costPlus } = require("../Models/costPlus");
const { PercentCourier } = require("../Models/Delivery/ship_pop/percent");
const mongoose = require('mongoose');
const FormData = require('form-data');
const axios = require('axios');
const { logSystem } = require("../Models/logs");
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

      const duplicate = await Partner.findOne({ //ตรวจสอบบัตรประชาชนและ username ของพนักงานว่ามีซ้ำกันหรือไม่
          $or: [
            { iden_number: req.body.iden_number },
            { username: req.body.username }
          ]});
          if (duplicate){
            if (duplicate.iden_number === req.body.iden_number) {
              // ถ้าพบว่า iden_number ซ้ำ
              return res
                      .status(200)
                      .json({status:false, message: 'มีผู้ใช้บัตรประชาชนนี้ในระบบแล้ว'});
            } else if (duplicate.username === req.body.username) {
              // ถ้าพบว่า userid ซ้ำ
              return res
                      .status(200)
                      .json({status:false, message: 'มีผู้ใช้ยูสเซอร์ไอดีนี้ในระบบแล้ว'});
            }
          }

      const findAdmin = await Admin.findOne({ //ตรวจสอบ userID ของพนักงานว่ามีซ้ำกันหรือไม่
        username: req.body.username
      })
          if(findAdmin){
              return res
                      .status(401)
                      .send({ status: false,message: "มีผู้ใช้ User ID นี้แล้ว" });
            }
      const findMemberShop = await memberShop.findOne({ //ตรวจสอบ userID ของพนักงาน shop ว่ามีซ้ำกันหรือไม่
        username: req.body.username
      })
          if(findMemberShop){
              return res
                      .status(401)
                      .send({ status: false, message: "มีผู้ใช้ User ID นี้แล้ว" });
          }
      
      const employee = await Partner.create(
        {
            ...req.body
        }); //เพิ่มพนักงานเข้าระบบ
          if(!employee){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเพิ่มพาร์ทเนอร์ได้"})
          }
      return res
              .status(200)
              .send({ status: true, message: "เพิ่มพาร์ทเนอร์เสร็จสิ้น",data: employee });

      // //ได้รับรหัสแนะนำ partner คนอื่นไม่ใช่คุณไอซ์
      // //เช็ครหัสพาร์ทเนอร์ก่อนว่ามีตัวตนอยู่จริงไหม และ เช็คว่ารหัสพาร์ทเนอร์ที่ได้รับมี upline ที่ไม่ใช่คุณไอซ์อยู่แล้วหรือเปล่าถ้าใช่ ให้ res "รหัสพาร์ทเนอร์นี้ไม่สามารถแนะนำต่อได้"(รหัสพาร์ทเนอร์ที่ได้รับต้นทุนมาจากคุณไอซ์สามารถแนะนำได้แค่ 1 คนเท่านั้น)
      // const findPartner = await Partner.findOne({partnerNumber:req.body.upline_number})
      //     if(!findPartner){
      //         return res
      //                 .status(400)
      //                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลขพาร์ทเนอร์เจอ"})
      //     }else if (findPartner.upline.upline_number !== 'ICE'){
      //         return res
      //                 .status(200)
      //                 .send({status:false, message:"รหัสพาร์ทเนอร์นี้ไม่สามารถแนะนำต่อได้"})
      //     }
          
      // //หลังจากเช็คว่าเป็น Partner_number == 'ICE' แล้ว(แสดงว่าสมัครกับคุณไอซ์โดยตรง) จากนั้นนำ upline_number ไปเช็คใน costPlus เพื่อตรวจว่ารหัสนี้มีมีการแนะนำไปแล้วหรือเปล่าถ้าใช่ให้ res "รหัสพาร์ทเนอร์นี้มีผู้ใช้ไปแล้ว"
      // const findCost = await costPlus.findOne({partner_number: req.body.upline_number})
      //     if(!findCost){
      //         return res
      //                 .status(400)
      //                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลขพาร์ทเนอร์เจอ"})
      //     }else if (findCost.cost_level.length === 0){
      //         // สร้างข้อมูลที่ต้อง push เข้าไป

      //         const employee = await Partner.create( //เพิ่มพนักงานเข้าระบบ
      //           {
      //             ...req.body,
      //             "upline.head_line":findCost._id,
      //             "upline.upline_number":req.body.upline_number
      //           }
      //         );

      //         // สร้างข้อมูลที่ต้อง push เข้าไป
      //         const newData = {
      //           level: 1,
      //           cost_plus: "",
      //           partner_number: "",
      //           firstname: employee.firstname,
      //           lastname: employee.lastname
      //         };

      //         // กำหนด partner_number ใน newData เพื่อเป็นค่าที่ได้จากการสร้างพนักงาน
      //         newData.partner_number = employee.partnerNumber;
      //         // Push ข้อมูลใหม่เข้าไปใน cost_level
      //         const pushData = await costPlus.findOneAndUpdate(
      //             {partner_number: req.body.upline_number},
      //             {
      //               $push:{ cost_level: newData }
      //             },{new:true}
      //           )
      //         return res
      //                 .status(200)
      //                 .send({ status: true, message: "เพิ่มรายชื่อพนักงานเสร็จสิ้น",data: employee, cost: pushData });

      //     }else if (findCost.cost_level.length > 0){
      //         return res
      //                 .status(400)
      //                 .send({status: false, message:"รหัสพาร์ทเนอร์นี้มีผู้ใช้ไปแล้ว"})
      //     }
  } catch (err) {
      console.log(err);
      return res
              .status(500)
              .send({ message: "มีบางอย่างผิดพลาด" });
  }
}

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
        const role = req.decoded.role
        let findId
        if(role == 'admin'){
          findId = await Admin.findById(getid)
            if(!findId){
              return res
                      .status(404)
                      .send({status:false, message:"ไม่สามารถ Get me (Admin) ได้"})
            }
        }else if(role == 'partner'){
          findId = await Partner.findById(getid)
            if(!findId){
              return res
                      .status(404)
                      .send({status:false, message:"ไม่สามารถ Get me (Partner) ได้"})
            }
        }else if(role == 'shop_member'){
          findId = await memberShop.findById(getid)
            if(!findId){
              return res
                      .status(404)
                      .send({status:false, message:"ไม่สามารถ Get me (Shop_member) ได้"})
            }
        }else{
          return res
                  .status(404)
                  .send({status:false, message:"ไม่พบท่านในระบบ"})
        }
        return res
                .status(200)
                .send({status:true, data:findId})
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
          const updatePartner = await Partner.findByIdAndUpdate(
            upID, 
            {
              ...req.body,
              password: hashPassword
            }, {new:true}); //หา id ที่ต้องการจากนั้นทำการอัพเดท
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

approveMemberShop = async (req, res)=>{
    try{
        const memberNumber = req.params.id
        const findMember = await memberShop.findOneAndUpdate(
          {member_number:memberNumber},
          {status:"อนุมัติแล้ว"},
          {new:true})
        if(findMember){
          return res
                  .status(200)
                  .send({status:true, data:findMember})
        }else{
          return res
                  .status(400)
                  .send({status:false, message:"ไม่สามารถค้นหาหมายเลขพนักงานได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

cancelMemberShop = async (req, res)=>{
  try{
      const memberNumber = req.params.id
      const findMember = await memberShop.findOneAndUpdate(
        {member_number:memberNumber},
        {status:"ไม่อนุมัติ"},
        {new:true})
      if(findMember){
        return res
                .status(200)
                .send({status:true, data:findMember})
      }else{
        return res
                .status(400)
                .send({status:false, message:"ไม่สามารถค้นหาหมายเลขพนักงานได้"})
      }
  }catch(err){
      console.log(err)
      return res
              .status(500)
              .send({status:false, message:"มีบางอย่างผิดพลาด"})
  }
}

getByID = async (req,res)=>{//การทำ GET ME โดยใช้การ decoded จาก token
  try{
      const getid = req.params.id
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

// opt
sendotp = async (req, res) => {
  try {
    const id = req.params.id;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).send({ status: false, message: "ไม่มีข้อมูล" });
    }
    const data = new FormData();
    data.append('phone', partner?.tel);
    data.append('digit', '6');
    data.append('message', 'รหัส otp ของคุณ คือ {otp} (ref {ref_no}) กรุณากรอกรหัสภายใน 5 นาที');
    data.append('from', 'Order  Hub');

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${process.env.SMS_URL}/api/otp/request`,
      headers: { 
        'token': process.env.SMS_API_TOKEN, 
        ...data.getHeaders()
      },
      data : data
    };
    // ให้ใช้ await เพื่อรอให้ axios ทำงานเสร็จก่อนที่จะดำเนินการต่อ
    const result = await axios(config);
    let resultData = {
      code: result.data.code,
      data: {
          ref_no: result.data.data.ref_no,
          phone: partner.tel
      },
      message: result.data.message
    }
    console.log(result.data);
    if (result.code === "200") {
      return res.status(200).send({ status: true, result: resultData });
    } else {
      return res.status(200).send({ status: false, result: resultData});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, error: error.message });
  }
};

check = async (req, res) => {
  try {
    const role = req.decoded.role
    const id = req.params.id;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).send({ status: false, message: "ไม่มีข้อมูล" });
    }
    const ref_no = req.body.ref_no
    const otp = req.body.otp
    const phone = req.body.phone
    const ip_address = req.body.ip_address
    const type = req.body.type
    const discription = req.body.discription
    const latitude = req.body.latitude
    const longtitude = req.body.longtitude
    
    let data = JSON.stringify({
      'ref_no': ref_no,
      'otp': otp,
      'phone': phone 
    })

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${process.env.SMS_URL}/api/otp/verify`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data
    };
    await axios(config).then(async (response) => {
      if(response.data.data.validate == false){
        return res
                .status(400)
                .send({status:false, message:"รหัส OTP ไม่ถูกต้อง/หมดอายุ"})
      }
      let formData = {
          ip_address: ip_address,
          id: id,
          role: role,
          ref_no: ref_no,
          otp: otp,
          phone: phone,
          type: type,
          description: discription,
          latitude: latitude,
          longtitude: longtitude
      }
      const create = await logSystem.create(formData)
        if(!create){
          return res
                  .status(400)
                  .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
        }
      return res  
              .status(200)
              .send({status:true, data:response.data, create:create})
    })
    .catch((error) => {
      return res  
              .status(200)
              .send({status:false, message:error.message})
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};

changePassword = async(req, res)=>{
  try{
    const id = req.params.id
    const old_password = req.body.old_password
    const new_password = req.body.new_password
    const new_password_confirm = req.body.new_password_confirm

    const checkOldPassword = await Partner.findById(id)
    let cmp = await bcrypt.compare(old_password, checkOldPassword.password)
      if(!cmp){
        return res
                .status(400)
                .send({status:false, message:"รหัสผ่านเดิมของท่านไม่ถูกต้อง"})
      }

      // ตรวจสอบว่ารหัสผ่านใหม่มีแค่ตัวอักษรภาษาอังกฤษและตัวเลข
      const regex = /^[A-Za-z0-9]+$/;
      if (!regex.test(new_password)) {
          return res.status(400).send({ status: false, message: "รหัสผ่านใหม่ต้องมีแค่ตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น" });
      }

      if (new_password !== new_password_confirm){
        return res
                .status(400)
                .send({status:false, message:"รหัสผ่านใหม่ไม่ตรงกัน"})
      }

    // ตรวจสอบว่ารหัสผ่านใหม่ไม่ตรงกับรหัสผ่านเดิม
    let cmp_new_password = await bcrypt.compare(new_password, checkOldPassword.password)
      if(cmp_new_password){
        return res
                .status(400)
                .send({status:false, data:"รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม"})
      }

    return res
            .status(200)
            .send({status:true, new_password:new_password_confirm})
  }catch(err){
    return res
            .status(500)
            .send({status:false, message:err})
  }
}

checkLevel = async(req, res)=>{
  try{
    const partner_id = req.body.partner_id
    const partner = await Partner.findById(partner_id,{shop_me:1, shop_partner:1}).exec()
      if(!partner){
        return res
                .status(404)
                .send({status:false, message:"ไม่มีพาร์ทเนอร์ในระบบ"})
      }
    console.log(partner.shop_me)
    let data = []
    for( const level of partner.shop_me ){
        let sheet = {
            level_1:{
              ...level._doc,
            },
        }
        const findLevelTwo = partner.shop_partner.filter(item => item.shop_line == level._id.toString())
          if(findLevelTwo.length != 0){
            let dataTwo = []
            for( const dataLevelTwo of findLevelTwo){
                const findThree = partner.shop_partner.filter(item => item.shop_line == dataLevelTwo._id.toString())
                  if(findThree.length == 0){
                      let twoObject = {
                          ...dataLevelTwo._doc,
                          level_3:[]
                      }
                      dataTwo.push(twoObject)
                      continue;
                  }
                let twoObject = {
                    ...dataLevelTwo._doc,
                    level_3:findThree
                }
                dataTwo.push(twoObject)
            }
            sheet.level_1.level_2 = dataTwo
          }
        data.push(sheet)
    }
    return res
            .status(200)
            .send({status:true, data:data})
  }catch(err){
    return res  
            .status(500)
            .send({status:false, message:err.message})
  }
}

module.exports = { createPartner, 
getAllPartner, getPartnerByID, 
upPartnerByID, deleteById,
uploadPicture, approveMemberShop,
cancelMemberShop, getByID, sendotp, check,
changePassword, checkLevel };
