const mongoose = require("mongoose");
const Schema = mongoose.Schema

//สร้าง Order best-express
const bestOrderSchema = new Schema({
    ID: {type:String, required: false},
    invoice: {type:String, required: false},
    shop_number: {type:String, default:"", required: false},
    role: {type:String, required: false},
    from: {type:Object, required: false},
    to: {type:Object, required: false},
    parcel: {type:Object, required: false},
    cod_amount: {type:Number,default: 0, required: false},
    price: {type:Number, required: false},
    fee_cod: {type:Number, required: false},
    total: {type:Number, required: false},
    pdfStream: {type:String, required: false},
    type: {type:String, required: false},
    status: {type:String, required: false},
    result: {type:String, required: false},
    txLogisticId: {type:String, required: false},
    triSortCode: {type:String, required: false},
    mailNo: {type:String, required: false},
    packRule: {type:String, required: false},
    appointDeliveryNo: {type:String, required: false},
    errorCode: {type:String, required: false },
    errorDescription: {type:String, required: false },
    remark: {type:String, required: false },
},{timestamps: true});

const bestOrder = mongoose.model("booking_best", bestOrderSchema);

module.exports = { bestOrder };