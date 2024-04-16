const mongoose = require("mongoose");
const { priceWeight } = require("./priceWeight");
const Schema = mongoose.Schema

const priceBaseSchema = new Schema({
    express: {type : String, required: false},
    courier_code : {type : String, required: true},
    courier_name : {type : String, required: true},
    weight: [{
        weightStart: { type: Number },
        weightEnd: { type: Number },
        costBangkok_metropolitan : {type : Number, default: 0, required : true},
        costUpcountry : {type : Number, default: 0, required : true},
        salesBangkok_metropolitan : {type : Number, default: 0, required :false},
        salesUpcountry : {type : Number, default: 0, required : false},
    }]
},{timestamps: true});

priceBaseSchema.pre('save',async function(next){
    try{
        const express = this;
        const findWeight = await priceWeight.find()
            if(!findWeight){
                console.log("ไม่สามารถค้นหาน้ำหนักของได้")
            }else {
                // เพิ่มข้อมูลจาก findPercent ลงใน this.jnt
                findWeight.forEach(weight => {
                    express.weight.push({
                        weightStart: weight.weightStart,
                        weightEnd: weight.weightEnd,
                        salesBangkok_metropolitan: weight.salesBangkok_metropolitan ,
                        salesUpcountry: weight.salesUpcountry
                    });
                });
            }
        next();
    }catch(err){
        console.log(err)
        next();
    }
})

const priceBase = mongoose.model("price_base", priceBaseSchema);

module.exports = { priceBase };
