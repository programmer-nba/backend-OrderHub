const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightSchema = new Schema({
    weightStart: { type: Number },
    weightEnd: { type: Number },
    costBangkok_metropolitan : {type : Number, default: 0, required : true},
    costUpcountry : {type : Number, default: 0, required : true},
    salesBangkok_metropolitan : {type : Number, default: 0, required :false},
    salesUpcountry : {type : Number, default: 0, required : false},
},{timestamps: true});

const priceWeight = mongoose.model("price_weight", priceWeightSchema);

module.exports = { priceWeight };
