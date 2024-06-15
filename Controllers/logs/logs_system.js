const { logSystem } = require("../../Models/logs");
const { Partner } = require("../../Models/partner");

create = async(req, res) => {
    try{
        const create = await logSystem.create(req.body);
            if(!create){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
            }
        return res
                .status(200)
                .send({status:true, data:create})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

update = async(req, res) =>{
    try{
        const id = req.params.id
        const update = await logSystem.findByIdAndUpdate(id, req.body, {new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:update})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getAll = async(req, res)=>{
    try{
        const getAll = await logSystem.find()
            if(getAll.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถดึงข้อมูลทั้งหมดได้"})
            }
        return res
                .status(200)
                .send({status:true, data:getAll})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getById = async(req, res)=>{
    try{
        const id = req.params.id
        const getById = await logSystem.findById(id)
            if(!getById){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถดึงข้อมูลเอกสารได้"})
            }
        return res
                .status(200)
                .send({status:true, data:getById})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getByIdPartner = async(req, res)=>{
    try{
        const id = req.params.id
        const getById = await logSystem.find({id:id})
            if(getById.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถดึงข้อมูลเอกสารได้"})
            }
        return res
                .status(200)
                .send({status:true, data:getById})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

delend = async(req, res)=>{
    try{
        const id = req.params.id
        const del = await logSystem.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบเอกสารได้"})
            }
        return res
                .status(200)
                .send({status:true, data:del})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

module.exports = {create, update, getAll, getById, getByIdPartner, delend}