const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")

require('dayjs/plugin/timezone');
require('dayjs/plugin/utc');

// เพิ่ม plugin สำหรับใช้งาน timezone และ utc
dayjs.extend(require('dayjs/plugin/timezone'));
dayjs.extend(require('dayjs/plugin/utc'));

const currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DDTHH:mm:ssZ');

const orderAllSchema = new Schema({
        ID: {type:String, required : false},
        role: {type:String, required : false},
        shop_number : {type: String, required : false},
        tracking_code : {type: String, required: false},
        mailno: {type: String, required: false},
        invoice: {type:String, required : false},
        from : {type: Object, required : false},
        to : {type: Object, required : false},
        parcel : {type: Object, required : false},
        courier_code : {type: String, required: false},
        priceOne : {type : Number , required : false},
        price : {type : Number , required : false},
        insurance_code : {type: String, required: false},
        declared_value: {type: Number ,required : false},
        insuranceFee : {type: Number ,required : false},
        cod_amount : {type: Number ,required : false},
        cod_charge : {type: Number , required: false},
        cod_vat : {type: Number , required: false},
        fee_cod: {type: Number , required: false},
        cost_hub : {type: Number, required : false},
        cost : {type: Number ,required : false},
        price_remote_area: {type: Number ,required : false},
        total: {type: Number , required: false},
        cut_partner: {type: Number , required: false},
        express: {type : String, required : false},
        type: {type : String, required : false},
        pdfStream: {type : String, required : false},
        bill_status : {type : String, default: "พักบิล", required : false},
        order_status : {type: String, default: "booking", required: false},
        day: {
                type: String,
                required: false,
                default: function () {
                    // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
                    return currentTime;
                }
            }
},{timestamps:true})

const orderAll = mongoose.model("order_all", orderAllSchema);

module.exports = {orderAll};