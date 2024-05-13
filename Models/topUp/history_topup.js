const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

let currentTime 
function updateRealTime (){
    currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
    // console.log(currentTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

const historySchema = new Schema({
    partnerID:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ
    outTradeNo:{type:String, require: false},
    firstname:{type:String, require: false},
    lastname:{type:String, require: false},
    amount:{type:Number, require: false},
    before:{type:String, require: false},
    after:{type:String, require: false, default: "รอชำระเงิน"}, //after ทำหน้าที่เหมือน status ไปแล้วใช้บ่งบอกสถานะ
    money_now:{type:String, require: false, default: ""},
    type:{type:String, require: false, default: "none"},
    image:{type:String, require: false, default: "none"},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime;
        }
    }
},{timestamps:true});

const historyWallet = mongoose.model("historytopup", historySchema);

module.exports = { historyWallet };
