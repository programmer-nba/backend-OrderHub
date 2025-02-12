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
    // console.log(currentTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

const profitIceSchema = new Schema({
    Orderer: {type:String, require: false, index: true},
    role: {type:String, require: false},
    shop_number: {type:String, require: false, index: true},
    orderid: {type:String, require: false, index: true},//เลขที่ทำรายการ(invoice)
    mailno: {type:String, default:"", require: false, index: true},
    cost_price: {type:Number, require: false},
    cost: {type:Number, require: false},
    profitCost: {type:Number,default:0, require: false},
    profitCOD: {type:Number,default:0, require: false},
    profit: {type:Number,default:0, require: false},
    express: {type:String, require: false},
    type:{type:String, require: false},
    day: {
        type: String,
        required: false,
        index: true,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime
        }
    },
    bookbank: {
            name: {type:String, required: false},
            aka: {type:String, required: false},
            card_number: {type:String, required: false}
    },
    status:{type:String, require:false}
},{timestamps:true});

const profitIce = mongoose.model("profit_ice", profitIceSchema);

module.exports = { profitIce };
