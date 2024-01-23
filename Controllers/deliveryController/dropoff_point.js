const { dropOffs, validate} = require("../../Models/Delivery/dropOff");
const { Partner } = require("../../Models/partner");

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
module.exports = { getAll, create, update, delend}