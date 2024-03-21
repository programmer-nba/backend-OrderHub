const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")

const profitTemplateSchema = new Schema({
    orderid: {type:String, require: false},
    partner_number:{type:String, require: false},
    account_name:{type:String, require: false},
    account_number:{type:String, require: false},
    bank:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    amount:{type:Number, require: false},
    phone_number: {type:String, require: false},
    email:{type:String, require: false},
    transfer_instructions:{type:String, default: "", require:false},
    notes:{type:String, default: "", require:false},
    status: {type:String, default: "รอดำเนินการ", require:false},
},{timestamps:true});

const profitTemplate = mongoose.model("profit_template", profitTemplateSchema);

module.exports = { profitTemplate };
