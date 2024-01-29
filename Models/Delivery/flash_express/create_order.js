const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");

//สร้าง Order flash-express
const flashOrderSchema = new Schema({
    mchId:{type:String, required: true},
    nonceStr: {type:String, required: false},
    sign: {type:String, required: false},
    outTradeNo: {type:String, required: false},
    warehouseNo: {type:String, required: false},
    srcName: {type:String, required: true},
    srcPhone:{type:String, required: true},
    srcProvinceName: {type:String, required: true},
    srcCityName: {type:String, required: true},
    srcDistrictName: {type:String, required: true},
    srcPostalCode: {type:String, required: true},
    srcDetailAddress: {type:String, required: true},
    dstName: {type:String, required: true},
    dstPhone: {type:String, required: true},
    dstHomePhone: {type:String, required: true},
    dstProvinceName: {type:String, required: true},
    dstDistrictName:{type:String, required: true},
    dstCityName: {type:String, required: true},
    dstDistrictName: {type:String, required: true},
    dstPostalCode: {type:String, required: true},
    dstDetailAddress: {type:String, required: true},
    returnName: {type:String, required: false},
    returnPhone: {type:String, required: false},
    returnProvinceName: {type:String, required: false},
    returnCityName: {type:String, required: false},
    returnDistrictName: {type:String, required: false},
    returnPostalCode:{type:String, required: false},
    returnDetailAddress: {type:String, required: false},
    articleCategory: {type:Number, required: true},
    expressCategory: {type:Number, required: true},
    weight: {type:Number, required: true},
    insured: {type:Number, required: true},
    insureDeclareValue: {type:Number, required: false},
    opdInsureEnabled:{type:Number, required: false},
    codEnabled: {type:Number, required: true},
    codAmount: {type:Number, required: false},      
    subParcelQuantity: {type:Number, required: false}, 
    subParcel:[
        {
            outTradeNo: {type:String, required: false},
            weight: {type:Number, required: false},
            width: {type:Number, required: false},
            length: {type:Number, required: false},
            height: {type:Number, required: false},
            remark: {type:String, required: false},
        }
    ],
    remark:{type:String, required: false}
    },{timestamps: true});

const flashCreateOrder = mongoose.model("createorder_flash", flashOrderSchema);

module.exports = { flashCreateOrder };
