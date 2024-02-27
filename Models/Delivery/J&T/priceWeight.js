const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightSchema = new Schema({
    weight: {type:String, required: false},
    price: {type:String, required: false}
},{timestamps: true});

const priceWeight = mongoose.model("price_weight", priceWeightSchema);

module.exports = { priceWeight };
