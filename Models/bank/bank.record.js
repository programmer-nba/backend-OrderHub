const mongoose = require("mongoose");
const Schema = mongoose.Schema

const bankRecordSchema = new Schema({
    ID: {type:String, required:false},
    flash_pay:[
        {
            name: {type:String, required: false},
            aka: {type:String, required: false},
            card_number: {type:String, required: false},
            picture: {type:String, required: false}
        }
    ],
    best:[
        {
            shop: {type:String, required:false},
            name: {type:String, required: false},
            code: {type:String, required: false},
            aka: {type:String, required: false},
            card_number: {type:String, required: false}
        }
    ]
},{timestamps: true});

const bankRecord = mongoose.model("bank_record", bankRecordSchema);

module.exports = { bankRecord };
