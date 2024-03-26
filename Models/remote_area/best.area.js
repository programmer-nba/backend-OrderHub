const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bestRemoteSchema = new Schema({
    No:{type:String, require: false},
    Staiton_code:{type:String, require: false},
    Staiton_name:{type:String, require: false},
    Province:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    District:{type:String, require: false},
    Sub_district:{type:String, require: false},
    Postcode:{type:String, require: false},
    Price:{type:Number, require: false}
},{timestamps:true});

const bestRemoteArea = mongoose.model("best_remote_area", bestRemoteSchema);

module.exports = { bestRemoteArea };