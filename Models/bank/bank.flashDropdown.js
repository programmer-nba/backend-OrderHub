const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bankSchema = new Schema({
    aka: {type:String, required: false},
    name: {type:String, required: false},
},{timestamps: true});

const bankCode = mongoose.model("bank_code", bankSchema);

module.exports = { bankCode };
