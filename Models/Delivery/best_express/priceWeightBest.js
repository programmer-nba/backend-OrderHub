const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightBestSchema = new Schema({
    id_shop: {type:String, required: false},
    weight: {type:Number, required: false},
    price: {type:Number, required: false}
},{timestamps: true});

const priceWeightBest = mongoose.model("price_weightBEST", priceWeightBestSchema);

module.exports = { priceWeightBest };
