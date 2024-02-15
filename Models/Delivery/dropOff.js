const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");
//จุดรับส่งสินค้าของ partners
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
    tel:{type:String, required: true}
    },{timestamps: true});

const dropOffs = mongoose.model("dropoffs", dropoffSchema);

module.exports = { dropOffs };
