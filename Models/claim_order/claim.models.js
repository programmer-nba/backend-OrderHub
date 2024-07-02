const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema
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
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 1 นาที
setInterval(updateRealTime, 60000);

const claimSchema = new Schema({
    invoice:{type:String, require: false, unique: true},
    partner_id: {type:String, required: false},
    form_data:{
        price_order: {type:Number, required: false},
        express: {type:String, required: false},
        mailno: {type:String, required: false},
        type_order: {type:String, required: false},
    },
    sender:{
        firstname: {type:String, required: false},
        lastname: {type:String, required : false},
        tel: {type:String, required: false},
        type_account: {type:String, required: false},
        bank:{type:String, required: false},
        account_number: {type:String, required: false},
        picture_iden:{type:String, required: false},
        picture_bookbank:{type:String, required: false},
    },
    status_order:{type:String, default: "รอการตรวจสอบ", require: false},
    status_user:{type:String, default: "false", require: false},
    status_admin:{type:String, default: "false", require: false},
    remark:{type:String, default: "", require: false},
    day:{
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return currentTime;
        }
    },
    picture_product:{type:Array, require:false},
    picture_label:{type:Array, require:false},
    picture_broken:{type:Array, require:false},
    picture_weight:{type:Array, require:false},
    picture_value:{type:Array, require:false},
    video:{type:Array, require:false},
},{timestamps: true});

claimSchema.pre('save', async function (next) {
    day = dayjs(currentTime).format("YYYYMMDD");
    let data = `CLAIM`
    let random = Math.floor(Math.random() * 100000)
    const combinedData = `${data}${day}${random}`;
    const findInvoice = await claimOrder.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000);
        combinedData = `${data}${day}${random}`;

        // เช็คใหม่
        findInvoice = await claimOrder.find({invoice: combinedData});
    }

    this.invoice = combinedData;
    next();
})

const claimOrder = mongoose.model("claim_order", claimSchema)

module.exports = { claimOrder };
