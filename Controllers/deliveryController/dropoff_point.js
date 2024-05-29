const { dropOffs, validate} = require("../../Models/Delivery/dropOff");
const { Partner } = require("../../Models/partner");
const axios = require('axios');
const { shopPartner } = require("../../Models/shop/shop_partner");

create = async (req, res)=>{
    try{
        const idPartner = req.decoded.userid
        
        console.log(idPartner)
        const findPartner = await Partner.findOne({_id:idPartner})
        console.log(findPartner)
        if(findPartner){
            console.log(req.body)
            const data = {...req.body,
            partnerID:idPartner,
            drop_off: {
                address: req.body.address,
                street: req.body.street,
                sub_district: req.body.sub_district,
                district: req.body.district,
                province: req.body.province,
                postcode: req.body.postcode
                }
            }
            const dropCreate = await dropOffs.create(data)
            return res
                    .status(200)
                    .send({status:true, 
                        message:"เพิ่มจุดรับส่งสำเร็จ",
                        data: dropCreate})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ค้นหา partner id ไม่เจอ"})
        }
    }catch(err){
        return res
                .status(500)
                .send({status: false, message:"มีบางอย่างผิดพลาด"})
    }
}
getAll = async (req, res)=>{
    try{
        const get = await dropOffs.find()
        if(get){
            return res
                    .status(200)
                    .send({status:true, data: get})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        return res
                .status(500)
                .send({status: false, message:"มีบางอย่างผิดพลาด"})
    }
}
update = async (req, res)=>{
    try{
        const id = req.params.id
        const updateDrop = await dropOffs.findByIdAndUpdate(id, {...req.body,
            $set: {
                "drop_off.address": req.body.address,
                "drop_off.street": req.body.street,
                "drop_off.sub_district": req.body.sub_district,
                "drop_off.district": req.body.district,
                "drop_off.province": req.body.province,
                "drop_off.postcode": req.body.postcode,
            }}, {new:true})
        if(updateDrop){
            return res
                    .status(200)
                    .send({status:true, data:updateDrop})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถอัพเดทได้"})
        }
    }catch(err){
        return res 
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}
delend = async (req, res)=>{
    try{
        const id = req.params.id
        const deleteDrop = await dropOffs.findByIdAndDelete(id)
        if(deleteDrop){
            return res
                    .status(200)
                    .send({status:true, delete: deleteDrop})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถลบได้"})
        }
    }catch(err){
        return res 
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}
getReceive = async (req, res)=>{
    try{
        const shop_id = req.params.shop_id
        const findReceive = await dropOffs.find({shop_id:shop_id ,status:"ผู้รับ"})
                .sort({ createdAt : -1})
        if(!findReceive){
            return res
                    .status(400)
                    .send({status:false, message:"ท่านไม่มีข้อมูลผู้รับ กรุณากรอกข้อมูลและทำการเช็คราคาเพื่อบันทึกข้อมูลผู้รับก่อน"})
        }
        return res
                .status(200)
                .send({status:true, message:findReceive})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
getSender = async (req, res)=>{
    try{
        const shop_id = req.params.shop_id
        const findSender = await dropOffs.find({shop_id:shop_id ,status:"ผู้ส่ง"})
                .sort({ createdAt : -1})
        if(!findSender){
            return res
                    .status(400)
                    .send({status:false, message:"ท่านไม่มีข้อมูลผู้ส่ง กรุณากรอกข้อมูลและทำการเช็คราคาเพื่อบันทึกข้อมูลผู้รับก่อน"})
        }
        return res
                .status(200)
                .send({status:true, message:findSender})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getSenderAll = async (req, res)=>{
    try{
        const findSender = await dropOffs.find({status:"ผู้ส่ง"})
                .sort({ createdAt : -1})
        if(findSender.length == 0){
            return res
                    .status(200)
                    .send({status:true, message:[]})
        }
        return res
                .status(200)
                .send({status:true, message:findSender})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getOneSender = async (req, res)=>{
    try{
        const shop_id = req.body.shop_id
        const tel = req.body.tel
        const findShop = await shopPartner.findOne({_id:shop_id})
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านค้าของท่านได้"})
            }
        let shop_number = findShop.shop_number
        const findOneSender = await dropOffs.findOne({tel:tel, shop_id:shop_number ,status:"ผู้ส่ง"})
            if(!findOneSender){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่มีข้อมูลผู้ส่ง กรุณากรอกข้อมูลและทำการเช็คราคาเพื่อบันทึกข้อมูลผู้รับก่อน"})
            }
        return res
                .status(200)
                .send({status:true, data:findOneSender})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
editBookbank = async (req, res)=>{
    try{
        const aka = req.body.aka
        const name = req.body.name
        const card_flash = req.body.card_flash
        const code = req.body.code
        const aka_best = req.body.aka_best
        const name_best = req.body.name_best
        const card_best = req.body.card_best
        const id = req.params.id

        // Function to check if a string contains only alphabetic characters
        function isAlphabetic(str) {
            return /^[A-Za-z\u0E00-\u0E7F\s]+$/.test(str);
        }

        //เช็คตัวเลขว่ามีตัวอักษรอยู่หรือเปล่า
        function isNumeric(str) {
            return /^[0-9]+$/.test(str);
        }
        
        if(name){
            if (!isAlphabetic(name)) {
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกชื่อบัญชีเป็นตัวอักษร(FlashPay)"});
            }
            if(!isNumeric(card_flash)){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกหมายเลขบัญชีเป็นตัวเลข(FlashPay)"});
            }
        }
        if(name_best){
            if (!isAlphabetic(name_best)) {
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกชื่อบัญชีเป็นตัวอักษร(BEST)"});
            }
            if (!isNumeric(card_best)) {
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกหมายเลขบัญชีเป็นตัวเลข(BEST)"});
            }
        }

        
        const fixBookbank = await dropOffs.findOneAndUpdate(
            {
                _id:id
            },
            {
                'flash_pay.aka':aka,
                'flash_pay.name':name,
                'flash_pay.card_number':card_flash,
                'best.code':code,
                'best.aka':aka_best,
                'best.name':name_best,
                'best.card_number':card_best,
            },
            {new:true}
        )
            if(!fixBookbank){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถแก้ไขได้"})
            }
        return res
                .status(200)
                .send({status:true, data:fixBookbank})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, create, update, delend, getReceive, getSender, editBookbank, getOneSender, getSenderAll}