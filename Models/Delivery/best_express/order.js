const mongoose = require("mongoose");
const Schema = mongoose.Schema

//สร้าง Order flash-express
const bestOrderSchema = new Schema({
    ID: {type:String, required: false},
    shop_number: {type:String, default:"", required: false},
    role: {type:String, required: false},
    cod_amount: {type:Number, default:0, required: false},
    price: {type:Number, required: false},
    success: {type:String, required: false},
    reason: {type:String, required: false},
    txlogisticid: {type:String, required: false},
    mailno: {type:Object, required: false },
    sortingcode: {type:Object, required: false },
    streetSortingNo: {type:Object, required: false },
},{timestamps: true});

const bestOrder = mongoose.model("booking_best", bestOrderSchema);

module.exports = { bestOrder };