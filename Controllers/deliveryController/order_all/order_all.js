const { orderAll } = require("../../../Models/Delivery/order_all");

getAll = async(req, res)=>{
    try{
        const findAll = await orderAll.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false, message:"ค้นหาเอกสารไม่พบ"})
            }
        return res  
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getByIdUser = async(req, res)=>{
    try{
        const id = req.decoded.userid
        const shop = req.params.shop_number
        const findID = await orderAll.find({
            ID:id,
            shop_number:shop, 
            bill_status:"พักบิล"})
            if(!findID){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารพบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findID})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getByTrackingCode = async(req, res)=>{
    try{
        const tracking_code = req.params.tracking_code
        const findTracking = await orderAll.findOne({tracking_code:tracking_code})
            if(!findTracking){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารพบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findTracking})
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
        const del = await orderAll.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบเอกสารที่ต้องการลบ"})
            }
        return res
                .status(200)
                .send({
                    status:true, 
                    message:"ทำการลบข้อมูลเรียบร้อย", 
                    data: del
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

updateBillStatus = async(req, res)=>{
    try{
        const data = []
        const tracking_code = req.body.tracking_code
        for (const tc of tracking_code){
            const updateStatus = await orderAll.findOneAndUpdate(
                {tracking_code:tc},
                {bill_status: "สร้างบิลแล้ว"},
                {new:true}
            )
            if(!updateStatus){
                return res
                        .status(404)
                        .send({status:false, message:`ไม่สามารถอัพเดทข้อมูลสถานะบิล ${tc} ได้`})
            }
            data.push(updateStatus)
        }
        return res
                .status(200)
                .send({status:true , data:data})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getOrderMeAll = async(req, res)=>{
    try{
        const owner_id = req.body.owner_id
        const express = req.body.express
        const shop_id = req.body.shop_id
        if(shop_id){
            if(express){
                const findOrder = await orderAll.find(
                    {
                        shop_id:shop_id,
                        express:express
                    })
                    if(findOrder.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่มีออเดอร์ของท่านในระบบ"})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrder})
            }else{
                const findOrder = await orderAll.find(
                    {
                        shop_id:shop_id,
                    })
                    if(findOrder.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่มีออเดอร์ของท่านในระบบ"})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrder})
            }
        }else{
            if(express){
                const findOrderID = await orderAll.find(
                    {
                        owner_id:owner_id,
                        express:express
                    })
                    if(findOrderID.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่มีออเดอร์ของท่านในระบบ"})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }else{
                const findOrderID = await orderAll.find(
                    {
                        owner_id:owner_id,

                    })
                    if(findOrderID.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่มีออเดอร์ของท่านในระบบ"})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }
        }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
module.exports = { getAll, getByIdUser, getByTrackingCode, delend, updateBillStatus, getOrderMeAll }