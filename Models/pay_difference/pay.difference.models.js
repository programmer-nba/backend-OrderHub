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

const payDifferenceSchema = new Schema({
    orderid:{type:String, require: false},
    day_create:{type:String, require: false},
    express:{type:String, require: false},
    weight:{type:Number, require: false},
    actual_weight:{type:Number, require: false},
    size: {type:String, require: false},
    cost_price:{type:Number, require: false},
    new_price:{type:Number, require: false},
    price_difference:{type:Number, require: false},
    status_order:{type:String, require: false},
    status:{type:String, require: false},
    remark:{type:String, require: false},
    refutation:{
        picture_size: {type:String, default: "", require: false},
        picture_weight: {type:String, default: "", require: false},
        status: {type:String, default: "", require: false}, //รอตรวจสอบ //อนุมัติ //ไม่อนุมัติ
        status_read: {type:Boolean, default: false, require: false},
        remark_user: {type:String, default: "", require: false},
        remark_admin: {type:String, default: "", require: false},
    }
},{timestamps:true});

const payDifference = mongoose.model("pay_difference", payDifferenceSchema);

module.exports = { payDifference };
