const { Partner } = require("../../Models/partner");
const { subRole } = require("../../Models/sub_role/sub.role");

exports.create = async(req, res)=>{
    try{
        const {sub_role, detail} = req.body
            if(!sub_role){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกข้อมูล"})
            }
        const createSubRole = await subRole.create({...req.body})
            if(!createSubRole){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:createSubRole})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getAll = async(req, res)=>{
    try{
        const findAll = await subRole.find()
            if(findAll.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getById = async(req, res)=>{
    try{
        const id = req.params.id
        const find = await subRole.findById(id)
            if(!find){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.update = async(req, res)=>{
    try{
        const id = req.params.id
        const update = await subRole.findByIdAndUpdate(id, {...req.body})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถแก้ไขข้อมูลได้"})
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

exports.delend = async(req, res)=>{
    try{
        const id = req.params.id
        const del = await subRole.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:del})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getByRole = async(req, res)=>{
    try{
        const sub_role = req.body.sub_role
        const find = await Partner.find(
            {
                sub_role:{
                    $elemMatch:{ role: sub_role }
                }
            })
            if(find.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}