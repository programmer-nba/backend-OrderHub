const mongoose = require("mongoose");
const Joi = require("joi");

const PercentCourierSchema = new mongoose.Schema({
    express: {type : String, required: false},
    courier_code : {type : String, required: true},
    courier_name : {type : String, required: true},
    costBangkok_metropolitan : {type : Number, required : true},
    costUpcountry : {type : Number, required : true},
    salesBangkok_metropolitan : {type : Number, default: 0, required :false},
    salesUpcountry : {type : Number, default: 0, required : false},
    on_off : {type : Boolean, default: true, required : false },
    cancel_contract : {type : Boolean, default: false, required : false }
})

const PercentCourier = mongoose.model("percent_courier", PercentCourierSchema);

const validate = (data)=>{
    const schema = Joi.object({
        express : Joi.string(),
        courier_code : Joi.string().required().label("กรุณากรอกรหัสขนส่ง"),
        courier_name : Joi.string().required().label("กรุณากรอกชื่อขนส่ง"),
        costBangkok_metropolitan : Joi.number().required().label("กรุณากรอกเปอร์เซ็นของบริษัท"),
        costUpcountry : Joi.number().required().label("กรุณากรอกเปอร์เซ็นของพาร์ทเนอร์")
    });
    return schema.validate(data);
}

module.exports = {PercentCourier, validate};