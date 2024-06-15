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
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

const historySchema = new Schema({
    shop_id:{type:String, require: false},
    ID:{type:String, require: false},
    role:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    mailno:{type:String, require: false},
    amount:{type:Number, require: false},
    before:{type:String, require: false},
    after:{type:String, require: false, default: ""},
    type:{type:String, require: false, default: "none"},
    remark:{type:String, require:false},
    day_cancel:{type:String, require:false, default: ""},
    user_cancel:{type:String, require:false, default: ""},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime;
        }
    }
},{timestamps:true});

const historyWalletShop = mongoose.model("historyWallet_shop", historySchema);

module.exports = { historyWalletShop };
