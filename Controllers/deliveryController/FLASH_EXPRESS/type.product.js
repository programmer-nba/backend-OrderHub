const { typeProduct } = require("../../../Models/Delivery/flash_express/type_product");

createType = async (req, res)=>{
    try{
        const code = req.body.code
        const mean = req.body.mean
        const create = await typeProduct.create({code:code,mean:mean})
            if(!create){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างได้"})
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

getAll = async(req, res)=>{
    try{
        const findAll = await typeProduct.find()
            if(!findAll){
                return res
                        .status(400)
                        .send({status:false, message:"การค้นหาล้มเหลว"})
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

edit = async(req, res)=>{
    try{
        const code = req.params.code
        const editType = await typeProduct.findOneAndUpdate(
            {code:code},
            {
                code:code,
                mean:mean
            },{new:true})
        if(!editType){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหา code/แก้ไขได้"})
        }
        return res
                .status(200)
                .send({status:true, data:editType})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delend = async(req, res)=>{
    try{
        const code = req.params.code
        const delType = await typeProduct.findOneAndDelete({code:code})
        if(!delType){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถลบได้"})
        }
        return res
                .status(200)
                .send({status:true, data:delType})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { createType, getAll, edit, delend }