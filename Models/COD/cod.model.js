const mongoose = require("mongoose");
const Schema = mongoose.Schema

const codSchema = new Schema({
    express: {type:String, required: false},
    percent: {type:Number, required: false}
},{timestamps: true});

const codExpress = mongoose.model("cod_express", codSchema)

module.exports = { codExpress };
