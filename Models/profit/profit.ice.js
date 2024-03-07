const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")

const profitIceSchema = new Schema({
    Orderer:{type:String, require: false},
    role:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    profit:{type:Number, require: false},
    express: {type:String, require: false},
    type:{type:String, require: false},
    day: {
        type: String,
        required: false,
        default: function () {
            // กำหนดค่าเริ่มต้นเป็นวันที่ปัจจุบันและให้ Dayjs จัดรูปแบบเป็น 'YYYY-MM-DD'
            return dayjs().format('YYYY-MM-DD');
        }
    },
},{timestamps:true});

const profitIce = mongoose.model("profit_ice", profitIceSchema);

module.exports = { profitIce };
