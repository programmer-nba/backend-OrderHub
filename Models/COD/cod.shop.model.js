const mongoose = require("mongoose");
const Schema = mongoose.Schema

const percentShopCodSchema = new Schema({
    shop_id: {type:String, required: false},
    owner_id: {type:String, required: false}, //down_line กับ owner_id ใน schema shopPartner คือคนเดียวกัน
    head_line: {type:String, required: false},
    shop_line: {type:String, required: false},
    level: {type:Number, required: false},
    express: [{
        express: {type:String, required: false},
        percent: {type:Number, required: false},
        on_off: {type:Boolean, required: false},
    }]
},{timestamps: true})

const codPercent = mongoose.model("cod_percent", percentShopCodSchema);

module.exports = { codPercent };