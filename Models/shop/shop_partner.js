const mongoose = require("mongoose");
const Schema = mongoose.Schema
const Joi = require("joi");
const { PercentCourier } = require("../Delivery/ship_pop/percent");
const { priceWeight } = require("../Delivery/weight/priceWeight");

const shopSchema = new Schema({
    partnerID:{type:String, require: false},
    partner_number:{type:String, require: false},
    shop_number: {type:String, require: false},
    shop_name:{type:String, require: true},
    firstname:{type:String, require: false},
    lastname:{type:String, require: false},
    type:{type:String, default: '', require: false},
    credit:{type:Number, default: 0, require: false},
    tax:{
        taxName:{type:String, default: '', require: false},
        taxNumber:{type:String, default: '', require: false},
    },
    commercial:{
        commercialName:{type:String, default: '', require: false},
        commercialNumber:{type:String, default: '', require: false},
    },
    status: {type:String, default:'รอแอดมินอนุมัติ', require:false},
    address: {type:String, default:'none', require: true},
    street_address: {type:String, default:'none', require: false},
    sub_district: {type:String, require: true},
    district: {type:String, require: true},
    province: {type:String, require: true},
    postcode: {type:String, require: true},
    picture: {type:String ,default:"", require: false},
    shop_status: {type:String, require: false},
    upline:{
        head_line:{type: String ,default:"", require: false},
        down_line:{type: String ,default:"", require: false}, //down_line กับ owner_id ใน schema weightAll คือคนเดียวกัน
        shop_line: {type: String ,default:"", require: false},
        shop_downline: {type: Array, require:false},
        level:{type: Number ,default:"", require: false},
    },
    express: [{
        express: {type : String, required: false},
        courier_code : {type : String, required: true},
        courier_name : {type : String, required: true},
        costBangkok_metropolitan : {type : Number, required : true},
        costUpcountry : {type : Number, required : true},
        salesBangkok_metropolitan : {type : Number, default: 0, required :false},
        salesUpcountry : {type : Number, default: 0, required : false},
        on_off : {type : Boolean, default: true, required : false },
        cancel_contract : {type : Boolean, default: false, required : false }
    }]
},{timestamps:true});

shopSchema.pre('save',async function(next){
    try{
        const Shop = this;
        const findPercent = await PercentCourier.find()
            if(!findPercent || findPercent.length === 0){
                console.log("ไม่สามารถค้นหาเปอร์เซ็นแต่ละขนส่งได้(อยู่ใน Schema shop_partner)")
            }else {
                // เพิ่มข้อมูลจาก findPercent ลงใน this.express
                findPercent.forEach(percent => {
                    Shop.express.push({
                        express: percent.express,
                        courier_code: percent.courier_code,
                        courier_name: percent.courier_name,
                        costBangkok_metropolitan: percent.costBangkok_metropolitan,
                        costUpcountry: percent.costUpcountry,
                        salesBangkok_metropolitan: percent.salesBangkok_metropolitan,
                        salesUpcountry: percent.salesUpcountry,
                        on_off: percent.on_off,
                        cancel_contract : percent.cancel_contract
                    });
                });
            }
        next();
    }catch(err){
        console.log(err)
        next();
    }
})

const shopPartner = mongoose.model("shop_partner", shopSchema);

const validate = (data)=>{
    const schema = Joi.object({
        partnerID:Joi.string(),
        partner_number:Joi.string(),
        shop_number:Joi.string(),
        shop_name:Joi.string(),
        firstname:Joi.string(),
        lastname:Joi.string(),
        type:Joi.string(),
        credit:Joi.number(),
        taxName:Joi.string().optional(),
        taxNumber:Joi.string().optional(),
        commercialName:Joi.string().optional(),
        commercialNumber:Joi.string().optional(),
        status:Joi.string(),
        address:Joi.string().required().label('กรุณาที่อยู่เลขที่'),
        street_address:Joi.string(),
        sub_district:Joi.string().required().label('กรุณากรอกตำบล'),
        district:Joi.string().required().label('กรุณากรอกอำเภอ'),
        province:Joi.string().required().label('กรุณากรอกจังหวัด'),
        postcode:Joi.string().required().label('กรุณากรอกรหัสไปรษณีย์'),
    });
    return schema.validate(data);
  };

module.exports = { shopPartner, validate };
