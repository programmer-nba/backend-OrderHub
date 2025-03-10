const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

let currentTime
function updateRealTime() {
    currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

const profitTemplateSchema = new Schema({
    orderid: {type:String, require: false, index: true},
    owner_id: {type:String, require: false, index: true},
    Orderer: {type:String, require: false, index: true},
    role: {type:String, require: false},
    shop_number: {type:String, require: false},
    express: {type:String, require: false},
    type: {type:String, require: false},
    template:{
            partner_number:{type:String, require: false, index: true},
            account_name:{type:String, require: false},
            account_number:{type:String, require: false},
            bank:{type:String, require: false},//เลขที่ทำรายการ(invoice)
            amount:{type:Number, require: false},
            phone_number: {type:String, require: false},
            email:{type:String, require: false},
            transfer_instructions:{type:String, default: "", require:false},
            notes:{type:String, default: "", require:false},
    },
    status: {type:String, default: "รอดำเนินการ", require:false},
    code: {type:String, default: "", require:false},
    express: {type:String, default: "", require:false},
    day: {
        type: String,
        required: false,
        index: true,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime;
        }
    },
    day_sign: {type:String, default: "", require:false, index: true},
    day_pay: {type:String, default: "", require:false, index: true},
    day_pick: {type:String, default: "", require:false, index: true},
},{timestamps:true});

const profitTemplate = mongoose.model("profit_template", profitTemplateSchema);

module.exports = { profitTemplate };
