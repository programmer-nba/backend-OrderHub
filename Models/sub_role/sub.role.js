const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

// let currentTime 
// function updateRealTime (){
//     currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
//     // console.log(currentTime)
// }
// // เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
// setInterval(updateRealTime, 5000);

const subRoleSchema = new Schema({
    sub_role:{type:String, require: false},
    detail:{type:String, require: false},
},{timestamps:true});

const subRole = mongoose.model("sub_roles", subRoleSchema);

module.exports = { subRole };
