const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bangkokSchema = new Schema({
    Province:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    District:{type:String, require: false},
    Sub_district:{type:String, require: false},
    Postcode:{type:String, require: false},
},{timestamps:true});

const bangkokMetropolitan = mongoose.model("bangkok_metropolitan", bangkokSchema);

module.exports = { bangkokMetropolitan };