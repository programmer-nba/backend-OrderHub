const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const partnerSchema = new Schema({
    antecedent: {type:String, required: true},
    firstname: {type:String, required: true},
    lastname:{type:String, require: true},
    username: {type:String, require: true},
    password: {type:String, require: true},
    iden_number: {type:String, require: true},
    tel: {type:String, require: true},
    email: {type:String, require: true},
    address: {type:String, require: true},
    street_address: {type:String, require: true},
    sub_district: {type:String, require: true},
    district: {type:String, require: true},
    province: {type:String, require: true},
    postcode: {type:String, require: true},
    picture: {
      picture_iden: {type:String, default: "none", require: false},
      picture_two: {type:String, default: "none", require: false},
    },
    shop_partner:[
      { 
        shop_number: {type:Number, require: false},
        shop_name: {type:String, require: false},
        address:  {type:String, require: false},
        street_address: {type:String, require: false},
        sub_district:  {type:String, require: false},
        district:  {type:String, require: false},
        province:  {type:String, require: false},
        postcode:  {type:String, require: false}
      }
    ],
    credit:{type:Number,default: 0, require: true},
    role: {type:String, default: "partner", require: true},
    status_partner: {type:String, default: "newpartner", require: true},
    contractOne: {type:String, default: "false", require: true}, // สถานะสัญญาที่ 1
    contractTwo: {type:String, default: "false", require: true}, //สถานะสัญญาที่ 2 
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
        antecedent: Joi.string().required().label('กรุณาใส่คำนำหน้าชื่อ'),
        firstname: Joi.string().required().label('กรุณากรอกชื่อจริง'),
        lastname: Joi.string().required().label('กรุณากรอกนามสกุล'),
        username: Joi.string().required().label('กรุณากรอกยูสเซอร์ไอดี'),
        password: Joi.string().required().label('กรุณากรอกพาสเวิร์ด'),
        iden_number: Joi.string().required().label('กรุณากรอกบัตรประชาชน'),
        tel: Joi.number().required().label('กรุณากรอกเบอร์โทร'),
        email: Joi.string(),
        address: Joi.string().required().label('กรุณากรอกที่อยู่'),
        street_address: Joi.string(),
        sub_district: Joi.string().required().label('กรุณากรอกตำบล'),
        district: Joi.string().required().label('กรุณากรอกอำเภอ'),
        province: Joi.string().required().label('กรุณากรอกจังหวัด'),
        postcode: Joi.string().required().label('กรุณากรอกรหัสไปรษณีย์'),
        picture: {
          picture_iden: Joi.string(),
          picture_two: Joi.string(),
        },
        shop_partner: Joi.array().items(Joi.object({
          shop_number: Joi.number().optional(),
          shop_name: Joi.string().optional(),
          address: Joi.string().optional(),
          street_address: Joi.string().optional(),
          sub_district: Joi.string().optional(),
          district: Joi.string().optional(),
          province: Joi.string().optional(),
          postcode: Joi.string().optional(),
        })).optional(),
        role: Joi.string(),
        credit: Joi.number(),
        status_partner: Joi.string(),
        contractOne: Joi.string(),
        contractTwo: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {Partner, Validate};
