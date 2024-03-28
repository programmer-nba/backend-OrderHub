const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

//สร้าง Order flash-express
const flashOrderSchema = new Schema({
    ID: {type:String, required: false},
    shop_number: {type:String, required: false},
    role: {type:String, required: false},
    from: {type:Object, required: false },
    to: {type:Object, required: false },
    parcel: {type:Object, required: false },
    return: {type:Object, required: false},
    response: {type:Object, required: false},
    cost_hub: {type:Number, required: false},
    cost: {type:Number, required: false},
    priceOne: {type:Number, default: 0, required: false},
    price: {type:Number, required: false},
    codAmount: {type:Number,default: 0, required: false},
    fee_cod: {type:Number, required: false},
    price_remote_area: {type: Number ,required : false},
    declared_value: {type: Number ,required : false},
    insuranceFee: {type: Number ,required : false},
    total: {type:Number, required: false},
    cut_partner: {type: Number , required: false},
    status: {type:String, default:"booking", required: false}
},{timestamps: true});

const flashOrder = mongoose.model("booking_flash", flashOrderSchema);

module.exports = { flashOrder };
