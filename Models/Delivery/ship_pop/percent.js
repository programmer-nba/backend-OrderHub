const mongoose = require("mongoose");
const Joi = require("joi");

const PercentCourierSchema = new mongoose.Schema({
    express: {type : String, required: false},
    courier_code : {type : String, required: true},
    courier_name : {type : String, required: true},
    on_off : {type : Boolean, default: false, required : false },
    cancel_contract : {type : Boolean, default: false, required : false },
    level: {type : Number, default: 3, required: false},
})

const PercentCourier = mongoose.model("percent_courier", PercentCourierSchema);

const validate = (data)=>{
    const schema = Joi.object({
        express : Joi.string(),
        courier_code : Joi.string().required().label("กรุณากรอกรหัสขนส่ง"),
        courier_name : Joi.string().required().label("กรุณากรอกชื่อขนส่ง"),
    });
    return schema.validate(data);
}

module.exports = {PercentCourier, validate};