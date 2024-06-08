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

const logsSchema = new Schema({
    ip_address: {type:String, required: false},
    id: {type:String, required: false},
    role: {type:String, required: false},
    ref_no: {type:String, required: false},
    otp: {type:String, required: false},
    phone: {type:String, required: false},
    type: {type:String, required: false},
    description: {type:String, required: false},
    order: {type:Array, required: false},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime
        }
    }
},{timestamps: true});

const logSystem = mongoose.model("logs", logsSchema);

module.exports = {logSystem};