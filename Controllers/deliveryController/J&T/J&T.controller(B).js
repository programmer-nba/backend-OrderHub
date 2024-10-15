const { generateJT } = require("./sign/generate.signJ&T(B)")
const { jntOrder } = require("../../../Models/Delivery/J&T/orderJT");
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const axios = require('axios');
const { priceWeight } = require("../../../Models/Delivery/weight/priceWeight");
const { Partner } = require("../../../Models/partner");
const { shopPartner } = require("../../../Models/shop/shop_partner");
const { PercentCourier } = require("../../../Models/Delivery/ship_pop/percent");
const { codExpress } = require("../../../Models/COD/cod.model");
const { historyWalletShop } = require("../../../Models/shop/shop_history");
const { historyWallet } = require("../../../Models/topUp/history_topup");
const { profitIce } = require("../../../Models/profit/profit.ice");
const { profitPartner } = require("../../../Models/profit/profit.partner");
const { dropOffs } = require("../../../Models/Delivery/dropOff");
const { profitTemplate } = require("../../../Models/profit/profit.template");
const { jntRemoteArea } = require("../../../Models/remote_area/JNT.area");
const { orderAll } = require("../../../Models/Delivery/order_all");
const { weightAll } = require("../../../Models/Delivery/weight/weight.all.express");
const { insuredExpress } = require("../../../Models/Delivery/insured/insured");
const { priceBase } = require("../../../Models/Delivery/weight/priceBase.express");
const { bangkokMetropolitan } = require("../../../Models/postcal_bangkok/postcal.bangkok");
const { Admin } = require("../../../Models/admin");
const { codPercent } = require("../../../Models/COD/cod.shop.model");
const { postalThailand } = require("../../../Models/postal.thailand/postal.thai.model");
const { decrypt } = require("../../../functions/encodeCrypto");
const { logSystem } = require("../../../Models/logs");
const { logOrder } = require("../../../Models/logs_order");
const cron = require('node-cron');
dayjs.extend(utc);
dayjs.extend(timezone);

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

let currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
function updateRealTime (){
    currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 1 นาที
setInterval(updateRealTime, 60000);

let apiUrl = process.env.JT_URL_B
let ecom_id = process.env.ECOMPANY_ID_B
let customer_id = process.env.CUSTOMER_ID_B
let count_number = 1
let count_tracking = 1
let err_number = 0

createOrder = async (req, res)=>{
    try{
        // console.log(count_number)
        // if(count_number == 11){
        //     // ตอบกลับด้วย CORS error โดยการลบ headers ที่ใช้ใน CORS ออก
        //     count_number = 0
        //     err_number = 1
        //     res.setHeader('Access-Control-Allow-Origin', ''); // ไม่ให้ค่า origin ถูกต้อง
        //     return res.status(403).json({ error: "CORS blocked after reaching 31 orders" }); // ส่ง status 403
        // }
        // if(err_number >= 1){
        //     if(err_number == 3){
        //         err_number = 0
        //         throw new Error("ERROR CATCH 500");
        //     }
        //     err_number += 1
        // }
        const id = req.decoded.userid
        const role = req.decoded.role
        const data = req.body
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const remark = req.body.remark
        const packing_price = req.body.packing_price
        const declared_value = req.body.declared_value
        const insuranceFee = req.body.insuranceFee
        const cost_base = req.body.cost_base
        const profitAll = req.body.profitAll
        const print_code = req.body.print_code
        const price_remote_area = req.body.price_remote_area //ราคาพื้นที่ห่างไกล J&T(B) ไม่มีบอกน้าา
        let cut = req.body.cut_partner
        const cut_partner = parseFloat(cut.toFixed(2))
        const shop = req.body.shop_number
        const weight = data.parcel.weight //หน่วยเป็น kg อยู่แล้วไม่ต้องแก้ไข
        // txlogisticid = "JNT2024043066453"
        const findCredit = await shopPartner.findOne({shop_number:shop})
            if(!findCredit){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบร้านค้าของท่าน"})
            }
        if(findCredit.credit < cut_partner){
            return res
                    .status(400)
                    .send({status:false, message:`Credits ปัจจุบันของร้านค้า ${findCredit.shop_name} ไม่เพียงพอต่อการส่งสินค้า`})
        }
        const txlogisticid = await invoiceNumber(currentTime); //เข้า function gen หมายเลขรายการ
            // console.log('invoice : '+txlogisticid);
        const invoice = await invoiceJNT(currentTime)
        const fromData = {
            "logistics_interface" :{
                "actiontype": "add",
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "ordertype": "1",
                "servicetype": "6",
                "deliverytype": "1",
                "sender":{
                    "name": data.from.name,
                    "postcode": data.from.postcode,
                    "mobile": data.from.tel, //required 
                    "city": data.from.province,
                    "area": data.from.state,
                    "address": data.from.address + " ตำบล " + data.from.district
                },
                "receiver":{
                    "name": data.to.name,
                    "postcode": data.to.postcode,
                    "mobile": data.to.tel, //required 
                    "city": data.to.province,
                    "area": data.to.state,
                    "address": data.to.address + " ตำบล " + data.to.district
                },
                "createordertime": dayTime,
                "sendstarttime": dayTime,
                "sendendtime": dayTime,
                "paytype": "1",
                "weight": weight,
                "length": data.parcel.length,
                "width": data.parcel.width,
                "height": data.parcel.height,
                "isinsured": "1",
                "remark": remark
                // "offerfee": "2000"
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        if(cod_amount > 0){
            fromData.logistics_interface.itemsvalue = cod_amount
            // console.log(cod_amount)
        }

         //ผู้ส่ง
        const senderTel = data.from.tel;
         //  console.log(senderTel)
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
            
        const updatedDocument = await dropOffs.findOne(filterSender);
             if(!updatedDocument){
                 return res 
                         .status(404)
                         .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
             }

        // console.log(updatedDocument)
        const newData = await generateJT(fromData)
            // console.log(newData)
        const response = await axios.post(`${apiUrl}/order/create`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถส่งคำร้องขอไปยัง J&T(B) ได้"})
            }else if(response.data.responseitems[0].reason == "S10"){
                return res
                        .status(404)
                        .send({status:false, message:"หมายเลขรหัสการสั่งซื้อเกิดการซ้ำกันกรุณากดสั่งอีกครั้ง"})
            }else if(response.data.responseitems[0].reason == "B0101"){
                return res
                        .status(404)
                        .send({status:false, message:"ผู้ส่งกรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง(10 หลัก) และ ห้ามตั้งเบอร์ขึ้นต้นด้วย 00 หรือ 01"})
            }else if(response.data.responseitems[0].success == 'false'){
                return res
                        .status(404)
                        .send({status:false, message:`ไม่สามารถสร้างออเดอร์ได้เนื่องจากมีความผิดพลาด กรุณาตรวจสอบ น้ำหนัก,ที่อยู่ของ ผู้รับ, ผู้ส่ง และ เบอร์โทร ว่าท่านได้กรอกถูกต้องหรือไม่(${response.data.responseitems[0].reason})`})
            }
        const new_data = response.data.responseitems[0]

        let allProfit = []
        let profit_ice
        let profit_p
        let profitP
        let createTemplate
        let proficICE
        // if(cod_amount == 0){
            const findShop = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -cut_partner } },
                {new:true})
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }

            // console.log(findShop.credit)
            let credit = parseFloat(findShop.credit.toFixed(2))
            const plus = credit + cut_partner
            let plusFloat = parseFloat(plus.toFixed(2))
            const history = {
                    shop_id: findShop._id,
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    mailno: new_data.mailno,
                    amount: cut_partner,
                    before: plusFloat,
                    after: credit,
                    type: 'J&T(B)',
                    remark: "ขนส่งสินค้า"
                }
            // console.log(history)
            const historyShop = await historyWalletShop.create(history)
                if(!historyShop){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    mailno: new_data.mailno,
                    cost_price: profitAll[0].cost_price,
                    cost: profitAll[0].cost,
                    profitCost: profitAll[0].profit,
                    profitCOD: profitAll[0].cod_profit,
                    packing_price: packing_price,
                    profit: profitAll[0].total + packing_price,
                    express: 'J&T(B)',
            }
                if(profitAll[0].cod_profit == 0){
                    pf.type = 'ทั่วไป'
                }else{
                    pf.type = 'COD'
                }
            let profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }
            // console.log(id)
            // console.log(profitAll)  
            let profitTotalAll = profitAll[0].total + packing_price
            let profitTotal = parseFloat(profitTotalAll.toFixed(2))
            let idReal
                if(role == 'partner'){
                    idReal = id
                }else if(role == 'shop_member'){
                    idReal = req.decoded.id_ownerShop
                }
            let profitOne = await Partner.findOneAndUpdate(
                    { _id: idReal },
                    { $inc: { 
                            profit: +profitTotal,
                        } 
                    },
                    {new:true, projection: { profit: 1  }})
                    if(!profitOne){
                            return res
                                    .status(400)
                                    .send({status:false,message:"ไม่สามารถค้นหาพาร์ทเนอร์และอัพเดทข้อมูลได้"})
                    }
            // console.log(profitOne)
            allProfit.push(historyShop)
            allProfit.push(profit_partner)
            allProfit.push(profitOne)
            // console.log(profitAll)
                for (let i = 1; i < profitAll.length; i++) {
                        if(profitAll[i].id == 'ICE'){
                            const pfICE = {
                                        Orderer: id,
                                        role: role,
                                        shop_number: shop,
                                        orderid: new_data.txlogisticid,
                                        mailno: new_data.mailno,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'J&T(B)',
                                    }
                                if(profitAll[i].cod_profit == 0){
                                    pfICE.type = 'กำไรจากต้นทุน'
                                }else{
                                    pfICE.type = 'กำไรจากต้นทุน/COD'
                                }
                            profit_ice = await profitIce.create(pfICE)
                                    if(!profit_ice){
                                        return res
                                                .status(400)
                                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                                    }

                            proficICE = await Admin.findOneAndUpdate(
                                        { username:'admin' },
                                        { $inc: { profit: +profitAll[i].total } },
                                        {new:true, projection: { profit: 1 } })
                                        if(!proficICE){
                                                return res
                                                        .status(400)
                                                        .send({status:false,message:"ไม่สามารถบันทึกกำไรคุณไอซ์ได้"})
                                        }
                            allProfit.push(profit_ice)
                        }else{
                            const pf = {
                                        wallet_owner: profitAll[i].id,
                                        Orderer: id,
                                        role: role,
                                        shop_number: shop,
                                        orderid: new_data.txlogisticid,
                                        mailno: new_data.mailno,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'J&T(B)',
                                    }
                        
                                if(profitAll[i].cod_profit == 0){
                                    pf.type = 'ทั่วไป'
                                }else{
                                    pf.type = 'COD'
                                }
                            profit_p = await profitPartner.create(pf)
                                if(!profit_p){
                                    return  res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                                }
                            profitP = await Partner.findOneAndUpdate(
                                        { _id: profitAll[i].id },
                                        { 
                                            $inc: { 
                                                    profit: +profitAll[i].total,
                                                    credits: +profitAll[i].total
                                            } 
                                        },
                                        {new:true, projection: { profit: 1, credits: 1 }})
                                        if(!profitP){
                                                return res
                                                        .status(400)
                                                        .send({status:false,message:"ไม่สามารถค้นหาพาร์ทเนอร์และอัพเดทข้อมูลได้"})
                                        }
                            allProfit.push(profit_p)
                            allProfit.push(profitP)
                        }
                }

        const createOrderAll = await orderAll.create(
            {
                owner_id:findShop.partnerID,
                orderer_id:id,
                shop_id:findShop._id,
                role:role,
                tracking_code: new_data.txlogisticid,
                from:{
                    ...data.from
                },
                to:{
                    ...data.to
                },
                parcel:{
                    ...data.parcel
                },
                invoice: invoice,
                status:'booking',
                cost_hub: cost_hub,
                cost_base: cost_base,
                cod_amount:cod_amount,
                fee_cod: fee_cod,
                total: total,
                cut_partner: cut_partner,
                packing_price: packing_price,
                price_remote_area: price_remote_area,
                price: price,
                print_code: print_code,
                declared_value: declared_value,
                insuranceFee: insuranceFee,
                profitAll: profitAll,
                express: "J&T(B)",
                remark: remark,
                ...new_data //mailno อยู่ในนี้แล้ว ไม่ต้องประกาศ
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        if(cod_amount != 0){
            const pfSenderTemplate = {
                    orderid: new_data.txlogisticid,
                    owner_id: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    type: 'COD(SENDER)',
                    'template.partner_number': new_data.mailno,
                    'template.account_name':updatedDocument.flash_pay.name,
                    'template.account_number':updatedDocument.flash_pay.card_number,
                    'template.bank':updatedDocument.flash_pay.aka,
                    'template.amount':cod_amount,
                    'template.phone_number': updatedDocument.tel,
                    'template.email':updatedDocument.email,
                    status:"รอรถเข้ารับ",
                    express: "J&T(B)"
            }
            createTemplate = await profitTemplate.create(pfSenderTemplate)
                if(!createTemplate){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างรายการ COD ของผู้ส่งได้"})
                }
            allProfit.push(createTemplate)
        }
        // count_number += 1
        return res
                .status(200)
                .send({
                    status:true, 
                    res: response.data,
                    order: createOrderAll,
                    // shop: findShop,
                    // profitAll: allProfit,
                    // count_number:count_number
                })
    }catch(err){
        // console.log(err)
        count_number = 0
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

cancelOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const firstname = req.decoded.firstname
        const lastname = req.decoded.lastname
        const txlogisticid = req.body.txlogisticid
        const ip_address = req.decoded.ip_address
        const latitude = req.decoded.latitude
        const longtitude = req.decoded.longtitude
        const IP = await decrypt(ip_address)
        const LT = await decrypt(latitude)
        const LG = await decrypt(longtitude)

        const formData = {
            "logistics_interface":{
                "actiontype":"cancel",
                "eccompanyid": ecom_id,
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "reason": "EZ"
            },
            "msg_type": "ORDERCANCEL",
            "eccompanyid": ecom_id,
        }
        const findCancel = await orderAll.findOne({tracking_code:txlogisticid})
            if(!findCancel){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txlogisticid ได้"})
            }else if(findCancel.order_status == 'cancel'){
                return res
                        .status(200)
                        .send({status:true, message:"ออเดอร์นี้ถูก Cancel ไปแล้ว"})
            }
        const newData = await generateJT(formData)
            // console.log(newData)
        const response = await axios.post(`${apiUrl}/order/cancel`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถใช้ได้"})
            }
        if(response.data.responseitems[0].success == 'false'){ //S12 = Cancel order interface, Order status is GOT can not cancel order
                return res
                        .status(400)
                        .send({status:false, data:response.data, message:`ไม่สามารถทำการยกเลิกออเดอร์นี้ได้ (${response.data.responseitems[0].reason})`})
        }else{
                let refundAll = []
                let formData = {
                            ip_address: IP,
                            id: id,
                            role: role,
                            type: 'CANCEL ORDER',
                            orderer:`${firstname} ${lastname}`,
                            description: "ยูสเซอร์ยกเลิกสินค้า",
                            order:[{
                                orderid:findCancel.mailno,
                                express:"J&T(B)"
                            }],
                            latitude: LT,
                            longtitude: LG
                    }
                const createLog = await logOrder.create(formData)
                    if(!createLog){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้าง Logs ได้"})
                    }
                const findPno = await orderAll.findOneAndUpdate(
                    {tracking_code:txlogisticid},
                    {
                        order_status:"cancel",
                        day_cancel: createLog.day,
                        user_cancel:`${firstname} ${lastname}`
                    },
                    {new:true})
                    if(!findPno){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Logisticid(J&T(B)) หรืออัพเดทข้อมูลได้"})
                    }

                //SHOP Credit//
                const findShop = await shopPartner.findOneAndUpdate(
                            {_id:findPno.shop_id},
                            { $inc: { credit: +findPno.cut_partner } },
                            {new:true})
                            if(!findShop){
                                return res
                                        .status(400)
                                        .send({status:false,message:"ไม่สามารถค้นหาหรืออัพเดทร้านค้าได้"})
                                }
                    let diff = findShop.credit - findPno.cut_partner
                    let before = parseFloat(diff.toFixed(2));
                    let after = findShop.credit.toFixed(2)
                    let history = {
                                amount: findPno.cut_partner,
                                before: before,
                                after: after,
                                type: 'J&T(B)',
                                remark: "ยกเลิกขนส่งสินค้า",
                                day_cancel: createLog.day,
                                user_cancel: `${firstname} ${lastname}`
                        }
                const historyShop = await historyWalletShop.findOneAndUpdate(
                    {
                        orderid:txlogisticid,
                    },{
                        ...history
                    },{
                        new:true
                    })
                        if(!historyShop){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีหมายเลข txlogisticid ที่ท่านต้องการยกเลิก"})
                        }

                //REFUND PARTNER//
                let profitRefundTotal = findPno.profitAll[0].total + findPno.packing_price
                const profitOne = await Partner.findOneAndUpdate(
                        { _id: findShop.partnerID },
                        { $inc: { 
                                profit: -profitRefundTotal,
                            }
                        },
                        {new:true, projection: { profit: 1  }})
                        if(!profitOne){
                                return res
                                        .status(400)
                                        .send({status:false,message:"ไม่สามารถค้นหาพาร์ทเนอร์และอัพเดทข้อมูลได้"})
                        }
                
                const findTracking = await profitPartner.findOneAndUpdate(
                    {
                        wallet_owner : findShop.partnerID,
                        orderid : txlogisticid
                    },
                    {
                        status:"ยกเลิกออเดอร์"
                    },
                    {new:true})
                    if(!findTracking){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลขแทรคกิ้งเจอ"})
                    }
                // console.log(findTracking)
                    if(findPno.cod_amount != 0){
                       let findTemplate = await profitTemplate.findOneAndUpdate(
                            { orderid : txlogisticid},
                            {
                                status:"ยกเลิกออเดอร์"
                            },{new:true, projection: { status: 1}})
                            if(!findTemplate){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถหารายการโอนเงิน COD ได้"})
                            }
                        refundAll.push(findTemplate)
                    }
                refundAll = refundAll.concat(findPno, historyShop, profitOne, findTracking);

                    for(const element of findPno.profitAll.slice(1)){//คืนเงินให้พาร์ทเนอร์ที่ทำการกระจาย(ไม่รวมตัวเอง)
                        if(element.id == 'ICE'){
                            const refundAdmin = await Admin.findOneAndUpdate(
                                { username:'admin' },
                                { $inc: { profit: -element.total } },
                                {new:true, projection: { profit: 1 } })
                                if(!refundAdmin){
                                        return res
                                                .status(400)
                                                .send({status:false,message:"ไม่สามารถบันทึกกำไรคุณไอซ์ได้"})
                                }
                            const changStatusAdmin = await profitIce.findOneAndUpdate(
                                {orderid: txlogisticid},
                                {type:"ยกเลิกออเดอร์"},
                                {new:true})
                                if(!changStatusAdmin){
                                    return res
                                            .status(404)
                                            .send({status:false, message:"ไม่สามารถค้นหาประวัติกำไรคุณไอซ์"})
                                }
                            refundAll.push(refundAdmin)
                            refundAll.push(changStatusAdmin)
                        }else{
                            const refund = await Partner.findOneAndUpdate(
                                { _id: element.id },
                                { $inc: { 
                                        profit: -element.total,
                                        credits: -element.total,
                                    }
                                },{new:true, projection: { profit: 1, credits: 1  }})
                                if(!refund){
                                    return res
                                            .status(404)
                                            .send({status:false, message:"ไม่สามารถคืนเงินให้ พาร์ทเนอร์ได้"})
                                } 
                            const findTracking = await profitPartner.findOneAndUpdate(
                                {
                                    wallet_owner : element.id,
                                    orderid : txlogisticid
                                },
                                {
                                    status:"ยกเลิกออเดอร์"
                                },
                                {new:true, projection: { status: 1  }})
                                if(!findTracking){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหาหมายเลขแทรคกิ้งเจอ"})
                                }
                            refundAll.push(refund)
                            refundAll.push(findTracking)
                        }
                    }
                    
                return res
                        .status(200)
                        .send({status:true, data:refundAll})
        }
        
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

priceList = async (req, res)=>{
    // console.log(req.body)
    try{
        const no = req.body.no
        const formData = req.body
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = formData.shop_number
        const weight = formData.parcel.weight
        const declared_value = formData.declared_value
        const remark = req.body.remark
        const packing_price = req.body.packing_price
        const send_behalf = formData.from.send_behalf
        const send_number = formData.from.send_number
        const send_type = formData.from.send_type
        let reqCod = req.body.cod_amount

        if(send_behalf != "บริษัท" && send_behalf != "บุคคล"){
            return res
                    .status(400)
                    .send({status:false, type:"sender",message:"ผู้ส่ง กรุณากรอก ส่งในนาม บริษัทหรือบุคคล"})
        }else if(send_number == undefined || send_number == ""){
            return res
                    .status(400)
                    .send({status:false, type:"sender",message:"ผู้ส่ง กรุณากรอกหมายเลขผู้เสียภาษี, บัตรประชาชน หรือ passport"})
        }
        if(send_behalf == "บริษัท"){
            if(send_type != "หมายเลขผู้เสียภาษี"){
                return res
                    .status(400)
                    .send({status:false, type:"sender",message:"กรุณากรอกประเภท หมายเลขผู้เสียภาษี เพราะท่านเลือกส่งในนามบริษัท"})
            }
        }else if(send_behalf == "บุคคล"){
            if(send_type != "บัตรประชาชน" && send_type != "passport"){
                return res
                    .status(400)
                    .send({status:false, type:"sender",message:"กรุณากรอกประเภท บัตรประชาชน หรือ passport เพราะท่านเลือกส่งในนามบุคคล"})
            }
        }

        //ตรวจสอบข้อมูลผู้ส่ง จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
        try{
            if(!formData.from.name){
                return res
                        .status(400)
                        .send({status:false, type:"sender",message:"กรุณากรอกชื่อผู้ส่ง"});
            }else if(!formData.from.tel){
                return res
                        .status(400)
                        .send({status:false, type:"sender",message:"กรุณากรอกเบอร์โทรผู้ส่ง"});
            }
            let dataSenderFail = `ผู้ส่ง(${formData.from.name}) กรุณากรอก: `
            if(!formData.from.province || !formData.from.district || !formData.from.state || !formData.from.postcode){
                if(!formData.from.province){
                    dataSenderFail += 'จังหวัด/ '
                }
                if(!formData.from.state){
                    dataSenderFail += 'อำเภอ/ '
                }
                if(!formData.from.district){
                    dataSenderFail += 'ตำบล/ '
                }
                if(!formData.from.postcode){
                    dataSenderFail += 'รหัสไปรษณีย์/ '
                }
                return res
                        .status(400)
                        .send({status:false, type:"sender",message: dataSenderFail});
            }

            const data = await postalThailand.find({postcode: formData.from.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, type:"sender", message:"ไม่พบรหัสไปรษณีย์ที่ผู้ส่งระบุ"})
                }

            const tel = formData.from.tel;

            // สร้าง regular expression เพื่อตรวจสอบว่า tel เป็นตัวเลขเท่านั้น
            const regexWord = /^\d+$/;

                // ตรวจสอบว่า tel เป็นตัวเลขเท่านั้น
                if (!regexWord.test(tel)) {
                    return res
                                .status(400)
                                .send({
                                    status:false, 
                                    type:"sender",
                                    message:"กรุณาอย่ากรอกเบอร์โทร ผู้ส่ง โดยใช้ตัวอักษร หรือ อักษรพิเศษ เช่น ก-ฮ, A-Z หรือ * / - + ! ๑ ๒"})
                }
            
            // สร้าง regular expression เพื่อตรวจสอบว่า tel ขึ้นต้นด้วย "00" หรือ "01"
            const regex = /^(00|01)/;
                
                if (regex.test(tel) || tel.length != 10) {
                    // ถ้า tel ขึ้นต้นด้วย "00" หรือ "01" return err
                    return res
                            .status(400)
                            .send({
                                status:false, 
                                type:"sender",
                                message:"กรุณากรอกเบอร์โทร ผู้ส่ง ให้ครบ 10 หลัก(อย่าเกิน)และอย่าขึ้นต้นเบอร์ด้วย 00 หรือ 01"})
                }

            // console.log(data)
            let isValid = false;
            let errorMessage = 'ผู้ส่ง:';
            let errorProvince = false;
            let errorState = []
            let errorDistrict = []

            for (const item of data) {
                if (item.province == formData.from.province && item.district == formData.from.district && item.state == formData.from.state) {
                    isValid = true;
                    break;
                } else {
                    if (item.province != formData.from.province && !errorProvince){
                        errorMessage += 'จังหวัดไม่ถูกต้อง / ';
                        errorProvince = true;
                    }

                    if (item.state != formData.from.state){ 
                        errorState.push(false)
                    }else{
                        errorState.push(true)
                    }

                    if (item.district != formData.from.district){ 
                        errorDistrict.push(false)
                    }else{
                        errorDistrict.push(true)
                    }
                }
            }
            // console.log(errorState)
            // เช็คว่า errorState มีค่าเป็น false ทั้งหมดหรือไม่
            if (errorState.length > 0 && !errorState.includes(true)) { //เช็คอำเภอว่าไม่มีอำเภอไหนถูกต้องเลย
                errorMessage += 'อำเภอไม่ถูกต้อง / ';
            }
            if (errorDistrict.length > 0 && !errorDistrict.includes(true)) {//เช็คตำบลว่าไม่มีอำเภอไหนถูกต้องเลย
                errorMessage += 'ตำบลไม่ถูกต้อง / ';
            }
            
            if (!isValid) {
                return res
                        .status(400)
                        .send({staus:false, type:"sender",message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        //ตรวจสอบข้อมูลผู้รับ จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
        try{
            if(!formData.to.name){
                return res
                        .status(400)
                        .send({status:false, type:"receive",message:"กรุณากรอกชื่อผู้รับ"});
            }else if(!formData.to.tel){
                return res
                        .status(400)
                        .send({status:false, type:"receive",message:"กรุณากรอกเบอร์โทรผู้รับ"});
            }
            let dataReceiveFail = `กรุณากรอก: `
            if(!formData.to.province || !formData.to.district || !formData.to.state || !formData.to.postcode){
                if(!formData.to.province){
                    dataReceiveFail += 'จังหวัด/ '
                }
                if(!formData.to.state){
                    dataReceiveFail += 'อำเภอ/ '
                }
                if(!formData.to.district){
                    dataReceiveFail += 'ตำบล/ '
                }
                if(!formData.to.postcode){
                    dataReceiveFail += 'รหัสไปรษณีย์/ '
                }
                return res
                        .status(400)
                        .send({status:false, type:"receive",message: dataReceiveFail});
            }
        
            const data = await postalThailand.find({postcode: formData.to.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, type:"receive", message:"ไม่พบรหัสไปรษณีย์ที่ผู้รับระบุ"})
                }

            const telTo = formData.to.tel;
            
            // สร้าง regular expression เพื่อตรวจสอบว่า tel เป็นตัวเลขเท่านั้น
            const regexWord = /^\d+$/;

                // ตรวจสอบว่า tel เป็นตัวเลขเท่านั้น
                if (!regexWord.test(telTo)) {
                    return res
                                .status(400)
                                .send({
                                    status:false, 
                                    type:"receive",
                                    message:"กรุณาอย่ากรอกเบอร์โทร ผู้รับ โดยใช้ตัวอักษร หรือ อักษรพิเศษ เช่น ก-ฮ, A-Z หรือ * / - + ! ๑ ๒"})
                }
            
            // สร้าง regular expression เพื่อตรวจสอบว่า tel ขึ้นต้นด้วย "00" หรือ "01"
            const regex = /^(00|01)/;
                
                if (regex.test(telTo) || telTo.length != 10) {
                    // ถ้า tel ขึ้นต้นด้วย "00" หรือ "01" return err
                    return res
                            .status(400)
                            .send({
                                status:false, 
                                type:"receive",
                                message:"กรุณากรอกเบอร์โทร ผู้รับ ให้ครบ 10 หลัก(อย่าเกิน)และอย่าขึ้นต้นเบอร์ด้วย 00 หรือ 01"})
                }

            // console.log(data)
            let isValid = false;
            let errorMessage = 'ผู้รับ:';
            let errorProvince = false;
            let errorState = []
            let errorDistrict = []

            //ตรวจสอบข้อมูล จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
            for (const item of data) {
                if (item.province == formData.to.province && item.district == formData.to.district && item.state == formData.to.state) {
                    isValid = true;
                    break;
                } else {
                    if (item.province != formData.to.province && !errorProvince){
                        errorMessage += 'จังหวัดไม่ถูกต้อง / ';
                        errorProvince = true;
                    }

                    if (item.state != formData.to.state){ 
                        errorState.push(false)
                    }else{
                        errorState.push(true)
                    }

                    if (item.district != formData.to.district){ 
                        errorDistrict.push(false)
                    }else{
                        errorDistrict.push(true)
                    }
                }
            }
            // console.log(errorState)
            // เช็คว่า errorState มีค่าเป็น false ทั้งหมดหรือไม่
            if (errorState.length > 0 && !errorState.includes(true)) { //เช็คอำเภอว่าไม่มีอำเภอไหนถูกต้องเลย
                errorMessage += 'อำเภอไม่ถูกต้อง / ';
            }
            if (errorDistrict.length > 0 && !errorDistrict.includes(true)) {//เช็คตำบลว่าไม่มีอำเภอไหนถูกต้องเลย
                errorMessage += 'ตำบลไม่ถูกต้อง / ';
            }
            
            if (!isValid) {
                return res
                        .status(400)
                        .send({staus:false, type:"receive", message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        if(weight <= 0 || weight == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณาระบุน้ำหนัก(kg)`})
        }
        if(formData.parcel.width == 0 || formData.parcel.width == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกความกว้าง(cm)`})
        }else if(formData.parcel.length == 0 || formData.parcel.length == undefined){
            return res
                    .status(400)
                    .send({status:false,type:"receive", message:`ลำกรุณากรอกความยาว(cm)`})
        }else if(formData.parcel.height == 0 || formData.parcel.height == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกความสูง(cm)`})
        }

        if(!Number.isInteger(packing_price)){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกค่าบรรจุภัณฑ์เป็นเป็นตัวเลขจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม,ตัวอักษร หรือค่าว่าง`})
        }
        if (!Number.isInteger(reqCod)||
            !Number.isInteger(declared_value)) {
                    return res.status(400).send({
                        status: false,
                        type:"receive",
                        message: `กรุณาระบุค่า COD หรือ มูลค่าสินค้า(ประกัน) เป็นตัวเลขจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม,ตัวอักษร หรือค่าว่าง`
                    });
                }

        //ผู้ส่ง
        const sender = formData.from; 
        const filterSender = { shop_id: shop , tel: sender.tel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
        
            const data_sender = { //ข้อมูลที่ต้องการอัพเดท หรือ สร้างใหม่
                ...sender,
                ID: id,
                status: 'ผู้ส่ง',
                shop_id: shop,
                send_behalf: send_behalf,
                send_number: send_number,
                send_type: send_type,
                postcode: String(sender.postcode),
            };

        const optionsSender = { upsert: true }; // upsert: true จะทำการเพิ่มข้อมูลถ้าไม่พบข้อมูลที่ตรงกับเงื่อนไข
        
        const resultSender = await dropOffs.updateOne(filterSender, data_sender, optionsSender);
            if (resultSender.upsertedCount > 0) {
                console.log('สร้างข้อมูลผู้ส่งคนใหม่');
            } else {
                console.log('อัปเดตข้อมูลผู้ส่งเรียบร้อย');
            }
        
        const infoSender = await dropOffs.findOne(filterSender)
            if(!infoSender){
                console.log('ไม่มีข้อมูลผู้ส่ง')
            }

        const findForCost = await shopPartner.findOne({shop_number:shop})//เช็คว่ามีร้านค้าอยู่จริงหรือเปล่า
            if(!findForCost){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
            }
        const checkSwitch = findForCost.express.find(item => item.express == 'J&T(B)')
            if(checkSwitch.on_off == false || checkSwitch.cancel_contract == true){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่สามารถใช้งานระบบขนส่งนี้ได้"})
            }

        let cod_percent = []
        let fee_cod_total = 0
        let profitCOD = 0 //ห้ามลบ
        if(reqCod != 0){
            const findShopCod = await codPercent.findOne({shop_id:findForCost._id})
                if(findShopCod){
                    let fee_cod = 0
                    let percentCOD = req.body.percentCOD 
                    
                    // สร้าง regular expression เพื่อตรวจสอบทศนิยมไม่เกิน 2 ตำแหน่ง
                    const regex = /^\d+(\.\d{1,2})?$/;

                    let pFirst = findShopCod.express.find((item)=> item.express == "J&T(B)")

                    if(pFirst.percent == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"กรุณารอพาร์ทเนอร์ที่แนะนำท่านกรอกเปอร์เซ็น COD ที่ต้องการ"})
                    }else if(!regex.test(percentCOD)){
                        return res
                                .status(400)
                                .send({ status: false, message: "ค่าเปอร์เซ็น COD ต้องเป็นทศนิยมไม่เกิน 2 ตำแหน่ง" });
                    }else if(percentCOD != 0 && percentCOD < pFirst.percent){
                        return res
                                .status(400)
                                .send({
                                    status:false, 
                                    type:"sender",
                                    message:"กรุณาอย่าตั้ง %COD ต่ำกว่าพาร์ทเนอร์ที่แนะนำท่าน"})
                    }
                    // console.log(percentCOD)
                        if(percentCOD != 0){ //กรณีกรอก %COD ที่ต้องการมา
                            let feeOne = (reqCod * percentCOD)/100
                            fee_cod_total = feeOne
                            fee_cod = (reqCod * pFirst.percent)/100
                            let profit = feeOne - fee_cod
                                let v = {
                                    id:findShopCod.owner_id,
                                    cod_profit:profit
                                }
                            profitCOD = profit
                            cod_percent.push(v)
                            
                        }else{
                            fee_cod = ((reqCod * pFirst.percent)/100)
                            fee_cod_total = fee_cod
                        }

                    // console.log(shop_line)
                    if(findShopCod.shop_line != 'ICE'){
                        let shop_line = findShopCod.shop_line
                        do{
                            const findShopLine = await codPercent.findOne({shop_id:shop_line})
                            const p = findShopLine.express.find((item)=> item.express == "J&T(B)")
                            let feeOne = (reqCod * p.percent)/100
                            let profit = fee_cod - feeOne
                                fee_cod -= profit
                                    let v = {
                                            id:findShopLine.owner_id,
                                            cod_profit:profit
                                        }
                                cod_percent.push(v)
                                    if(findShopLine.shop_line == 'ICE'){
                                        let b = {
                                                id:'ICE',
                                                cod_profit:fee_cod
                                            }
                                        cod_percent.push(b)
                                    }
                                shop_line = findShopLine.shop_line
                            
                        }while(shop_line != "ICE")
                    }else{
                        let v = {
                                id:'ICE',
                                cod_profit:fee_cod
                            }
                        cod_percent.push(v)
                    }
                    
                }
        }
        // console.log(cod_percent)
        
        const result  = await weightAll.findOne(
            {
                shop_id: findForCost._id,
                express:"J&T(B)"
            })
            if(!result){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีร้านค้านี้ในระบบ"})
            }

            if(result.weightMax < weight){
                if(result.weightMax == 0){
                    return res
                            .status(400)
                            .send({status:false, message:"กรุณารอการระบุน้ำหนักที่สามารถใช้งานได้"})
                }
                return res
                        .status(400)
                        .send({status: false, message:`น้ำหนักของร้านค้า ${req.body.shop_number} ที่คุณสามารถสั่ง Order ได้ต้องไม่เกิน ${result.weightMax} กิโลกรัม`})
            }

        //เช็คว่าอยู่เขต กรุงเทพ/ปริมณฑล หรือเปล่า
        let priceBangkok = false;
        const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
            if (findPostcal) {
                priceBangkok = true;
            }

        //เช็คว่าอยู่เขต พื้นที่ห่างไกล หรือเปล่า
        let price_remote_area = 0
        const findPostCode = await jntRemoteArea.findOne({postcode:formData.to.postcode})
            if(findPostCode){
                if(findPostCode.type == 'remoteArea'){
                    price_remote_area = findPostCode.fee_remote
                }else{
                    // console.log(findPostCode.fee_tourist)
                    let fee_tourist = findPostCode.fee_tourist
                    for (let i = 0; i < fee_tourist.length; i++){
                        if (weight >= fee_tourist[i].weightstart && weight <= fee_tourist[i].weightend){
                            price_remote_area = fee_tourist[i].fee
                            break;
                        }
                    }
                }
            }
        console.log("price_remote_area: ",price_remote_area)
        
        //เช็คประกัน(ถ้ามี)
        const findinsured = await insuredExpress.findOne({express:"JNT"})
        let insuranceFee = 0
            if(findinsured){
                    // console.log(findinsured.product_value)
                    let product_value = findinsured.product_value
                    for (let i = 0; i < product_value.length; i++){
                        if (declared_value >= product_value[i].valueStart && declared_value <= product_value[i].valueEnd){
                            insuranceFee = product_value[i].insurance_fee
                            break;
                        }
                    }
            }
        
        //ดึงราคาขายหน้าร้านมาตรฐานมา
        const findPriceBase = await priceBase.findOne({express:"J&T(B)"})
            if(!findPriceBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }

        let new_data = []
                let v = null;
                let resultP
                let p = result.weight
                    for(let i = 0; i< p.length; i++){
                        if(weight >= p[i].weightStart && weight <= p[i].weightEnd){
                            resultP = p[i]
                            break;
                        }
                    }
                // console.log(resultP)
                    if(resultP.costUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคา(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณากรอกราคาขายหน้าร้าน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณากรอกราคาขายหน้าร้าน(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }
                let resultBase
                let base = findPriceBase.weight
                    for(let i = 0; i< base.length; i++){
                        if(weight >= base[i].weightStart && weight <= base[i].weightEnd){
                            resultBase = base[i]
                            break;
                        }
                    }
                // console.log(resultBase)    
                    if(resultBase.costUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }
                let idReal
                if(role == 'partner'){
                    idReal = id
                }else if(role == 'shop_member'){
                    idReal = req.decoded.id_ownerShop
                    console.log(idReal)
                }
                const findPartner = await Partner.findById(idReal)
                    if(!findPartner){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลของท่านในระบบ"})
                    }
                let findRole = findPartner.sub_role.find(item => item.role == 'ONLINE-SELLER')
                    if(!findRole){
                        // console.log("GGEZ")
                        if(resultP.costBangkok_metropolitan > resultBase.salesBangkok_metropolitan){ //ใช้เช็คกรณีที่คุณไอซ์แก้ราคา มาตรฐาน แล้วราคาต้นทุนที่ partner คนก่อนตั้งไว้มากกว่าราคามาตรฐาน จึงต้องเช็ค
                            return res
                                    .status(400)
                                    .send({status:false, message:`ราคาขาย(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                        }else if(resultP.costUpcountry > resultBase.salesUpcountry){
                            return res
                                    .status(400)
                                    .send({status:false, message:`ราคาขาย(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                        }
                    }
                
                // คำนวนต้นทุนของร้านค้า
                let cost_hub
                let price
                let profit_partner
                let profit = []
                let status = null;
                let cut_partner
                let cost_base
                let cod_profit
                // let profitSaleMartket
                let findOwner = cod_percent.find((item)=> item.id == result.owner_id)
                    if(!findOwner){
                        cod_profit = 0
                    }else{
                        cod_profit = findOwner.cod_profit
                    }
                // console.log(findOwner)
                if(priceBangkok){
                    cost_hub = resultP.costBangkok_metropolitan
                    price = resultP.salesBangkok_metropolitan
                    // profitSaleMartket = price - resultBase.salesBangkok_metropolitan
                    cut_partner = parseFloat(resultP.costBangkok_metropolitan.toFixed(2))
                    cost_base = resultBase.salesBangkok_metropolitan
                    profit_partner = price - cost_hub

                    let cost = resultP.costBangkok_metropolitan
                    let total = profit_partner + cod_profit
                        let dataOne = {
                            id: result.owner_id,
                            cost_price: parseFloat(price.toFixed(2)),
                            cost: parseFloat(cost.toFixed(2)),
                            profit: parseFloat(profit_partner.toFixed(2)),
                            cod_profit: parseFloat(cod_profit.toFixed(2)),
                            total: parseFloat(total.toFixed(2))
                        }
                    profit.push(dataOne)
                }else{
                    cost_hub = resultP.costUpcountry
                    price = resultP.salesUpcountry
                    // profitSaleMartket = price - resultBase.salesUpcountry
                    profit_partner = price - cost_hub
                    cut_partner = parseFloat(resultP.costUpcountry.toFixed(2))
                    cost_base = resultBase.salesUpcountry

                    let cost = resultP.costUpcountry
                    let total = profit_partner + cod_profit
                        let dataOne = {
                            id: result.owner_id,
                            cost_price: parseFloat(price.toFixed(2)),
                            cost: parseFloat(cost.toFixed(2)),
                            profit: parseFloat(profit_partner.toFixed(2)),
                            cod_profit: parseFloat(cod_profit.toFixed(2)),
                            total: parseFloat(total.toFixed(2))
                        }
                    profit.push(dataOne)
                }
                // console.log(profit)
                let shop_line = result.shop_line
                if(shop_line != 'ICE'){
                    do{
                        const findHead = await weightAll.findOne(
                                {
                                    shop_id: shop_line,
                                    express:"J&T(B)"
                                })
                        let profitOne 
                        let cod_profit
                        let findWeight = findHead.weight.find((item)=> item.weightEnd == resultP.weightEnd )
                        let findOwner = cod_percent.find((item)=> item.id == findHead.owner_id)  
                            if(!findOwner){
                                cod_profit = 0
                            }else{
                                cod_profit = findOwner.cod_profit
                            }
                            // console.log(findOwner)
                        let cost 
                            if(priceBangkok){
                                profitOne = cost_hub - findWeight.costBangkok_metropolitan
                                cost = findWeight.costBangkok_metropolitan
                            }else{
                                profitOne = cost_hub - findWeight.costUpcountry
                                cost = findWeight.costUpcountry
                            }
                        let total = profitOne + cod_profit
                        let data = {
                                    id: findHead.owner_id,
                                    cost_price: parseFloat(cost_hub.toFixed(2)),
                                    cost: parseFloat(cost.toFixed(2)),
                                    profit: parseFloat(profitOne.toFixed(2)),
                                    cod_profit: parseFloat(cod_profit.toFixed(2)),
                                    total: parseFloat(total.toFixed(2)),
                            }
                        profit.push(data)
                        shop_line = findHead.shop_line
                        cost_hub -= profitOne
                    }while(shop_line != 'ICE')
                }
                
                let cod_iceprofit
                let findIce = cod_percent.find((item)=> item.id == "ICE")
                    if(!findIce){
                        cod_iceprofit = 0
                    }else{
                        cod_iceprofit = findIce.cod_profit
                    }

                if(priceBangkok){
                    // console.log(cost_hub)
                    let cost = resultBase.costBangkok_metropolitan
                    let profitTwo = cost_hub - resultBase.costBangkok_metropolitan
                    let total = profitTwo + cod_iceprofit
                    let dataICE = {
                        id:"ICE",
                        cost_price: parseFloat(cost_hub.toFixed(2)),
                        cost: parseFloat(cost.toFixed(2)),
                        profit: parseFloat(profitTwo.toFixed(2)),
                        cod_profit: parseFloat(cod_iceprofit.toFixed(2)),
                        total: parseFloat(total.toFixed(2))
                    }
                    profit.push(dataICE)
                    cost_hub -= profitTwo
                }else{
                    let cost = resultBase.costUpcountry
                    let profitTwo = cost_hub - resultBase.costUpcountry
                    let total = profitTwo + cod_iceprofit
                    let dataICE = {
                        id:"ICE",
                        cost_price: parseFloat(cost_hub.toFixed(2)),
                        cost: parseFloat(cost.toFixed(2)),
                        profit: parseFloat(profitTwo.toFixed(2)),
                        cod_profit: parseFloat(cod_iceprofit.toFixed(2)),
                        total: parseFloat(total.toFixed(2))
                    }
                    profit.push(dataICE)
                    cost_hub -= profitTwo
                    // console.log(cost_hub)
                }
                // console.log(profit)
                    v = {
                        ...req.body,
                        express: "J&T(B)",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cost_base: cost_base,
                        fee_cod: 0,
                        price: Number(price.toFixed()),
                        declared_value: declared_value,
                        insuranceFee: insuranceFee,
                        packing_price: packing_price,
                        total: 0,
                        cut_partner: 0,
                        status: status,
                        remark: remark,
                        profitAll: profit
                    };
                    // console.log(v)
                    // if (cod !== undefined) {
                        let formattedFee = parseFloat(fee_cod_total.toFixed(2));
                        let total = price + formattedFee + insuranceFee + packing_price
                            v.fee_cod = formattedFee
                            // v.profitPartner = profitPartner
                                if(price_remote_area != undefined){
                                    let total1 = total + price_remote_area
                                        v.total = parseFloat(total1.toFixed(2))
                                        let cut = cut_partner + price_remote_area + insuranceFee + formattedFee
                                        v.cut_partner = parseFloat(cut.toFixed(2))
                                        v.price_remote_area = price_remote_area
                                }else{
                                    let cut = cut_partner + insuranceFee + formattedFee
                                    v.cut_partner = parseFloat(cut.toFixed(2))
                                    v.total = parseFloat(total.toFixed(2))
                                }
                            new_data.push(v);
                    
                    try {
                        await Promise.resolve(); // ใส่ Promise.resolve() เพื่อให้มีตัวแปรที่ await ได้
                        if (findForCost.credit < new_data[0].cut_partner) {
                            new_data[0].status = 'จำนวนเงินของท่านไม่เพียงพอ';
                        } else {
                            new_data[0].status = 'พร้อมใช้บริการ';
                        }
                    } catch (error) {
                        console.error('เกิดข้อผิดพลาดในการรอรับค่า');
                    }
        
        return res
                .status(200)
                .send({ status: true, new:new_data[0], sender:infoSender});
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

label = async (req, res)=>{
    try{
        const formData = {
            "logistics_interface":{
                "mailNo": req.body.mailNo,
                "type": req.body.type,
            },
            "msg_type": "GETREPORTURL",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(formData)
            //console.log(newData)
        const response = await axios.post(`${apiUrl}/order/getReportUrl`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถใช้ได้"})
            }
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

trackingOrderOne = async (req, res)=>{
    try{
        const txlogisticid = req.body.txlogisticid
        const formData = {
            "logistics_interface":{
                "billcode": txlogisticid,
                "querytype":"2",
                "lang":"en",
                "customerid":customer_id
            },
            "msg_type": "TRACKQUERY",
            "eccompanyid": ecom_id,
        }
        let apiUrlQuery = process.env.JT_URL_QUERY_B
        // console.log(apiUrlQuery)
        const newData = await generateJT(formData)
            // console.log(newData)
        const response = await axios.post(`${apiUrlQuery}/track/trackForJson`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            }})
        // console.log(response)
            if(response.data.responseitems == null){ //หมายเลขแรกที่ถูกยิงเข้าไปไม่ถูกต้อง
                return res
                        .status(404)
                        .send({
                            status:false, 
                            message:"หมายเลขที่ท่านกรอกไม่มีในระบบของ J&T",
                            data: response.data
                        })
            }
        
        return res
                .status(200)
                .send({status:true, 
                    data: response.data
                })
    }catch(err){
        console.log(err)
        return res
                .status(200)
                .send({status:true, data:[]})
    }
}

function chunkArray(array, size){
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunks.push(chunk.join(',')); // แปลง array เป็น string ด้วย comma
    }
    return chunks;
}

let count_update = 1
async function myTask() {
    try{
        console.log(currentTime)
        const findOrder = await orderAll.find({
            $or: [
                { order_status: "booking" },
                { order_status: "รับพัสดุแล้ว" },
                { order_status: "ระหว่างการจัดส่ง" },
                { order_status: "พัสดุมีปัญหา" },
                { order_status: "พัสดุตีกลับ" },
            ],
            express:"J&T(B)"
        }, { tracking_code: 1, _id:0}).sort({ day: -1 });
            if(findOrder.length == 0){
                return {message:"ไม่มีออเดอร์ J&T(B) ที่ต้องอัพเดท", status:true, data:[]}
            }
        const txlogisticid = findOrder.map(order => order.tracking_code);
        const chunks = chunkArray(txlogisticid, 19);
        // console.log("chunks:",chunks)
        const order = { body: { txlogisticid: txlogisticid } }; // สร้าง request mock object
        console.log("จำนวนพัสดุ J&T(B) ทั้งหมดที่ต้องอัพเดท:",order.body.txlogisticid.length)
        for (const chunk of chunks) {
            // console.log(`Updating status for chunk: ${chunk}`);
            console.log(count_update)
            const req = { body: { txlogisticid: chunk } }; // สร้าง request mock object สำหรับแต่ละกลุ่ม
            const res = {
                status: (code) => ({
                    send: (response) => console.log('Response:', response)
                })
            }; // สร้าง response mock object
        
            await trackingOrderAuto(req, res); // เรียกใช้ฟังก์ชันทีละกลุ่ม
            count_update += 1
        }
        count_update = 0
        console.log(`Complate update J&T(B): ${order.body.txlogisticid.length}`)
    }catch(err){
        console.log(err)
    }
}

// cron.schedule('16,18,21,24 23 * * *', myTask, {
//     scheduled: true,
//     timezone: "Asia/Bangkok"
// });

// myTask()

// cron.schedule('10 0 * * *', myTask, {
//     scheduled: true,
//     timezone: "Asia/Bangkok"
// });

// cron.schedule('0 9,12,15,18 * * *', myTask, {
//     scheduled: true,
//     timezone: "Asia/Bangkok"
// });

async function invoiceNumber(date) {
    try{
        data = `${dayjs(date).format("YYYYMMDD")}`
        let random = Math.floor(Math.random() * 10000000)
        const combinedData = `JNTB` + data + random;
        const findInvoice = await orderAll.find({tracking_code:combinedData})

            while (findInvoice && findInvoice.length > 0) {
                // สุ่ม random ใหม่
                random = Math.floor(Math.random() * 10000000);
                combinedData = `JNTB`+ data + random;

                // เช็คใหม่
                findInvoice = await orderAll.find({tracking_code: combinedData});
            }

        // console.log(combinedData);
        return combinedData;
    }catch(err){
        console.log(err)
    }
}

async function invoiceJNT(day) {
    day = `${dayjs(day).format("YYYYMMDD")}`
    let data = `ODHJNTB`
    let random = Math.floor(Math.random() * 10000000)
    const combinedData = data + day + random;
    const findInvoice = await orderAll.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000);
        combinedData = data + day + random;

        // เช็คใหม่
        findInvoice = await orderAll.find({invoice: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

module.exports = {createOrder,cancelOrder, priceList, label, trackingOrderOne}