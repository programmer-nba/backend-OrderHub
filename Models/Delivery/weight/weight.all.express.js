const mongoose = require("mongoose");
const Schema = mongoose.Schema

const priceWeightBestSchema = new Schema({
    id_shop: {type:String, required: false},
    express: {type:String, required: false},
    weight: [{
        weightStart: { type: Number },
        weightEnd: { type: Number },
        costBangkok_metropolitan : {type : Number, default: 0, required : true},
        costUpcountry : {type : Number, default: 0, required : true},
        salesBangkok_metropolitan : {type : Number, default: 0, required :false},
        salesUpcountry : {type : Number, default: 0, required : false},
    }]
},{timestamps: true});

const weightAll = mongoose.model("weight_all_express", priceWeightBestSchema);

module.exports = { weightAll };
