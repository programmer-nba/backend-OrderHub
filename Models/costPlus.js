const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

const costLevel = new Schema({
    partnerID: {type:String, required: false},
    cost_level: [
        {
            level: {type:String, required: false},
            cost_plus: {type:String, required: false},
            partner_id: {type:String, default:"", required:false}
        }
    ],
},{timestamps: true});

const costPlus = mongoose.model("cost_level", costLevel);

module.exports = {costPlus};