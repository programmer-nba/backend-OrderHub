const { insuredExpress } = require("../../../Models/Delivery/insured/insured");

create = async(req, res)=>{
    try{
        const express = req.body.express
        const product_value = req.body.product_value
        const createExpress = await insuredExpress.create({
            express:express,
            product_value:product_value
        })
            if(!createExpress){
                return res
                        .status(404)
                        .send({status:false,message:"ไม่สามารถเพิ่มข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:createExpress})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

update = async(req, res)=>{
    try{
        const id = req.params.id
        const { id_product, express, valueStart, valueEnd, insurance_fee } = req.body
        
        const findId = await insuredExpress.findOneAndUpdate(
            {
                _id:id
            },
            {
                express:express,
                $set: {
                    'product_value.$[element].valueStart': valueStart,
                    'product_value.$[element].valueEnd': valueEnd,
                    'product_value.$[element].insurance_fee': insurance_fee,
                }
            },
            {
                arrayFilters: [{ 'element._id': id_product }], // ใช้ 'element.aka' เพื่อค้นหาตาม shop
                new: true
            })
        return res
                .status(200)
                .send({status:true, data:findId})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

push_value = async(req, res)=>{
    try{
        const id = req.params.id
        const { valueStart, valueEnd, insurance_fee } = req.body
        const pushData = await insuredExpress.findOneAndUpdate(
            {
                _id:id
            },
            {
                $push:{
                    product_value: {
                        valueStart: valueStart,
                        valueEnd: valueEnd,
                        insurance_fee: insurance_fee
                    }
                }
            },{new:true}
        )
        return res
                .status(200)
                .send({status:true, data:pushData})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delend = async(req, res)=>{
    try{
        const id = req.params.id
        const del = await insuredExpress.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบได้"})
            }
        return res
                .status(200)
                .send({
                    status:true, 
                    message:"ลบข้อมูลสำเร็จ",
                    data:del
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

del_value = async(req, res)=>{
    try{
        const id = req.params.id
        const id_value = req.body.id_value
        
        const findDel = await insuredExpress.findOneAndUpdate(
            {
                _id:id
            },{
                $pull: {
                    product_value: { _id: id_value }
                }
            },{new: true})
            if(!findDel){
                return res
                        .status(400)
                        .send({
                            status:false, 
                            message:"ลบข้อมูลไม่สำเร็จ"
                        })
            }
        return res
                .status(400)
                .send({
                    status:false, 
                    message:"ลบข้อมูลสำเร็จ",
                    data:findDel
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getAll = async(req, res)=>{
    try{
        const findAll = await insuredExpress.find()
            if(!findAll){
                return res
                        .status(400)
                        .send({status:false,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getExpress = async(req, res)=>{
    try{
        const id = req.params.id
        const findId = await insuredExpress.findOne({_id:id})
            if(!findId){
                return res
                        .status(400)
                        .send({status:false,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findId})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { create, update, push_value, delend, del_value, getAll, getExpress }