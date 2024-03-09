const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bankBestDropdownSchema = new Schema({
    code: {type:String, required: false},
    aka: {type:String, required: false},
    name: {type:String, required: false},
},{timestamps: true});

const bankBestDropDown = mongoose.model("bank_best_dropdown", bankBestDropdownSchema);

module.exports = { bankBestDropDown };