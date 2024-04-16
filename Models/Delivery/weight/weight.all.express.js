const mongoose = require("mongoose");
const Schema = mongoose.Schema

const weightAllExpressSchema = new Schema({
    shop_id: {type:String, required: false},
    owner_id: {type:String, required: false}, //down_line กับ owner_id ใน schema shopPartner คือคนเดียวกัน
    head_line: {type:String, required: false},
    shop_line: {type:String, required: false},
    weightMax: {type:Number, default: 0, required: false},
    express: {type:String, required: false},
    level: {type:Number, required: false},
    weight: [{
        weightStart: { type: Number },
        weightEnd: { type: Number },
        costBangkok_metropolitan : {type : Number, default: 0, required : true},
        costUpcountry : {type : Number, default: 0, required : true},
        salesBangkok_metropolitan : {type : Number, default: 0, required :false},
        salesUpcountry : {type : Number, default: 0, required : false},
    }]
},{timestamps: true});

const weightAll = mongoose.model("weight_all_express", weightAllExpressSchema);

module.exports = { weightAll };
