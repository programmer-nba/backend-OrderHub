const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

const topupSchema = new Schema({
    partnerID:{type:String, require: false},
    shop_number:{type:String, require: false},
    invoice:{type:String, require: false},//เลขที่ทำรายการ
    amount:{type:Number, require: true,},
    charge:{type:Number, require: false, default: 0},
    payment_type:{type:String, require: false},
    referenceNo:{type:String, require: false, default:''},
    detail:{type:Object, require: false, default:null},
    company:{type:String, require: false},
    admin:{ //ชื่อเจ้าหน้าที่ ทำรายการยืนยัน กรณีเป็นการเติมเงินแบบแนบสลิป
      name_admin: {type:String, default:'none', require: false}
    }, 
    status:{type:String, require: false, default:'รอตรวจสอบ'}, //WAIT > SUCCESS > FAIL
    remark:{type:Array, require: false, default:''},
    timestamp:{type:Date,default:Date.now, require: false}, //วันทำรายการ
});

const TopupWallet = mongoose.model("topup", topupSchema);

 const Validate_topup_wallet = (data)=>{
   const schema = Joi.object({
        partnerID:Joi.string(),
        shop_number:Joi.string(),
        invoice:Joi.string(),
        shop_id:Joi.string(),
        amount:Joi.number().required().label('กรุณาจำนวนเงิน'),
        charge:Joi.number().default(0),
        payment_type:Joi.string(),
        referenceNo:Joi.string().default(''),
        detail:Joi.string().default(null),
        company:Joi.string(),
        admin:Joi.string().default('ไม่มี'),
        status:Joi.string().label('รอตรวจสอบ'),
        remark:Joi.string().default(''),
        timestamp:Joi.string()
   });
   return schema.validate(data);
 };

module.exports = {TopupWallet, Validate_topup_wallet};
