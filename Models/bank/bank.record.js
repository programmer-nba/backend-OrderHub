const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bankRecordSchema = new Schema({
    id: {type:String}, required:false,
    aka: {type:String, required: false},
    name: {type:String, required: false},
    card_number: {type:String, required: false}
},{timestamps: true});

const bankRecord = mongoose.model("bank_code", bankRecordSchema);

module.exports = { bankRecord };
