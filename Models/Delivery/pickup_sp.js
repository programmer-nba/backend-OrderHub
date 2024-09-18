const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

let currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DDTHH:mm:ssZ');

const pickupOrderSchema = new Schema({
    partner_id:{type:String, require: false},
    courier_ticket_id: {type:String, require: false},
    courier_pickup_id: {type:Number, require: false},
    tracking_code: {type:String, require: false},
    num_of_parcel: {type:Number, require: false},
    datetime_pickup: {type:String, require: false},
    origin_name : {type:String, require: false},
    origin_phone : {type:String, require: false},
    origin_address : {type:String, require: false},
    origin_district : {type:String, require: false},
    origin_city : {type:String, require: false},
    origin_province : {type:String, require: false},
    origin_postcode : {type:String, require: false},
    status:{type:String, require: false},
    day:{
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
        }
    },
},{timestamps:true});

const pickupOrder = mongoose.model("pickup_order", pickupOrderSchema);

module.exports = { pickupOrder };
