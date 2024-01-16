const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
var bcrypt = require("bcrypt");

const adminSchema = new Schema({
    firstname: {type:String, required: true},
    lastname:{type:String, require: true},
    username: {type:String, require: true},
    password: {type:String, require: true},
    role: {type:String, default: "admin", require: true},
},{timestamps: true});

adminSchema.pre('save',function(next){   //ทำ Middleware การ Hash ก่อน EmployeeScheme ที่ User กรอกมาจะ save
  const user = this
  bcrypt.hash(user.password, 10).then(hash => {
      user.password = hash
      next()
  }).catch(error =>{
      console.error(error)
  })
})

const Admin = mongoose.model("admin", adminSchema);

 const Validate = (data)=>{
   const schema = Joi.object({
        firstname: Joi.string().required().label('กรุณากรอกชื่อจริง'),
        lastname: Joi.string().required().label('กรุณากรอกนามสกุล'),
        username: Joi.string().required().label('กรุณากรอกยูสเซอร์ไอดี'),
        password: Joi.string().required().label('กรุณากรอกพาสเวิร์ด'),
        role: Joi.string(),
   });
   return schema.validate(data);
 };

module.exports = {Admin, Validate};
