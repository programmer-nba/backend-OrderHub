const mongoose = require("mongoose");
const Joi = require("joi");

const PercentCourierSchema = new mongoose.Schema({
    express: {type : String, required: false},
    courier_code : {type : String, required: true},
    courier_name : {type : String, required: true},
    percent_orderHUB : {type : Number, required : true},
    percent_shop : {type : Number, required : true},
    on_off : {type : Boolean, default: true, required : false }
})

const PercentCourier = mongoose.model("percent_courier", PercentCourierSchema);

const validate = (data)=>{
    const schema = Joi.object({
        express : Joi.string(),
        courier_code : Joi.string().required().label("กรุณากรอกรหัสขนส่ง"),
        courier_name : Joi.string().required().label("กรุณากรอกชื่อขนส่ง"),
        percent_orderHUB : Joi.number().required().label("กรุณากรอกเปอร์เซ็นของบริษัท"),
        percent_shop : Joi.number().required().label("กรุณากรอกเปอร์เซ็นของพาร์ทเนอร์")
    });
    return schema.validate(data);
}

module.exports = {PercentCourier, validate};