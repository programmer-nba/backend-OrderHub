const { logOrder } = require("../../Models/logs_order");

create = async (req, res)=>{
    try{
        console.log(req.body)
        const createLogs = await logOrder.create({...req.body})
            if(!createLogs){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้าง Logs ได้"})
            }
        return res
                .status(200)
                .send({status:true, data:createLogs})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

updateLogOrder = async (req, res)=>{
    try{
        const id = req.params.id
        const update = await logOrder.findOneAndUpdate(
            {
                _id:id
            },{
                ...req.body
            },{new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถแก้ไขเอกสารได้"})
            }
        return res
                .status(200)
                .send({status:true, data:update})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

delend = async(req, res)=>{
    try{
        const id = req.params.id
        const del = await logOrder.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"ลบสำเร็จ", data:del})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getById = async (req, res)=>{
    try{
        const id = req.params.id
        const findPartner = await logOrder.findOne({_id:id})
            if(!findPartner){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาพาร์ทเนอร์เจอ"})
            }
        return res
                .status(200)
                .send({status:true, data:findPartner})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getAll = async (req, res)=>{
    try{
        const find = await logOrder.find()
            if(find.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบรายการ logs"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

module.exports = { create, updateLogOrder, getById, getAll, delend }