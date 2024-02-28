const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightSchema = new Schema({
    weight: {type:Number, required: false},
    price: {type:Number, required: false}
},{timestamps: true});

const priceWeight = mongoose.model("price_weight", priceWeightSchema);

module.exports = { priceWeight };
