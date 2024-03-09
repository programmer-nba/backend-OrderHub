const { bankRecord } = require("../../Models/bank/bank.record")

getAll = async (req, res)=>{
    try{
        const findAll = await bankRecord.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถดูข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

createBank = async (req, res)=>{
    try{
        const aka = req.body.aka
        const name = req.body.name
        const findDuplicate = await bankRecord.findOne(
            {
                aka:aka
            }
        )
            if(findDuplicate){
                return res
                        .status(400)
                        .send({status:false, message:"มีธนาคารนี้ในระบบแล้ว"})
            }
        const create = await bankRecord.create({
            aka:aka,
            name:name
        })
            if(!create){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างข้อมูลธนาคารได้"})
            }
        return res
                .status(200)
                .send({status:true, data:create})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getByAKA = async (req, res)=>{
    try{
        const aka = req.params.aka
        const findAka = await bankRecord.findOne({aka:aka})
            if(!findAka){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAka})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delendByAKA = async (req, res)=>{
    try{
        const id = req.params.id
        const findId = await bankRecord.findOneAndDelete({_id:id})
            if(!findId){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการลบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findId})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

updateBank = async (req, res)=>{
    try{
        const id = req.params.id
        const aka = req.body.aka
        const name = req.body.name
        const findId = await bankRecord.findOneAndUpdate(
            {_id:id},
            {
                aka:aka,
                name:name
            },
            {new:true})
            if(!findId){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการอัพเดท"})
            }
        return res
                .status(200)
                .send({status:true, data:findId})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, createBank, getByAKA, delendByAKA, updateBank }