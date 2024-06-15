const { doSign } = require('./best.sign')
const axios = require('axios')
const dayjs = require('dayjs');
const fs = require('fs');
const { bestOrder } = require('../../../Models/Delivery/best_express/order')
const { weightAll } = require('../../../Models/Delivery/weight/weight.all.express');
const { PercentCourier } = require('../../../Models/Delivery/ship_pop/percent');
const { codExpress } = require('../../../Models/COD/cod.model');
const { shopPartner } = require('../../../Models/shop/shop_partner');
const { Partner } = require('../../../Models/partner');
const { historyWalletShop } = require('../../../Models/shop/shop_history');
const { profitIce } = require('../../../Models/profit/profit.ice');
const { profitPartner } = require('../../../Models/profit/profit.partner');
const { dropOffs } = require('../../../Models/Delivery/dropOff');
const { bestRemoteArea } = require('../../../Models/remote_area/best.area');
const { orderAll } = require('../../../Models/Delivery/order_all');
const { bangkokMetropolitan } = require('../../../Models/postcal_bangkok/postcal.bangkok');
const { priceBase } = require('../../../Models/Delivery/weight/priceBase.express');
const { codPercent } = require('../../../Models/COD/cod.shop.model');
const { postalThailand } = require('../../../Models/postal.thailand/postal.thai.model');

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที

const BEST_URL = process.env.BEST_URL
const keys = process.env.PARTNER_KEY
const PARTNER_ID = process.env.PARTNER_ID
const charset = 'utf-8'

createPDFOrder = async(req, res)=>{
    try{
        const txLogistic = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            // console.log('txLogisticId : '+txLogistic);
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = req.body.shop_number
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const remark = req.body.remark
        const packing_price = req.body.packing_price
        const insuranceFee = req.body.insuranceFee
        const declared_value = req.body.declared_value
        const cost_base = req.body.cost_base
        const profitAll = req.body.profitAll
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const data = req.body
        const weight = data.parcel.weight
        let cut = req.body.cut_partner
        const cut_partner = parseFloat(cut.toFixed(2))
        const price_remote_area = req.body.price_remote_area

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
        
        const invoice = await invoiceBST()
        //ผู้ส่ง
        const senderTel = data.from.tel; 
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        
        // console.log(updatedDocument)
        const formData = {
            serviceType:"KD_CREATE_WAYBILL_ORDER_PDF_NOTIFY",
            bizData:{
                txLogisticId:txLogistic,
                special:"1",
                // sendStartTime: "2024-03-20",
                sender:{
                    "name":data.from.name,
                    "postCode":data.from.postcode,
                    "mobile":data.from.tel,
                    "prov":data.from.province,
                    "city":data.from.state, //อำเภอ
                    "county":data.from.district, //ตำบล
                    "address":data.from.address,
                    "email":data.from.email,
                    "country":"06"
                },
                receiver:{
                    "name":data.to.name,
                    "postCode":data.to.postcode,
                    "mobile":data.to.tel,
                    "prov":data.to.province,
                    "city":data.to.state, //อำเภอ
                    "county":data.to.district, //ตำบล
                    "address":data.to.address,
                    "email":data.to.email,
                    "country":"06"
                },
                items:{
                    item:[{
                            "itemName": 'ORDERHUB',
                            "itemWeight": weight,
                            "itemLength": data.parcel.width,
                            "itemWidth": data.parcel.length,
                            "itemHeight": data.parcel.height
                        }]
                },
                piece: "1",
                itemsWeight: weight,
                length:data.parcel.width,
                width:data.parcel.length,
                height:data.parcel.height,
                remark:remark
            },
            partnerID: PARTNER_ID
        }

        // console.log(formData)
        if(cod_amount != 0){
            formData.bizData.items.item[0].itemValue = cod_amount
            formData.bizData.itemsValue = cod_amount
            formData.bizData.bankCardOwner = updatedDocument.best.name
            formData.bizData.bankCode = updatedDocument.best.code
            formData.bizData.bankCardNo = updatedDocument.best.card_number
            console.log(cod_amount)
        }
        if(declared_value > 0){
            formData.bizData.items.item[0].insuranceValue = declared_value
            formData.bizData.insuranceValue = declared_value
        }
        const newData = await doSign(formData, charset, keys)
        // console.log(newData)
        const response = await axios.post(BEST_URL,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
        })
        // console.log(response.data)
            if(!response){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
            }else if(!response.data.result){
                return res
                        .status(400)
                        .send({status:false, message:response.data})
            }
        //ข้อมูล Base64 ที่ต้องการ decode
        const base64Data = response.data.pdfStream;
        // console.log(base64Data)

        // // Decode Base64
        // const binaryData = Buffer.from(base64Data, 'base64');

        // // สร้างไฟล์ PDF
        // fs.writeFileSync(`D:\PDF/${txLogistic}.pdf`, binaryData, 'binary', (err) => {
        //     if (err) throw err;
        //         console.log('สร้าง PDF ไม่สำเร็จ');
        //     });
        
        let allProfit = []
        let profit_ice
        let profit_p
        let profitP
        let createTemplate
        let proficICE

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
                    orderid: response.data.txLogisticId,
                    mailno: response.data.mailNo,
                    amount: cut_partner,
                    before: plusFloat,
                    after: credit,
                    type: 'BEST',
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
                    orderid: response.data.txLogisticId,
                    mailno: response.data.mailNo,
                    cost_price: profitAll[0].cost_price,
                    cost: profitAll[0].cost,
                    profitCost: profitAll[0].profit,
                    profitCOD: profitAll[0].cod_profit,
                    packing_price: packing_price,
                    profit: profitAll[0].total + packing_price,
                    express: 'BEST',
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
            let profitOne = await Partner.findOneAndUpdate(
                    { _id: id },
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
                                        orderid: response.data.txLogisticId,
                                        mailno: response.data.txLogisticId,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'J&T',
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
                                        orderid: response.data.txLogisticId,
                                        mailno: response.data.txLogisticId,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'J&T',
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
                    tracking_code: response.data.txLogisticId,
                    mailno: response.data.mailNo,
                    from: {
                        ...data.from
                    },
                    to: {
                        ...data.to
                    },
                    parcel: {
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
                    declared_value: declared_value,
                    insuranceFee: insuranceFee,
                    pdfStream: base64Data,
                    profitAll: profitAll,
                    type:'PDF',
                    express: 'BEST',
                    remark:remark,
                    ...response.data
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์(ALL)ได้"})
            }
            if(cod_amount > 0){
                const pfSenderTemplate = {
                        orderid: response.data.txLogisticId,
                        owner_id: findShop.partnerID,
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        type: 'COD(SENDER)',
                        'template.partner_number': response.data.mailNo,
                        'template.account_name':updatedDocument.flash_pay.name,
                        'template.account_number':updatedDocument.flash_pay.card_number,
                        'template.bank':updatedDocument.flash_pay.aka,
                        'template.amount':cod_amount,
                        'template.phone_number': updatedDocument.tel,
                        'template.email':updatedDocument.email,
                        status:"รอรถเข้ารับ",
                        express: "BEST"
                }
                createTemplate = await profitTemplate.create(pfSenderTemplate)
                    if(!createTemplate){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้างรายการ COD ของผู้ส่งได้"})
                    }
                allProfit.push(createTemplate)
            }

            return res
                .status(200)
                .send({
                    status:true, 
                    res: response.data,
                    order: createOrderAll,
                    // shop: findShop,
                    profitAll: allProfit
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

statusOrderPush = async (req, res)=>{
    try{
        const txLogisticId = req.body.txLogisticId
        const formData = {
            serviceType:"KD_ORDER_STATUS_PUSH",
            bizData:{
               mailNos:{
                    txLogisticId: txLogisticId,
                    packageStatusCode: req.body.packageStatusCode,
                    statusCodeDesc: req.body.statusCodeDesc,
                    operateTime: milliseconds,
                    currentCity: req.body.currentCity,
                    nextCity: req.body.nextCity,
                    remark: req.body.remark,
               }
            },
            partnerID: PARTNER_ID,
            partnerKey: keys
        }
        const newData = await doSign(formData, charset, keys)
        console.log(newData)
        const response = await axios.post(BEST_URL,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
        })
            if(!response){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
            }
        return res
                .status(200)
                .send({status:true, data:response.data})
    }catch(err){
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

statusOrder = async (req, res)=>{
    try{
        const mailNo = req.body.mailNo
        const formData = {
            serviceType:"KD_TRACE_QUERY",
            bizData:{
               mailNos:{
                    mailNo: mailNo
               }
            },
            partnerID: PARTNER_ID
        }
        const newData = await doSign(formData, charset, keys)
        console.log(newData)
        const response = await axios.post(BEST_URL,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
        })
            if(!response){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
            }
        return res
                .status(200)
                .send({status:true, data:response.data})
    }catch(err){
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

cancelOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const txLogisticId = req.body.txLogisticId
        const reason = req.body.reason
        const formData = {
            serviceType:"KD_CANCEL_ORDER_NOTIFY",
            bizData:{
                txLogisticId: txLogisticId,
                reason: reason
            },
            partnerID: PARTNER_ID
        }
        const findCancel = await orderAll.findOne({tracking_code:txLogisticId})
            if(!findCancel){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking ได้"})
            }else if(findCancel.status == 'cancel'){
                return res
                        .status(200)
                        .send({status:true, message:"ออเดอร์นี้ถูก Cancel ไปแล้ว"})
            }
        const newData = await doSign(formData, charset, keys)
            // console.log(newData)
        const response = await axios.post(BEST_URL,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        })
            if(!response){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
            }
        // console.log(response.data)
        if(response.data.result != true){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถทำการยกเลิกออเดอร์นี้ได้"})
        }else{
                let refundAll = []
                const findPno = await orderAll.findOneAndUpdate(
                    {tracking_code:txLogisticId},
                    {order_status:"cancel"},
                    {new:true})
                    if(!findPno){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking หรืออัพเดทข้อมูลได้"})
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
                    
                const historyShop = await historyWalletShop.findOneAndUpdate(
                    {
                        orderid:txLogisticId
                    },{
                        remark:"ยกเลิกขนส่งสินค้า"
                    },{
                        new:true
                    })
                        if(!historyShop){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking เจอ"})
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
                        orderid : txLogisticId
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
                    if(findTracking.profitCOD != 0){
                       let findTemplate = await profitTemplate.findOneAndUpdate(
                            { orderid : txLogisticId},
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
                                {orderid: txLogisticId},
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
                                    orderid : txLogisticId
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
                        .send({status:false, data:refundAll})
        }
        
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

priceList = async (req, res)=>{
    // console.log(req.body)
    try{
        const no = req.body.no
        const formData = req.body
        const id = req.decoded.userid
        const shop = formData.shop_number
        const declared_value = req.body.declared_value
        const packing_price = req.body.packing_price
        const weight = formData.parcel.weight
        const remark = req.body.remark
        const send_behalf = formData.from.send_behalf
        const send_number = formData.from.send_number
        const send_type = formData.from.send_type
        let reqCod = req.body.cod_amount
        let percentCod
        let insuranceFee

        if(send_behalf != "บริษัท" && send_behalf != "บุคคล"){
            return res
                    .status(400)
                    .send({status:false, type:"sender", message:"ผู้ส่ง กรุณากรอก ส่งในนาม บริษัทหรือบุคคล"})
        }else if(send_number == undefined || send_number == ""){
            return res
                    .status(400)
                    .send({status:false, type:"sender", message:"ผู้ส่ง กรุณากรอกหมายเลขผู้เสียภาษี, บัตรประชาชน หรือ passport"})
        }
        if(send_behalf == "บริษัท"){
            if(send_type != "หมายเลขผู้เสียภาษี"){
                return res
                    .status(400)
                    .send({status:false, type:"sender", message:"กรุณากรอกประเภท หมายเลขผู้เสียภาษี เพราะท่านเลือกส่งในนามบริษัท"})
            }
        }else if(send_behalf == "บุคคล"){
            if(send_type != "บัตรประชาชน" && send_type != "passport"){
                return res
                    .status(400)
                    .send({status:false, type:"sender", message:"กรุณากรอกประเภท บัตรประชาชน หรือ passport เพราะท่านเลือกส่งในนามบุคคล"})
            }
        }

        //ตรวจสอบข้อมูลผู้ส่ง จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
         try{
            const data = await postalThailand.find({postcode: formData.from.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่พบรหัสไปรษณีย์ที่ผู้ส่งระบุ"})
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
                        .send({staus:false, type:"sender", message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        //ตรวจสอบข้อมูลผู้รับ จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
        try{
            const data = await postalThailand.find({postcode: formData.to.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่พบรหัสไปรษณีย์ที่ผู้รับระบุ"})
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
                        .send({staus:false,type:"receive", message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        if(weight <= 0 || weight == undefined){
            return res
                    .status(400)
                    .send({status:false, message:`กรุณาระบุน้ำหนัก(kg)`})
        }
        if(formData.parcel.width == 0 || formData.parcel.width == undefined){
            return res
                    .status(400)
                    .send({status:false, message:`กรุณากรอกความกว้าง(cm)`})
        }else if(formData.parcel.length == 0 || formData.parcel.length == undefined){
            return res
                    .status(400)
                    .send({status:false, message:`กรุณากรอกความยาว(cm)`})
        }else if(formData.parcel.height == 0 || formData.parcel.height == undefined){
            return res
                    .status(400)
                    .send({status:false, message:`กรุณากรอกความสูง(cm)`})
        }
        if(reqCod > 50000){ //เอามาจาก PDF best knowledge
            return res
                    .status(400)
                    .send({status:false, meessage:"บริการ COD ต้องไม่เกิน 50,000 บาท/ชิ้น"})
        }else if (!Number.isInteger(reqCod)||
                    !Number.isInteger(declared_value)) {
            return res
                    .status(400)
                    .send({
                        status: false,
                        message: `กรุณาระบุค่า COD หรือ มูลค่าสินค้า(ประกัน) เป็นจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม`});
        }

        if(!Number.isInteger(packing_price)){
            return res
                    .status(400)
                    .send({status:false, message:`กรุณากรอกค่าบรรจุภัณฑ์เป็นเป็นตัวเลขจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม,ตัวอักษร หรือค่าว่าง`})
        }

        if(weight <= 50){
            const value = ((declared_value * 0.4)/100) 
            if(value < 10){
                insuranceFee = 10
            }else{
                insuranceFee = value
            }
        }else if(weight > 50 && weight <= 300){
            const value = ((declared_value * 1)/100) 
            if(value < 50){
                insuranceFee = 50
            }else{
                insuranceFee = value
            }
        }else{
            return res
                    .status(200)
                    .send({status:false, message:"น้ำหนักที่ท่านกรอกมากเกิน 300 KG"})
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
        //ตรวจว่าใช้ขนส่งนี้ได้ไหม
        const checkSwitch = findForCost.express.find(item => item.express == 'BEST')
            if(checkSwitch.on_off == false || checkSwitch.cancel_contract == true){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่สามารถใช้งานระบบขนส่งนี้ได้"})
            }

        //คำนวณค่า COD
        let cod_percent = []
        let fee_cod_total = 0
        let profitCOD = 0
        if(reqCod != 0){
            const findShopCod = await codPercent.findOne({shop_id:findForCost._id})
                if(findShopCod){
                    let fee_cod = 0
                    let percentCOD = req.body.percentCOD 
                    
                    // สร้าง regular expression เพื่อตรวจสอบทศนิยมไม่เกิน 2 ตำแหน่ง
                    const regex = /^\d+(\.\d{1,2})?$/;

                    let pFirst = findShopCod.express.find((item)=> item.express == "BEST")

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
                                .send({status:false, message:"กรุณาอย่าตั้ง %COD ต่ำกว่าพาร์ทเนอร์ที่แนะนำท่าน"})
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
                        }
 
                    // console.log(shop_line)
                    if(findShopCod.shop_line != 'ICE'){
                        let shop_line = findShopCod.shop_line
                        do{
                            const findShopLine = await codPercent.findOne({shop_id:shop_line})
                            const p = findShopLine.express.find((item)=> item.express == "BEST")
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

        //ดึงข้อมูลตารางของ Partner มาเพื่อเช็คว่าค่าไหนยังไม่ถูกกรอกบ้าง
        const result  = await weightAll.findOne(
            {
                shop_id: findForCost._id,
                express:"BEST"
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

        //ค้นหาว่ารหัสไปรณีย์อยู่กรุงเทพ/ปริมลฑล หรือเปล่า
        let priceBangkok = false;
        const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
            if (findPostcal) {
                priceBangkok = true;
            }

        //เช็คว่าเป็นพื้นที่ห่างไกลหรือเปล่า
        let price_remote_area = 0
        const findRemote = await bestRemoteArea.findOne({Postcode: req.body.to.postcode})
            if(findRemote){
                price_remote_area = findRemote.Price
            }

        //ดึงราคาขายหน้าร้านมาตรฐานมา
        const findPriceBase = await priceBase.findOne({express:"BEST"})
            if(!findPriceBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }

        //การตรวจว่าราคาต้นทุน และราคาขาย ถูกตั้งค่าแล้วหรือยัง
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
                const findPartner = await Partner.findById(id)
                if(!findPartner){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่มีข้อมูลของท่านในระบบ"})
                }
                let findRole = findPartner.sub_role.find(item => item.role == 'ONLINE SELLER')
                    if(!findRole){
                        //ใช้เช็คกรณีที่คุณไอซ์แก้ราคา มาตรฐาน แล้วราคาต้นทุนที่ partner คนก่อนตั้งไว้มากกว่าราคามาตรฐาน จึงต้องเช็ค
                        if(resultP.costBangkok_metropolitan > resultBase.salesBangkok_metropolitan){ 
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
                                    express:"BEST"
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
                        express: "BEST",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cost_base: cost_base,
                        fee_cod: 0,
                        price: Number(price.toFixed()),
                        // profitSaleMartket: profitSaleMartket,
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
                    let total = price + formattedFee  + packing_price + insuranceFee
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
                .send({ status: true, new:new_data[0], sender:infoSender });
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getAll = async (req, res)=>{
    try{
        const findAll = await bestOrder.find()
        if(!findAll){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
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

getById = async(req, res)=>{
    try{
        const txLogisticId = req.params.txLogisticId
        const findTC = await bestOrder.findOne({txLogisticId:txLogisticId})
            if(!findTC){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลข txLogisticId ที่ท่านต้องการหา"})
            }
        return res
                .status(200)
                .send({status:true, data:findTC})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delend = async (req, res)=>{
    try{
        const txLogisticId = req.params.txLogisticId
        const delTC = await bestOrder.findOneAndDelete({txLogisticId:txLogisticId})
            if(!delTC){
                return res
                        .status(400)
                        .send({status:false, message:"รายการนี้ถูกลบไปแล้ว"})
            }
        return res
                .status(200)
                .send({status:true, data:delTC})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getMeBooking = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const today = new Date();
            today.setHours(23, 59, 59, 0); // ตั้งเวลาเป็นเที่ยงคืนของวันปัจจุบัน
        const findMe = await bestOrder.find({
            ID:id,
            createdAt: { $lt: today }
          }).sort({ createdAt: -1 }); // -1 หมายถึงเรียงจากมากไปหาน้อย (ล่าสุดไปยังเก่า)
        if(!findMe){
            return res
                    .status(404)
                    .send({status:false, message:"ไม่มีรายการสินค้าของท่าน"})
        }
        return res
                .status(200)
                .send({status:true, data:findMe})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getPartnerBooking = async (req, res)=>{
    try{
        const id = req.params.id
        const findMe = await bestOrder.find({ID:id})
        if(!findMe){
            return res
                    .status(404)
                    .send({status:false, message:"ไม่มีรายการสินค้าของท่าน"})
        }
        return res
                .status(200)
                .send({status:true, data:findMe})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 100000)
    const combinedData = `BE`+data + random;
    const findInvoice = await bestOrder.find({txLogisticId:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000);
        combinedData = `BE`+data + random;

        // เช็คใหม่
        findInvoice = await bestOrder.find({txLogisticId: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

async function invoiceBST() {
    data = `ODHBST`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + random;
    const findInvoice = await bestOrder.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await bestOrder.find({invoice: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = { createOrder, createPDFOrder, statusOrder, statusOrderPush, cancelOrder, priceList, getAll,
                    getById, delend, getMeBooking, getPartnerBooking
                 }