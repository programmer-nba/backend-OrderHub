const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")

const historySchema = new Schema({
    ID:{type:String, require: false},
    role:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    amount:{type:Number, require: false},
    before:{type:String, require: false},
    after:{type:String, require: false, default: ""},
    type:{type:String, require: false, default: "none"},
    remark:{type:String, require:false}
},{timestamps:true});

const historyWalletShop = mongoose.model("historyWallet_shop", historySchema);

module.exports = { historyWalletShop };
