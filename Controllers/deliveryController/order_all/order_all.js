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
        const orderer_id = req.body.orderer_id
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
        }else if(owner_id){
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
        }else{
            if(express){
                const findOrderID = await orderAll.find(
                    {
                        orderer_id:orderer_id,
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
                        orderer_id:orderer_id,

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

getCode = async(req, res)=>{
    try{
        const tracking_code = req.body.tracking_code
        const number = await invoiceNumber()
        console.log(number)
        const mapTracking = tracking_code.map(item =>({
            updateOne: {
                filter: { tracking_code: item },
                update: { 
                    $set: {
                        print_code:number
                    }
                }
            }
        }))
        
        const bulkWrite = await orderAll.bulkWrite(mapTracking)
            if(!bulkWrite){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้าง bulkWrite ได้"})
            }

        return res
                .status(200)
                .send({status:true, code:number ,data:bulkWrite})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getCodeOrder = async(req, res)=>{
    try{
        const print_code = req.params.print_code
        const findOrder = await orderAll.find({print_code:print_code})
            if(findOrder.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findOrder})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getOrderByDate = async(req, res)=>{
    try{
        const dayStart = req.body.dayStart
        const dayEnd = req.body.dayEnd
        const express = req.body.express
        const shop_id = req.body.shop_id
        const partner_id = req.body.partner_id
        // console.log(dayStart, dayEnd)
        if(shop_id){
            if(express){
                const findOrder = await orderAll.find(
                    {
                        shop_id:shop_id,
                        express:express,
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
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
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
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
        }else if(partner_id){
            if(express){
                const findOrderID = await orderAll.find(
                    {
                        owner_id:partner_id,
                        express:express,
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
                    })
                    // console.log(findOrderID)
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
                        owner_id:partner_id,
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
                    })
                    // console.log(findOrderID)
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
async function invoiceNumber() {
    try{
        let random = Math.floor(Math.random() * 1000000)
        const combinedData = random;
        const findInvoice = await orderAll.find({print_code:combinedData})

            while (findInvoice && findInvoice.length > 0) {
                // สุ่ม random ใหม่
                random = Math.floor(Math.random() * 1000000);
                combinedData = `JNT`+ data + random;

                // เช็คใหม่
                findInvoice = await orderAll.find({print_code:combinedData});
            }
        // console.log(combinedData)
        return combinedData;
    }catch(err){
        console.log(err)
    }
}

module.exports = { getAll, getByIdUser, getByTrackingCode, delend, updateBillStatus, getOrderMeAll, getCode, getCodeOrder, getOrderByDate }