const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const blacklistSchema = new Schema({
    firstname: {type:String, required: true},
    lastname:{type:String, require: true},
    iden_number: {type:String, require: true},
    role: {type:String, default: "partner", require: true},
},{timestamps: true});

const Blacklist = mongoose.model("blacklist", blacklistSchema);

 const Validate = (data)=>{
   const schema = Joi.object({
        firstname: Joi.string(),
        lastname: Joi.string(),
        iden_number: Joi.string(),
        role: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {Blacklist, Validate};
