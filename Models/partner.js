const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const partnerSchema = new Schema({
    partnerNumber : {type:String, required: false},
    antecedent: {type:String, required: true},
    firstname: {type:String, required: true},
    lastname:{type:String, require: true},
    username: {type:String, require: true},
    password: {type:String, require: true},
    profit: {type:Number, default: 0, require: false},
    credits: {type:Number, default: 0, require: false},
    iden_number: {type:String, require: true},
    tel: {type:String, require: true},
    email: {type:String, require: true},
    address: {type:String, default:"", require: true},
    street_address: {type:String,default:"", require: true},
    sub_district: {type:String, default:"", require: true},
    district: {type:String, default:"", require: true},
    province: {type:String, default:"", require: true},
    postcode: {type:String, default:"", require: true},
    picture: {
      picture_iden: {type:String, default: "none", require: false},
      picture_two: {type:String, default: "none", require: false},
    },
    shop_partner:[
      { 
        shop_number: {type:String, require: false},
        shop_name: {type:String, require: false},
        address:  {type:String, require: false},
        street_address: {type:String, require: false},
        sub_district:  {type:String, require: false},
        district:  {type:String, require: false},
        province:  {type:String, require: false},
        postcode:  {type:String, require: false},
        status: {type:String, require: false},
        level: {type:Number, require: false}
      }
    ],
    shop_me:[
      {
        shop_number: {type:String, require: false},
        shop_name: {type:String, require: false},
        address:  {type:String, require: false},
        street_address: {type:String, require: false},
        sub_district:  {type:String, require: false},
        district:  {type:String, require: false},
        province:  {type:String, require: false},
        postcode:  {type:String, require: false},
        status: {type:String, require: false},
        level: {type:Number, require: false}
      }
    ],
    upline:{
        head_line: {type:String, default:'ICE', require: false},
        upline_number: {type:String, default:'ICE', require: false},
        shop_upline: {type:String, default:'ICE', require: false},
        level: {type:Number, default: 1, require: false}
    },
    role: {type:String, default: "partner", require: true},
    type: {type:String, require: false},
    status_partner: {type:String, default: "newpartner", require: true},
    contractOne: {type:String, default: "false", require: true}, // สถานะสัญญาที่ 1
    contractTwo: {type:String, default: "false", require: true}, //สถานะสัญญาที่ 2
},{timestamps: true});

partnerSchema.pre('save',async function(next){   //ทำ Middleware การ Hash ก่อน EmployeeScheme ที่ User กรอกมาจะ save
      try{
          const user = this;
          // สุ่มหมายเลขในช่วง 30000-39999
          const randomShopNumber = Math.floor(Math.random() * (399999 - 300000 + 1)) + 300000;
    
          // ตรวจสอบว่าหมายเลขนี้ไม่ซ้ำกับหมายเลขอื่น ๆ ในฐานข้อมูล
          const existingPartner = await user.constructor.findOne({ partnerNumber: randomShopNumber });
    
          if (existingPartner) {
              // ถ้าซ้ำให้สุ่มใหม่
              return user.pre('save', next);
          }
          // กำหนดหมายเลขให้กับ partnerNumber
          user.partnerNumber = randomShopNumber;

          try {
              // ทำการ hash password โดย bcrypt
              const hash = await bcrypt.hash(user.password, 10);
              user.password = hash;
              next();
          } catch (error) {
              console.error("เข้ารหัส:",error);
              next(error);
          }
      }catch(err){
          console.error("main:",error);
          next(error);
      }
})

const Partner = mongoose.model("partner", partnerSchema);

 const Validate = (data)=>{
   const schema = Joi.object({
        partnerNumber: Joi.string(),
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
        upline_number: Joi.string(),
        level: Joi.string(),
        role: Joi.string(),
        status_partner: Joi.string(),
        contractOne: Joi.string(),
        contractTwo: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {Partner, Validate};
