const mongoose = require("mongoose");
const Schema = mongoose.Schema

//สร้าง drop down ประเภทสินค้า
const typeProductSchema = new Schema({
    code: {type:String, required: false},
    mean: {type:String, required: false},
},{timestamps: true});

const typeProduct = mongoose.model("type_product", typeProductSchema);

module.exports = { typeProduct };
