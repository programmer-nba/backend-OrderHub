const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")

const profitPartnerSchema = new Schema({
    ID:{type:String, require: false},
    role:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    profit:{type:Number, require: false},
    express: {type:String, require: false},
    type:{type:String, require: false},
    status:{type:String, default:"พร้อมถอน", require:false}
},{timestamps:true});

const profitPartner = mongoose.model("profit_partner", profitPartnerSchema);

module.exports = { profitPartner };
