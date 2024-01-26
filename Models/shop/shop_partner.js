const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

const shopSchema = new Schema({
    partnerID:{type:String, require: false},
    name_shop:{type:String, require: true},
    firstname:{type:String, require: false},
    lastname:{type:String, require: false},
    tax:{
        name_regis:{type:String, default:'none', require: false},
        number_regis:{type:String, default:'none', require: false},
    },
    address: {type:String, default:'none', require: true},
    street_address: {type:String, require: false},
    sub_district: {type:String, require: true},
    district: {type:String, require: true},
    province: {type:String, require: true},
    postcode: {type:String, require: true},
},{timestamps:true});

const shopPartner = mongoose.model("shop_partner", shopSchema);

const validate = (data)=>{
    const schema = Joi.object({
        partnerID:Joi.string(),
        name_shop:Joi.string(),
        firstname:Joi.string(),
        lastname:Joi.string(),
        tax:{
            name_regis:Joi.string(),
            number_regis:Joi.string(),
        },
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
