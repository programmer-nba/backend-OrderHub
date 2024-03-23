const mongoose = require("mongoose");
const Schema = mongoose.Schema

//สร้าง Order flash-express
const jtOrderSchema = new Schema({
    ID: {type:String, required: false},
    invoice: {type:String, required: false},
    shop_number: {type:String, default:"", required: false},
    role: {type:String, required: false},
    from : {type: Object, required : false},
    to : {type: Object, required : false},
    parcel : {type: Object, required : false},
    status: {type:String, required: false},
    cod_amount: {type:Number, default:0, required: false},
    cost_hub: {type:Number, required: false},
    cost: {type:Number, required: false},
    fee_cod: {type:Number, required: false},
    total: {type:Number, required: false},
    cut_partner: {type: Number , required: false},
    price: {type:Number, required: false},
    success: {type:String, required: false},
    reason: {type:String, required: false},
    txlogisticid: {type:String, required: false},
    mailno: {type:Object, required: false },
    sortingcode: {type:Object, required: false },
    streetSortingNo: {type:Object, required: false },
},{timestamps: true});

const jntOrder = mongoose.model("jnt_order", jtOrderSchema);

module.exports = { jntOrder };
