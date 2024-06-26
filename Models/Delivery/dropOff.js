const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");
//ผู้ส่งสินค้า
const dropoffSchema = new Schema({
    ID:{type:String, default:"", required: false},
    shop_id:{type:String,  default:"", required:false},
    status:{type:String, required:false},
    name: {type:String, required: false},
    email: {type:String, default:"", required: false},
    address:{type:String, required: false},
    district:{type:String, required: false,},
    state:{type:String, required: false},
    province:{type:String, required: false},
    postcode:{type:String, required: true},
    tel:{type:String, required: true},
    send_behalf: {type:String, required: true},
    send_number: {type:String, required: true},
    send_type: {type:String, required: true},
    flash_pay:{
        aka:{type:String, default:"", required: false},
        name:{type:String, default:"", required: false},
        card_number:{type:String, default:"", required: false},
    },
    best:{
        code:{type:String, default:"", required: false},
        aka:{type:String, default:"", required: false},
        name:{type:String, default:"", required: false},
        card_number:{type:String, default:"", required: false},
    }
},{timestamps: true});

const dropOffs = mongoose.model("dropoffs", dropoffSchema);

module.exports = { dropOffs };
