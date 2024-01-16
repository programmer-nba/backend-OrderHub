const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const partnerSchema = new Schema({
    firstname: {type:String, required: true},
    lastname:{type:String, require: true},
    username: {type:String, require: true},
    password: {type:String, require: true},
    tel: {type:String, require: true},
    email: {type:String, require: true},
    address: {type:String, require: true},
    iden_number: {type:String, require: true},
    picture_iden: {type:String, require: true},
    picture_two: {type:String, require: true},
    role: {type:String, default: "partner", require: true},
},{timestamps: true});

partnerSchema.pre('save',function(next){   //ทำ Middleware การ Hash ก่อน EmployeeScheme ที่ User กรอกมาจะ save
  const user = this
  bcrypt.hash(user.password, 10).then(hash => {
      user.password = hash
      next()
  }).catch(error =>{
      console.error(error)
  })
})

const Partner = mongoose.model("partner", partnerSchema);

 const Validate = (data)=>{
   const schema = Joi.object({
        firstname: Joi.string().required().label('กรุณากรอกชื่อจริง'),
        lastname: Joi.string().required().label('กรุณากรอกนามสกุล'),
        username: Joi.string().required().label('กรุณากรอกยูสเซอร์ไอดี'),
        password: Joi.string().required().label('กรุณากรอกพาสเวิร์ด'),
        tel: Joi.number().required().label('กรุณากรอกเบอร์โทร'),
        email: Joi.string(),
        address: Joi.string().required().label('กรุณากรอกที่อยู่'),
        iden_number: Joi.string().required().label('กรุณากรอกบัตรประชาชน'),
        picture_iden: Joi.string().required().label('รูปภาพบัตรประชาชน'),
        picture_two: Joi.string().label('รูปถ่ายคู่'),
        role: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {Partner, Validate};
