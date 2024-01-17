const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const contractSchema = new Schema({
    contract: {type:String, require: true},
    status: {type:String, require: true}
},{timestamps: true});

const statusContract = mongoose.model("contract", contractSchema);

const Validate = (data)=>{
    const schema = Joi.object({
        contract: Joi.string().required().label('กรุณาระบุสัญญา'),
        status: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {statusContract, Validate};