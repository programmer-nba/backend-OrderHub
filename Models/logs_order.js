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
function updateRealTime() {
    currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
    // console.log(currentTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

const logOrderSchema = new Schema({
    ip_address: {type:String, required: false},
    id: {type:String, required: false},
    role: {type:String, required: false},
    type: {type:String, required: false},
    orderer: {type:String, required: false},
    description: {type:String, required: false},
    order: [{
        orderid: {type:String, required: false},
        express: {type:String, required: false},
    }],
    latitude: {type:String, required: false},
    longtitude: {type:String, required: false},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime
        }
    }
},{timestamps: true});

const logOrder = mongoose.model("logs_order", logOrderSchema);

module.exports = {logOrder};