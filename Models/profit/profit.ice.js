const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

const currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DDTHH:mm:ssZ');

const profitIceSchema = new Schema({
    Orderer:{type:String, require: false},
    role:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    cost: {type:Number, require: false},
    profit: {type:Number, require: false},
    express: {type:String, require: false},
    type:{type:String, require: false},
    day: {
        type: String,
        required: false,
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
