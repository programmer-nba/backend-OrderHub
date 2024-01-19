const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const topupSchema = new Schema({
    partnerID:{type:String, require: false},
    shop_id:{type:String, require: false},
    invoice:{type:String, require: false},//เลขที่ทำรายการ
    amount:{type:String, require: true,},
    charge:{type:String, require: false, default: 0},
    payment_type:{type:String, require: false},
    referenceNo:{type:String, require: false, default:''},
    detail:{type:Object, require: false, default:null},
    company:{type:String, require: false},
    employee:{type:Array, require: false, default:'ไม่มี'}, //ชื่อเจ้าหน้าที่ ทำรายการยืนยัน กรณีเป็นการเติมเงินแบบแนบสลิป
    status:{type:String, require: false, default:'รอตรวจสอบ'}, //WAIT > SUCCESS > FAIL
    remark:{type:Array, require: false, default:''},
    timestamp:{type:Date,default:Date.now, require: false}, //วันทำรายการ
});

const TopupWallet = mongoose.model("topup", topupSchema);

 const Validate_topup_wallet = (data)=>{
   const schema = Joi.object({
        partnerID:Joi.string(),
        shop_id:Joi.string(),
        invoice:Joi.string(),
        amount:Joi.string().required().label('กรุณาจำนวนเงิน'),
        charge:Joi.string().default(0),
        payment_type:Joi.string(),
        referenceNo:Joi.string().default(''),
        detail:Joi.string().default(null),
        company:Joi.string(),
        partner:Joi.string().default('ไม่มี'),
        status:Joi.string().label('รอตรวจสอบ'),
        remark:Joi.string().default(''),
        timestamp:Joi.string()
   });
   return schema.validate(data);
 };

module.exports = {TopupWallet, Validate_topup_wallet};
