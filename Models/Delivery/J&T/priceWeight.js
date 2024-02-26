const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightSchema = new Schema({
    weight_s: {type:String, required: false},
    weight_e: {type:String, required: false},
    price: {type:String, required: false}
},{timestamps: true});

const priceWeight = mongoose.model("price_weight", priceWeightSchema);

module.exports = { priceWeight };
