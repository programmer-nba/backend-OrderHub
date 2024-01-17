const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const contractSchema = new Schema({
    partnerID: {type:String, require: true},
    contractOne: {type:Number, default: 1, require: true},
    statusOne: {type:String, default: "false", require: true},
    contractTwo: {type:Number, default: 2, require: true},
    statusTwo: {type:String, default: "false", require: true}
},{timestamps: true});

const statusContract = mongoose.model("contract", contractSchema);

const Validate = (data)=>{
    const schema = Joi.object({
        partnerID: Joi.string(),
        contractOne: Joi.string(),
        statusOne: Joi.string(),
        contractTwo: Joi.string(),
        statusTwo: Joi.string()
   });
   return schema.validate(data);
 };

module.exports = {statusContract, Validate};