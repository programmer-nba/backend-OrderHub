const mongoose = require("mongoose");
const Schema = mongoose.Schema

//สร้าง drop down ประเภทสินค้า
const typeExpressSchema = new Schema({
    code: {type:String, required: false},
    mean: {type:String, required: false},
},{timestamps: true});

const typeExpress = mongoose.model("type_express", typeExpressSchema);

module.exports = { typeExpress };
