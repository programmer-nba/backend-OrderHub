const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const partnerSchema = new Schema({
    partnerID:{type:String, require: true},
    shop_id:{type:String, require: true},
    invoice:{type:String, require: true},
    amount:{type:String, require: true,},
    charge:{type:String, require: true},
    payment_type:{type:String, require: true},
    referenceNo:{type:String, require: true},
    detail:{type:Array, require: true},
    company:{type:String, require: true},
    partner:{type:Array, require: true},
    referenceNo:{type:String, require: true},
    detail:{type:Array, require: true},
    referenceNo:{type:String, require: true},
},{timestamps: true});

const Partner = mongoose.model("partner", partnerSchema);

 const Validate = (data)=>{
   const schema = Joi.object({
        partnerID:Joi.string().required().label('กรุณาใส่หมายเลข ID พาร์ทเนอร์'),
        deli_address:Joi.string().label('กรุณาใส่บ้านเลขที่/หมู่บ้าน'),
        deli_street:Joi.string(),
        deli_sub:Joi.string().label('กรุณาใส่ตำบล'),
        deli_district:Joi.string().label('กรุณาใส่อำเภอ'),
        deli_province:Joi.string().label('กรุณาใส่จังหวัด'),
        deli_postcode:Joi.string().label('กรุณาใส่ไปรษณีย์')
   });
   return schema.validate(data);
 };

module.exports = {Partner, Validate};
