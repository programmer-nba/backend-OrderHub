const { orderAll } = require("../../../Models/Delivery/order_all");
const { Partner } = require("../../../Models/partner");
const { profitTemplate } = require("../../../Models/profit/profit.template");
const { cancelOrderAll } = require("../J&T/J&T.controller");
const { cancelOrderAllBest } = require("../BEST_EXPRESS/best.controller");
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const e = require("cors");

dayjs.extend(utc);
dayjs.extend(timezone);

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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0, profitAll:0, day_end:0, bill_status:0})
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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
                    },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
        }else if(express){
            const findOrderID = await orderAll.find(
                {
                    express:express,
                    $and: [
                        { day: { $gte: dayStart } },
                        { day: { $lte: dayEnd } }
                    ]
                },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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
                    $and: [
                        { day: { $gte: dayStart } },
                        { day: { $lte: dayEnd } }
                    ]
                },{type:0, pdfStream:0, day_sign:0, day_cancel:0, user_cancel:0,profitAll:0, day_end:0, bill_status:0})
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

labelNumber = async(req, res)=>{
    try{
        const tracking_code = req.body.tracking_code
        const bulkTracking = tracking_code.map(item =>({
            updateOne: {
                filter: { tracking_code: item},
                update: { 
                    $inc: {
                        label_print: +1
                    }
                }
            }
        }))
        const bulkWrite = await orderAll.bulkWrite(bulkTracking)
        return res
                .status(200)
                .send({status:true, data:bulkWrite})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
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
        }).sort({ day: -1 });
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
        },{tracking_code: 1, express: 1})
            if(txlogisticid.length == 0){
                return res
                        .status(200)
                        .send({status:true, data:[]})
            }
        console.log(txlogisticid.length)
        let all = []
        let dataJT = []
        let dataBEST = []
        let newData = await Promise.all(txlogisticid.map(async item => {
            // console.log(item.express)
            if(item.express == "J&T"){
                let cancel = await cancelOrderAll(item.tracking_code);
                // console.log(cancel)
                dataJT.push(cancel)
            }else if(item.express == "BEST"){
                let cancel = await cancelOrderAllBest(item.tracking_code);
                dataBEST.push(cancel)
            }
        }));
        all.concat(dataJT, dataBEST)
        // console.log(newData)
        return res
                .status(200)
                .send({status:true, data:all})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

// ตั้งเวลาให้รันฟังก์ชันทุกวันเวลา 10:00 (เวลาประเทศไทย)
cron.schedule('0 10 * * *', async () => {
    const now = dayjs().tz("Asia/Bangkok");
    const dayEnd = now.subtract(1, 'day').format('YYYY-MM-DD');
    console.log(dayEnd)
    const req = { body: { dayEnd: dayEnd } }; // สร้าง request mock object
    const res = {
        status: (code) => ({
            send: (response) => console.log('Response:', response)
        })
    }; // สร้าง response mock object

    await cancelAll(req, res);
    console.log('cancelAll function executed at 10:00 AM Bangkok time');
}, {
    scheduled: true,
    timezone: "Asia/Bangkok"
});

pickOrder = async(req, res)=>{
    try{
        let day_start = req.body.day_start
        let day_end = req.body.day_end
        let partner_id = req.body.partner_id
        let status = req.body.status
        let findPartner
        if(partner_id){
            if(status == 'day_create_order'){
                findPartner = await orderAll.find({
                    owner_id: partner_id,
                    day: { 
                        $gte: day_start, 
                        $lte: day_end 
                    } 
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(1)"})
                    }
            }else if(status == 'day_pick_order'){
                day_start = dayjs(day_start).startOf('day').format('YYYY-MM-DD HH:mm:ss'); // "2024-06-11 00:00:00"
                day_end = dayjs(day_end).endOf('day').format('YYYY-MM-DD HH:mm:ss'); // "2024-06-11 23:59:59"

                findPartner = await orderAll.find({
                    owner_id: partner_id,
                    day_pick: { 
                        $gte: day_start, 
                        $lte: day_end 
                    }
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(2)"})
                    }
            }else if(status == 'order_booking'){
                findPartner = await orderAll.find({
                    owner_id: partner_id,
                    day: { 
                        $gte: day_start, 
                        $lte: day_end 
                    },
                    order_status:"booking"
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(3)"})
                    }
            }else if(status == 'day_sign_back'){
                findPartner = await orderAll.find({
                    owner_id: partner_id,
                    order_status:"เซ็นรับพัสดุตีกลับ",
                    day_sign: { 
                        $gte: day_start, 
                        $lte: day_end 
                    }
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(4)"})
                    }
            }
        }else{
            if(status == 'day_create_order'){
                findPartner = await orderAll.find({
                    day: { 
                        $gte: day_start, 
                        $lte: day_end 
                    } 
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(1)"})
                    }
            }else if(status == 'day_pick_order'){
                day_start = dayjs(day_start).startOf('day').format('YYYY-MM-DD HH:mm:ss'); // "2024-06-11 00:00:00"
                day_end = dayjs(day_end).endOf('day').format('YYYY-MM-DD HH:mm:ss'); // "2024-06-11 23:59:59"

                findPartner = await orderAll.find({
                    day_pick: { 
                        $gte: day_start, 
                        $lte: day_end 
                    }
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(2)"})
                    }
            }else if(status == 'order_booking'){
                findPartner = await orderAll.find({
                    order_status:"booking",
                    day: { 
                        $gte: day_start, 
                        $lte: day_end 
                    }
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(3)"})
                    }
            }else if(status == 'day_sign_back'){
                findPartner = await orderAll.find({
                    order_status:"เซ็นรับพัสดุตีกลับ",
                    day_sign: { 
                        $gte: day_start, 
                        $lte: day_end 
                    }
                },{
                    owner_id:1,
                    orderer_id:1,
                    role:1,
                    mailno:1,
                    to:1,
                    price:1,
                    cost_hub:1,
                    cod_amount:1,
                    order_status:1,
                    day:1,
                    day_pick:1,
                    day_sign:1
                }).exec()
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[], message:"ไม่พบข้อมูล(4)"})
                    }
            }
        }
        return res
                .status(200)
                .send({status:true, data:findPartner})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

selectOrder = async(req, res)=>{
    try{
        const orderid = req.body.orderid
        const findMe = await orderAll.find(
            {
                 tracking_code: { $in: orderid }
            },{
                user_cancel:0, day_cancel:0, owner_id:0, orderer_id:0, role:0, bill_status:0,
                profitAll:0, day_end:0, day_pick:0, day_sign:0
            })
            if(findMe.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีรายการสินค้าของท่าน"})
            }
        return res
                .status(200)
                .send({status:true, data:findMe})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
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
    getCode, getCodeOrder, getOrderByDate, getOrderStatus, getOrderCancel, cancelAll, getOrderBySearch, pickOrder, selectOrder, labelNumber }