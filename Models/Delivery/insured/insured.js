const mongoose = require("mongoose");
const Schema = mongoose.Schema

const insuranceSchema = new Schema({
    express: {type : String, required: false},
    product_value : {type:[{
        valueStart: { type: Number },
        valueEnd: { type: Number },
        insurance_fee: { type: Number },
    }]}
})

const insuredExpress = mongoose.model("insured_express", insuranceSchema);

module.exports = {insuredExpress};