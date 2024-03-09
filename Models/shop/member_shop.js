const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const memberSchema = new Schema({
    username:{type:String, require: true},
    password:{type:String, require: true},
    member_number:{type:Number, require: false},
    id_ownerShop: {type:String, require: false},
    shop_number: {type:Number, require: true},
    shop_name:{type:String, require: false},
    antecedent:{type:String, require: false},
    firstname:{type:String, require: true},
    lastname:{type:String, require: true},
    iden_number:{type:String, require: true},
    status:{type:String, default: "รอตรวจสอบ", require: false},
    role:{type:String, default: "shop_member",require: false},
    tel:{type:String, require: true},
    email:{type:String, require: false},
    address: {type:String, require: true},
    street_address: {type:String, default:'none', require: false},
    sub_district: {type:String, require: true},
    district: {type:String, require: true},
    province: {type:String, require: true},
    postcode: {type:String, require: true},
},{timestamps:true});

memberSchema.pre('save',async function(next){  
    const member = this 
    // สุ่มหมายเลขในช่วง 40000-49999
    const randomShopNumber = Math.floor(Math.random() * (499999 - 400000 + 1)) + 400000;
  
    // ตรวจสอบว่าหมายเลขนี้ไม่ซ้ำกับหมายเลขอื่น ๆ ในฐานข้อมูล
    const existingShop = await member.constructor.findOne({ member_number: randomShopNumber });

    if (existingShop) {
      // ถ้าซ้ำให้สุ่มใหม่
      return member.pre('save', next);
    }
    // กำหนดหมายเลขให้กับ shop_number
    member.member_number = randomShopNumber;

    try {
      // ทำการ hash password โดย bcrypt
      const hash = await bcrypt.hash(member.password, 10);
      member.password = hash;
      next();
    }catch (error) {
      console.error(error);
      next(error);
  }
  })

const memberShop = mongoose.model("member_shop", memberSchema);

const validate = (data)=>{
    const schema = Joi.object({
        username:Joi.string().required().label('กรุณากรอกไอดี'),
        password:Joi.string().required().label('กรุณากรอกพาสเวิร์ด'),
        member_number:Joi.number(),
        shop_number:Joi.number().required().label('กรุณากรอกหมายเลขร้านค้าที่ท่านสังกัด'),
        shop_name:Joi.string(),
        antecedent:Joi.string(),
        firstname:Joi.string().required().label('กรุณากรอกชื่อจริง'),
        lastname:Joi.string().required().label('กรุณากรอกชื่อเล่น'),
        iden_number:Joi.string().required().label('กรุณากรอกบัตรประชาชน'),
        status:Joi.string(),
        role:Joi.string(),
        tel:Joi.string().required().label('กรุณากรอกเบอร์โทร'),
        email:Joi.string(),
        address:Joi.string().required().label('กรุณาที่อยู่เลขที่'),
        street_address:Joi.string(),
        sub_district:Joi.string().required().label('กรุณากรอกตำบล'),
        district:Joi.string().required().label('กรุณากรอกอำเภอ'),
        province:Joi.string().required().label('กรุณากรอกจังหวัด'),
        postcode:Joi.string().required().label('กรุณากรอกรหัสไปรษณีย์'),
    });
    return schema.validate(data);
  };

module.exports = { memberShop, validate };
