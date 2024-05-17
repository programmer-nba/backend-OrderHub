const { orderAll } = require("../../../Models/Delivery/order_all");
const { profitTemplate } = require("../../../Models/profit/profit.template");
const { cancelOrderAll } = require("../J&T/J&T.controller");

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
        }else if(orderer_id){
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
        }else{
            if(express){
                const findOrderID = await orderAll.find(
                    {
                        express:express
                    })
                    if(findOrderID.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีออเดอร์ของท่านในระบบ"})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }else{
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลที่ท่านต้องการ"})
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
        // console.log(findOrder)
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
        const orderer = req.body.orderer
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
                                .status(200)
                                .send({status:true, data:[]})
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
                                .status(200)
                                .send({status:true, data:[]})
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
                                .status(200)
                                .send({status:true, data:[]})
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
                                .status(200)
                                .send({status:true, data:[]})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }
        }else if(orderer){
            if(express){
                const findOrderID = await orderAll.find(
                    {
                        orderer_id:orderer,
                        express:express,
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
                    })
                    // console.log(findOrderID)
                    if(findOrderID.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[]})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }else{
                const findOrderID = await orderAll.find(
                    {
                        orderer_id:orderer,
                        $and: [
                            { day: { $gte: dayStart } },
                            { day: { $lte: dayEnd } }
                        ]
                    })
                    // console.log(findOrderID)
                    if(findOrderID.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[]})
                    }
                    return res
                            .status(200)
                            .send({status:true, data:findOrderID})
            }
        }else{
            const findOrderID = await orderAll.find(
                {
                    $and: [
                        { day: { $gte: dayStart } },
                        { day: { $lte: dayEnd } }
                    ]
                })
                // console.log(findOrderID)
                if(findOrderID.length == 0){
                    return res
                            .status(200)
                            .send({status:true, data:[]})
                }
                return res
                        .status(200)
                        .send({status:true, data:findOrderID})
        }

    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getOrderStatus = async(req, res)=>{
    try{
        const findOrder = await orderAll.find({
            $or: [
                { order_status: "booking" },
                { order_status: "รับพัสดุแล้ว" },
                { order_status: "ระหว่างการจัดส่ง" },
                { order_status: "พัสดุมีปัญหา" },
                { order_status: "พัสดุตีกลับ" },
              ]
        })
            if(findOrder.length == 0){
                return res
                        .status(200)
                        .send({status:true, data:[]})
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

getOrderBySearch = async(req, res)=>{
    try{
        const order = req.body.order
        const findOrder = await orderAll.find(
            {
                $or:[
                    {tracking_code: order},
                    {mailno: order},
                    {"to.tel": order},
                    {print_code: order}
                ]
            })
        // console.log(findOrder)
            if(findOrder.length == 0){
                return res
                        .status(404)
                        .send({status:false, data:[]})
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

getOrderCancel = async(req, res)=>{
    try{
        const dayEnd = req.body.dayEnd
        const findDayEnd = await orderAll.find({
            status:"booking",
            day_end: { $lte: dayEnd }
        })
        if(findDayEnd.length == 0){
            return res
                    .status(200)
                    .send({status:true, data:[]})
        }
        return res
                .status(200)
                .send({status:true, data:findDayEnd})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

cancelAll = async(req, res)=>{
    try{
        const dayEnd = req.body.dayEnd
        const txlogisticid = await orderAll.find({
            order_status:"booking",
            day_end: { $lte: dayEnd }
        })
            if(txlogisticid.length == 0){
                return res
                        .status(200)
                        .send({status:true, data:[]})
            }
        console.log(txlogisticid.length)
        // return res
        //         .status(200)
        //         .send({status:false, message:txlogisticid})
        let newData = await Promise.all(txlogisticid.map(async item => {
            // console.log(item.express)
            if(item.express == "J&T"){
                let cancel = await cancelOrderAll(item.tracking_code);
                // console.log(cancel)
                return cancel
            }
        }));

        // console.log(newData)
        return res
                .status(200)
                .send({status:true, data:newData})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

pickOrder = async(req, res)=>{
    try{
        const orderid = req.body.orderid
        const newData = await Promise.all(orderid.map(async item => {
            const findOrder = await orderAll.findOne({tracking_code:item})
            // console.log(findOrder)
                if(!findOrder){
                    return `${item} ไม่พบในฐานข้อมูล`
                }
            let newMailno = {
                mailno: findOrder.mailno,
                amount: findOrder.cut_partner
            }
            return newMailno
        }))
        const totalProfit = newData.reduce((total, document) => {
                return total + document.amount;
        }, 0);
        return res
                .status(200)
                .send({status:true, amountAll:parseFloat(totalProfit).toFixed(2), data:newData})
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

module.exports = { getAll, getByIdUser, getByTrackingCode, delend, updateBillStatus, getOrderMeAll, 
    getCode, getCodeOrder, getOrderByDate, getOrderStatus, getOrderCancel, cancelAll, getOrderBySearch, pickOrder }