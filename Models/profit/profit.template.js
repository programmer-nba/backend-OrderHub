const mongoose = require("mongoose");
const Schema = mongoose.Schema
const dayjs = require("dayjs")

const profitTemplateSchema = new Schema({
    no: {type:String, require: false},
    partner_number:{type:String, require: false},
    account_name:{type:String, require: false},
    account_number:{type:String, require: false},
    bank:{type:String, require: false},//เลขที่ทำรายการ(invoice)
    amount:{type:Number, require: false},
    phone_number: {type:String, require: false},
    email:{type:String, require: false},
    transfer_instructions:{type:String, require:false},
    notes:{type:String, require:false},
},{timestamps:true});

// Middleware to set 'no' before saving
profitTemplateSchema.pre('save', async function(next) {
    const latestProfitTemplate = await this.constructor.findOne({}, {}, { sort: { no: -1 } });

    if (latestProfitTemplate) {
        this.no = latestProfitTemplate.no + 1;
    } else {
        this.no = 1;
    }
    next();
});

const profitTemplate = mongoose.model("profit_template", profitTemplateSchema);

module.exports = { profitTemplate };
