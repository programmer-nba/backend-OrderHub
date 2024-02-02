const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const dayjs = require("dayjs")

const historySchema = new Schema({
    partnerID:{type:String, require: false},
    shop_number:{type:String, require: false},
    orderid:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    firstname:{type:String, require: false},
    lastname:{type:String, require: false},
    amount:{type:Number, require: false},
    before:{type:String, require: false},
    after:{type:String, require: false, default: "รอแอดมินยืนยัน"},
    type:{type:String, require: false, default: "none"},
    timestamps:{
        type: String,
        default: function() {
          return dayjs(Date.now()).format('YYYY-MM-DD');
        }
      }
},{timestamps:true});

const historyWallet = mongoose.model("historytopup", historySchema);

module.exports = { historyWallet };
