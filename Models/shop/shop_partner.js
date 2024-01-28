const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

const shopSchema = new Schema({
    partnerID:{type:String, require: false},
    shop_number: {type:Number, require: false},
    shop_name:{type:String, require: true},
    firstname:{type:String, require: false},
    lastname:{type:String, require: false},
    tax:{
        name_regis:{type:String, default:'none', require: false},
        number_regis:{type:String, default:'none', require: false},
    },
    address: {type:String, default:'none', require: true},
    street_address: {type:String, default:'none', require: false},
    sub_district: {type:String, require: true},
    district: {type:String, require: true},
    province: {type:String, require: true},
    postcode: {type:String, require: true},
},{timestamps:true});

shopSchema.pre('save', async function (next) {
    // สุ่มหมายเลขในช่วง 50000-59999
    const randomShopNumber = Math.floor(Math.random() * (599999 - 500000 + 1)) + 500000;
  
    // ตรวจสอบว่าหมายเลขนี้ไม่ซ้ำกับหมายเลขอื่น ๆ ในฐานข้อมูล
    const existingShop = await this.constructor.findOne({ shop_number: randomShopNumber });
  
    if (existingShop) {
      // ถ้าซ้ำให้สุ่มใหม่
      return this.pre('save', next);
    }
    // กำหนดหมายเลขให้กับ shop_number
    this.shop_number = randomShopNumber;
    next();
  });

const shopPartner = mongoose.model("shop_partner", shopSchema);

const validate = (data)=>{
    const schema = Joi.object({
        partnerID:Joi.string(),
        shop_number:Joi.number(),
        shop_name:Joi.string(),
        firstname:Joi.string(),
        lastname:Joi.string(),
        name_regis:Joi.string(),
        number_regis:Joi.string(),
        address:Joi.string().required().label('กรุณาที่อยู่เลขที่'),
        street_address:Joi.string(),
        sub_district:Joi.string().required().label('กรุณากรอกตำบล'),
        district:Joi.string().required().label('กรุณากรอกอำเภอ'),
        province:Joi.string().required().label('กรุณากรอกจังหวัด'),
        postcode:Joi.string().required().label('กรุณากรอกรหัสไปรษณีย์'),
    });
    return schema.validate(data);
  };

module.exports = { shopPartner, validate };
