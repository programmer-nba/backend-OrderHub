const mongoose = require("mongoose");
const Schema = mongoose.Schema

const jntRemoteSchema = new Schema({
    district_th:{type:String, require: false},
    district:{type:String, require: false},
    province_th:{type:String, require: false},
    province:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    region_th:{type:String, require: false},
    region:{type:String, require: false},
    postcode:{type:String, require: false, index: true},
    type:{type:String, require: false},
    fee_remote: {type:Number,default: 0,  require: false},
    fee_tourist: {type:[{
        weightstart: { type: Number },
        weightend: { type: Number },
        fee: { type: Number },
    }],default:[{
        weightstart: 0 ,
        weightend: 7 ,
        fee: 30,
    },{
        weightstart: 8 ,
        weightend: 20,
        fee: 100,
    },{
        weightstart: 21,
        weightend: 100 ,
        fee: 200,
    }]}
},{timestamps:true});

const jntRemoteArea = mongoose.model("jnt_remote_area", jntRemoteSchema);

module.exports = { jntRemoteArea };