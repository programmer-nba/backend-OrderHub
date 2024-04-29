const mongoose = require("mongoose");
const Schema = mongoose.Schema

const postalSchema = new Schema({
    province:{type:String, require: false},
    state:{type:String, require: false},
    district:{type:String, require: false},
    postcode:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    remark:{type:String, require: false},
},{timestamps:true});

const postalThailand = mongoose.model("postal_thailand", postalSchema);

module.exports = { postalThailand };