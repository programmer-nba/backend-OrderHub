const mongoose = require("mongoose");
const Joi = require("joi");

const BookingParcelSchema = new mongoose.Schema({
    ID: {type:String, required : false},
    role: {type:String, required : false},
    purchase_id : {type:String, required : true},
    invoice: {type:String, required : false},
    from : {type: Object, required : true},
    to : {type: Object, required : true},
    shop_id : {type: String, required : true},
    parcel : {type: Object, required : true},
    status : {type : Boolean, required : true},
    tracking_code : {type: String, required: true},
    courier_tracking_code : {type: String, required: false},
    courier_code : {type: String, required: true},
    priceOne : {type : Number , required : false},
    price : {type : Number , required : true},
    insurance_code : {type: String, required: false},
    declared_value: {type: Number ,required : false},
    insuranceFee: {type: Number ,required : false},
    cod_amount : {type: Number ,required : true},
    cod_charge : {type: Number , required: true},
    cod_vat : {type: Number , required: false},
    fee_cod: {type: Number , required: false},
    cost_hub : {type: Number, required : true},
    cost : {type: Number ,required : true},
    price_remote_area: {type: Number ,required : false},
    total: {type: Number , required: false},
    cut_partner: {type: Number , required: false},
    discount: {type: Number, required : true},
    order_status : {type: String, default: "booking", required: true},
    package_detail : {type : Object, default: null, required: false}, // กรณีมีการเรียกเก็บเพิ่มเติม
    package_detail_status : {type: Boolean, default: false, required: false}, //สถานะการหักเงินของรpartner กรณีมีการหักส่วนต่าง
},{timestamps:true})

const BookingParcel = mongoose.model("booking_parcel", BookingParcelSchema);

const validate = (data)=>{
    const schema = Joi.object({
        ID : Joi.string(),
        role: Joi.string(),
        purchase_id : Joi.string().required().label('ไม่มีเลขใบสั่งซื้อเข้ามา'),
        shop_id : Joi.string().required().label("ไม่พบ shop_id"),
        status : Joi.boolean().required().label("ไม่พบสถานะ"),
        tracking_code : Joi.string().required().label("ไม่พบ tracking code"),
        courier_code : Joi.string().required().label("ไม่พบรหัสขนส่ง"),
        courier_tracking_code : Joi.string().default("ไม่มี"),
        cod_amount: Joi.number().default(0),
        cod_charge : Joi.number().default(0),
        cod_vat : Joi.number().default(0),
        cost_hub : Joi.number().required.label("ไม่พบราคาต้นทุน"),
        cost : Joi.number().required().label("ไม่พบราคาต้นทุน"),
        discount : Joi.number().default(0),
        price : Joi.number().required().label("ไม่พบราคา"),
        order_status : Joi.string().default('booking'),
        package_detail : Joi.object().default(null),
        package_detail_status : Joi.boolean().default(false),
        from : Joi.object({
            name : Joi.string().required().label('ไม่พบชื่อ'),
            tel: Joi.string().required().label('ไม่พบเบอร์โทร'),
            address : Joi.string().required().label('ไม่พบที่อยู่'),
            district : Joi.string().required().label('ไม่พบตำบล'),
            state : Joi.string().required().label('ไม่พบตำบล'),
            province : Joi.string().required().label('ไม่พบจังหวัด'),
            postcode : Joi.string().required().label('ไม่พบรหัสไปรษณีย์'),
            country : Joi.string().required().label("ไม่พบประเทศ")
        }),
        to : Joi.object({
            name : Joi.string().required().label('ไม่พบชื่อ'),
            tel: Joi.string().required().label('ไม่พบเบอร์โทร'),
            address : Joi.string().required().label('ไม่พบที่อยู่'),
            district : Joi.string().required().label('ไม่พบตำบล'),
            state : Joi.string().required().label('ไม่พบตำบล'),
            province : Joi.string().required().label('ไม่พบจังหวัด'),
            postcode : Joi.string().required().label('ไม่พบรหัสไปรษณีย์'),
            country : Joi.string().required().label("ไม่พบประเทศ")
        }),
        parcel : Joi.object({
            name : Joi.string().required().label('ไม่พบชื่อกล่อง'),
            weight: Joi.string().required().label('ไม่พบน้ำหนัก'),
            width: Joi.string().required().label('ไม่พบความกว้าง'),
            length : Joi.string().required().label('ไม่พบความยาว'),
            height : Joi.string().required().label('ไม่พบความสูง')
        }),
    });
    return schema.validate(data);
}

module.exports = {BookingParcel, validate};