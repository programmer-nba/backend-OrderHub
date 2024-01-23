const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");
//จุดรับส่งสินค้าของ partners
const dropoffSchema = new Schema({
    partnerID:{type:String, required: false},
    shop_id:{type:String, default:"none", required:false},
    drop_off:{
      address:{type:String, required: true},
      street:{type:String, required: true,},
      sub_district:{type:String, required: true},
      district:{type:String, required: true},
      province:{type:String, required: true},
      postcode:{type:String, required: true}
    }},{timestamps: true});

const dropOffs = mongoose.model("dropoffs", dropoffSchema);

const validate = (data)=>{
   const schema = Joi.object({
        partnerID:Joi.string(),
        shop_id:Joi.string(),
        drop_off:{
          address:Joi.string().required().label('กรุณาใส่บ้านเลขที่/หมู่บ้าน'),
          street:Joi.string(),
          sub_district:Joi.string().required().label('กรุณาใส่ตำบล'),
          district:Joi.string().required().label('กรุณาใส่อำเภอ'),
          province:Joi.string().required().label('กรุณาใส่จังหวัด'),
          postcode:Joi.string().required().label('กรุณาใส่ไปรษณีย์')
        }
   });
   return schema.validate(data);
 };

module.exports = { dropOffs, validate };
