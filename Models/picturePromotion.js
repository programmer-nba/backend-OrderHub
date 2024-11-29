const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")
require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

const picturePromotionSchema = new Schema({
    name: {type:String, required: false},
    url: {type:String, required: false},
    status: {type:String, required: false},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD');
        }
    },
    day_delete: {type:String, required: false,default:""},
},{timestamps: true});

const picturePromotion = mongoose.model("picture_promotion", picturePromotionSchema);

module.exports = { picturePromotion };