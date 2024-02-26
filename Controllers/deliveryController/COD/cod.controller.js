const { codExpress } = require("../../../Models/COD/cod.model");

createCOD = async(req, res)=>{
    try{
        const express = req.body.express
        const percent = req.body.percent
        const create = await codExpress.create(
            {
                express: express,
                percent: percent
            })
        if(!create){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถสร้าง cod ได้"})
        }
        return res
                .status(200)
                .send({status:true, data: create})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getAll = async (req, res)=>{
    try{
        const findAll = await codExpress.find()
        if(!findAll){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
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

editCOD = async (req, res)=>{
    try{
        const id = req.params.id
        const express = req.body.express
        const percent = req.body.percent
        const update = await codExpress.findOneAndUpdate(
            {_id:id},
            {
                express: express,
                percent: percent
            },{new:true})
        if(!update){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถอัพเดทข้อมูลได้"})
        }
        return res
                .status(200)
                .send({status:true, data: update})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delend = async (req, res)=>{
    try{
        const id = req.params.id
        const del = await codExpress.findOneAndDelete({_id:id})
        if(!del){
            return res
                    .status(400)
                    .send({status:true, message:"ไม่สามารถลบ หรือ หาข้อมูลที่ต้องการลบไม่เจอ"})
        }
        return res
                .status(200)
                .send({status:true, data:del})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { createCOD, getAll, editCOD, delend }