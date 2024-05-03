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
const { costPlus } = require('../../../Models/costPlus');
const { historyWalletShop } = require('../../../Models/shop/shop_history');
const { profitIce } = require('../../../Models/profit/profit.ice');
const { profitPartner } = require('../../../Models/profit/profit.partner');
const { dropOffs } = require('../../../Models/Delivery/dropOff');
const { bestRemoteArea } = require('../../../Models/remote_area/best.area');
const { orderAll } = require('../../../Models/Delivery/order_all');
const { bangkokMetropolitan } = require('../../../Models/postcal_bangkok/postcal.bangkok');
const { priceBase } = require('../../../Models/Delivery/weight/priceBase.express');
const { codPercent } = require('../../../Models/COD/cod.shop.model');

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที

const BEST_URL = process.env.BEST_URL
const keys = process.env.PARTNER_KEY
const PARTNER_ID = process.env.PARTNER_ID
const charset = 'utf-8'

createOrder = async(req, res)=>{
    try{
        const txLogistic = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('txLogisticId : '+txLogistic);
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = req.body.shop_number
        const cost = req.body.cost
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const declared_value = req.body.declared_value
        const total = req.body.total
        const priceOne = req.body.priceOne
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const data = req.body
        const weight = data.parcel.weight 
        const cut_partner = data.parcel.cut_partner 
        const price_remote_area = req.body.price_remote_area

        //ผู้ส่ง
        const senderTel = data.from.tel; 
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }

        const formData = {
            serviceType:"KD_CREATE_WAYBILL_ORDER_NOTIFY",
            bizData:{
                txLogisticId:txLogistic,
                special:"1",
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
                height:data.parcel.height
            },
            partnerID: PARTNER_ID
        }
            if(cod_amount > 0){
                formData.bizData.items.item[0].itemValue = cod_amount
                formData.bizData.itemsValue = cod_amount
                formData.bizData.bankCardOwner = updatedDocument.best.name
                formData.bizData.bankCode = updatedDocument.best.code
                formData.bizData.bankCardNo = updatedDocument.best.card_number
                console.log(cod_amount)
            }
            if(declared_value > 0){
                
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
        const createOrder = await bestOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                cod_amount:cod_amount,
                price: price,
                status:'booking',
                type:'Online',
                price_remote_area:price_remote_area,
                cut_partner: cut_partner,
                total: total,
                ...response.data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        // console.log(createOrder)
        //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
        let profitsPartner
            if(priceOne == 0){ //กรณีไม่ใช่ พาร์ทเนอร์ลูก
                profitsPartner = price - cost
            }else{
                profitsPartner = price - priceOne
            }
        let profitsPartnerOne 
            if(priceOne != 0){
                profitsPartnerOne = priceOne - cost
            }
        let profitsICE = cost - cost_hub
        let profit_partner
        let profit_partnerOne
        let profit_ice
        let profit_iceCOD
        let historyShop
        let findShop
        let profitPlus
        let profitPlusOne
        if(cod_amount == 0){
                findShop = await shopPartner.findOneAndUpdate(
                    {shop_number:shop},
                    { $inc: { credit: -cut_partner } },
                    {new:true})
                    if(!findShop){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                    }
                console.log(findShop.credit)
                    
                const plus = findShop.credit + cut_partner
                const history = {
                        ID: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        amount: cut_partner,
                        before: plus,
                        after: findShop.credit,
                        type: 'BEST(ICE)',
                        remark: "ขนส่งสินค้า(BEST)"
                    }
                // console.log(history)
                historyShop = await historyWalletShop.create(history)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
                const pf = {
                        wallet_owner: findShop.partnerID,
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsPartner,
                        express: 'BEST(ICE)',
                        type: 'โอนเงิน',
                }
                profit_partner = await profitPartner.create(pf)
                    if(!profit_partner){
                        return  res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                    }
                profitPlus = await Partner.findOneAndUpdate(
                        {_id:findShop.partnerID},
                        { $inc: { profit: +profitsPartner } },
                        {new:true, projection: { profit: 1 }})
                        if(!profitPlus){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                        }
                const pfICE = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsICE,
                        express: 'BEST(ICE)',
                        type: 'เปอร์เซ็นจากต้นทุน',
                }
                profit_ice = await profitIce.create(pfICE)
                    if(!profit_ice){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                    }
                if(priceOne != 0){
                        const findUpline = await Partner.findOne({_id:findShop.partnerID})
                        const headLine = findUpline.upline.head_line
    
                        const pfPartnerOne = {
                                    wallet_owner: headLine,
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: createOrder.txLogisticId,
                                    profit: profitsPartnerOne,
                                    express: 'BEST(ICE)',
                                    type: 'Partner downline',
                                }
                        profit_partnerOne = await profitPartner.create(pfPartnerOne)
                            if(!profit_partnerOne){
                                return  res
                                        .status(400)
                                        .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                            }
                        profitPlusOne = await Partner.findOneAndUpdate(
                                {_id:headLine},
                                { $inc: { 
                                    profit: +profitsPartnerOne,
                                    credits: +profitsPartnerOne
                                    } 
                                },
                                {new:true, projection: { profit: 1 }})
                                if(!profitPlusOne){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                            }
                    }
        }else{
            const findShopTwo = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -cut_partner } },
                {new:true})
                if(!findShopTwo){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShopTwo.credit)
    
            const plus = findShopTwo.credit + cut_partner
                const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: createOrder.txLogisticId,
                    amount: cut_partner,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'BEST(ICE)',
                    remark: "ขนส่งสินค้าแบบ COD(BEST)"
                }
                // console.log(history)
                historyShop = await historyWalletShop.create(historytwo)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
                const pf = {
                        wallet_owner: findShopTwo.partnerID,
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsPartner,
                        express: 'BEST(ICE)',
                        type: 'COD',
                }
                profit_partner = await profitPartner.create(pf)
                    if(!profit_partner){
                        return  res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                    }
                profitPlus = await Partner.findOneAndUpdate(
                        {_id:findShopTwo.partnerID},
                        { $inc: { profit: +profitsPartner } },
                        {new:true, projection: { profit: 1 }})
                        if(!profitPlus){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                        } 
                const pfICE = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsICE,
                        express: 'BEST(ICE)',
                        type: 'เปอร์เซ็นจากต้นทุน',
                }
                profit_ice = await profitIce.create(pfICE)
                    if(!profit_ice){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                    }
                const pfIceCOD = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: fee_cod,
                        express: 'BEST(ICE)',
                        type: 'COD',
                }
                
                profit_iceCOD = await profitIce.create(pfIceCOD)
                    if(!profit_iceCOD){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                    }

                if(priceOne != 0){
                        const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                        const headLine = findUpline.upline.head_line
    
                        const pfPartnerOne = {
                                wallet_owner: headLine,
                                Orderer: id,
                                role: role,
                                shop_number: shop,
                                orderid: createOrder.txLogisticId,
                                profit: profitsPartnerOne,
                                express: 'BEST(ICE)',
                                type: 'Partner downline',
                            }
                        profit_partnerOne = await profitPartner.create(pfPartnerOne)
                            if(!profit_partnerOne){
                                return  res
                                        .status(400)
                                        .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                            }
                        profitPlusOne = await Partner.findOneAndUpdate(
                                {_id:headLine},
                                { $inc: { 
                                    profit: +profitsPartnerOne,
                                    credits: +profitsPartnerOne
                                    } 
                                },
                                {new:true, projection: { profit: 1 }})
                                if(!profitPlusOne){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                }
                    }
        }
        return res
                .status(200)
                .send({
                    status:true, 
                    order: createOrder,
                    history: historyShop,
                    // shop: findShop
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne
                })
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

createPDFOrder = async(req, res)=>{
    try{
        const txLogistic = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('txLogisticId : '+txLogistic);
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = req.body.shop_number
        const cost = req.body.cost
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const insuranceFee = req.body.insuranceFee
        const declared_value = req.body.declared_value
        const priceOne = req.body.priceOne
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const data = req.body
        const weight = data.parcel.weight
        const cut_partner = req.body.cut_partner 
        const price_remote_area = req.body.price_remote_area

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
                height:data.parcel.height
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
            
        const createOrder = await bestOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
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
                cod_amount:cod_amount,
                price: price,
                priceOne: priceOne,
                type:'PDF',
                fee_cod: fee_cod,
                total: total,
                cut_partner: cut_partner,
                price_remote_area: price_remote_area,
                insuranceFee: insuranceFee,
                declared_value: declared_value,
                pdfStream: base64Data,
                ...response.data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        const createOrderAll = await orderAll.create(
                {
                    ID:id,
                    shop_number:shop,
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
                    cod_amount:cod_amount,
                    priceOne: priceOne,
                    price: price,
                    type:'PDF',
                    fee_cod: fee_cod,
                    total: total,
                    cut_partner: cut_partner,
                    express: 'BEST',
                    price_remote_area: price_remote_area,
                    insuranceFee: insuranceFee,
                    declared_value: declared_value,
                    pdfStream: base64Data,
                    ...response.data
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์(ALL)ได้"})
            }
            // console.log(createOrder)
        //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
        let profitsPartner
            if(priceOne == 0){ //กรณีไม่ใช่ พาร์ทเนอร์ลูก
                profitsPartner = price - cost
            }else{
                profitsPartner = price - priceOne
            }
        let profitsPartnerOne 
            if(priceOne != 0){
                profitsPartnerOne = priceOne - cost
            }
        let profitsICE = cost - cost_hub
        let profit_partner
        let profit_partnerOne
        let profit_ice
        let profit_iceCOD
        let historyShop
        let findShop
        let profitPlus
        let profitPlusOne
        if(cod_amount == 0){
                findShop = await shopPartner.findOneAndUpdate(
                    {shop_number:shop},
                    { $inc: { credit: -cut_partner } },
                    {new:true})
                    if(!findShop){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                    }
                console.log(findShop.credit)
                    
                const plus = findShop.credit + cut_partner
                const history = {
                        ID: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        amount: cut_partner,
                        before: plus,
                        after: findShop.credit,
                        type: 'BEST(ICE)',
                        remark: "ขนส่งสินค้า(BEST)"
                    }
                // console.log(history)
                historyShop = await historyWalletShop.create(history)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
                const pf = {
                        wallet_owner: findShop.partnerID,
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsPartner,
                        express: 'BEST(ICE)',
                        type: 'โอนเงิน',
                }
                profit_partner = await profitPartner.create(pf)
                    if(!profit_partner){
                        return  res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                    }
                profitPlus = await Partner.findOneAndUpdate(
                        {_id:findShop.partnerID},
                        { $inc: { profit: +profitsPartner } },
                        {new:true, projection: { profit: 1 }})
                        if(!profitPlus){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                        }

                const pfICE = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsICE,
                        express: 'BEST(ICE)',
                        type: 'กำไรจากต้นทุน',
                }
                profit_ice = await profitIce.create(pfICE)
                    if(!profit_ice){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                    }
                
                if(priceOne != 0){
                        const findUpline = await Partner.findOne({_id:findShop.partnerID})
                        const headLine = findUpline.upline.head_line
    
                        const pfPartnerOne = {
                                    wallet_owner: headLine,
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: createOrder.txLogisticId,
                                    profit: profitsPartnerOne,
                                    express: 'BEST(ICE)',
                                    type: 'Partner downline',
                                }
                        profit_partnerOne = await profitPartner.create(pfPartnerOne)
                            if(!profit_partnerOne){
                                return  res
                                        .status(400)
                                        .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                            }
                        profitPlusOne = await Partner.findOneAndUpdate(
                                {_id:headLine},
                                { $inc: { 
                                    profit: +profitsPartnerOne,
                                    credits: +profitsPartnerOne
                                    } 
                                },
                                {new:true, projection: { profit: 1, credits: 1 }})
                                if(!profitPlusOne){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                }
                        }
        }else{
            const findShopTwo = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -cut_partner } },
                {new:true})
                if(!findShopTwo){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShopTwo.credit)
    
            const plus = findShopTwo.credit + cut_partner
                const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: createOrder.txLogisticId,
                    amount: cut_partner,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'BEST(ICE)',
                    remark: "ขนส่งสินค้าแบบ COD(BEST)"
                }
                // console.log(history)
                historyShop = await historyWalletShop.create(historytwo)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
                const pf = {
                        wallet_owner: findShopTwo.partnerID,
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsPartner,
                        express: 'BEST(ICE)',
                        type: 'COD',
                }
                profit_partner = await profitPartner.create(pf)
                    if(!profit_partner){
                        return  res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                    }
                profitPlus = await Partner.findOneAndUpdate(
                        {_id:findShopTwo.partnerID},
                        { $inc: { profit: +profitsPartner } },
                        {new:true, projection: { profit: 1 }})
                        if(!profitPlus){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                        } 
                // console.log(profitPlus)
                const pfICE = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: profitsICE,
                        express: 'BEST(ICE)',
                        type: 'กำไรจากต้นทุน',
                }
                profit_ice = await profitIce.create(pfICE)
                    if(!profit_ice){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                    }
                const pfIceCOD = {
                        Orderer: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        profit: fee_cod,
                        express: 'BEST(ICE)',
                        type: 'COD',
                }
                
                profit_iceCOD = await profitIce.create(pfIceCOD)
                    if(!profit_iceCOD){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                    }
                
                if(priceOne != 0){
                        const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                        const headLine = findUpline.upline.head_line
    
                        const pfPartnerOne = {
                                wallet_owner: headLine,
                                Orderer: id,
                                role: role,
                                shop_number: shop,
                                orderid: createOrder.txLogisticId,
                                profit: profitsPartnerOne,
                                express: 'BEST(ICE)',
                                type: 'Partner downline',
                            }
                        profit_partnerOne = await profitPartner.create(pfPartnerOne)
                            if(!profit_partnerOne){
                                return  res
                                        .status(400)
                                        .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                            }
                        console.log(headLine)
                        profitPlusOne = await Partner.findOneAndUpdate(
                                {_id:headLine},
                                { $inc: { 
                                    profit: +profitsPartnerOne,
                                    credits: +profitsPartnerOne
                                    } 
                                },
                                {new:true, projection: { profit: 1, credits: 1 }})
                                if(!profitPlusOne){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                }
                    }
        }
        return res
                .status(200)
                .send({
                    status:true, 
                    order: createOrderAll,
                    history: historyShop,
                    // shop: findShop
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne,
                    // best: response.data
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
        const findCancel = await bestOrder.findOne({txLogisticId:txLogisticId})
            if(!findCancel){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txLogisticId ได้"})
            }else if(findCancel.status == 'cancel'){
                return res
                        .status(200)
                        .send({status:true, message:"ออเดอร์นี้ถูก Cancel ไปแล้ว"})
            }
        const newData = await doSign(formData, charset, keys)
            console.log(newData)
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
                const findPno = await bestOrder.findOneAndUpdate(
                    {txLogisticId:txLogisticId},
                    {
                        status:"cancel",
                        remark: reason
                    },
                    {new:true})
                    if(!findPno){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลข LogisticId(BEST) หรืออัพเดทข้อมูลได้"})
                    }
                return res
                        .status(200)
                        .send({status:false, data:findPno})
        }
        //         if(findPno.cod_amount == 0){
        //                 const findShop = await shopPartner.findOneAndUpdate(
        //                     {shop_number:findPno.shop_number},
        //                     { $inc: { credit: +findPno.price } },
        //                     {new:true})
        //                     if(!findShop){
        //                         return res
        //                                 .status(400)
        //                                 .send({status:false,message:"ไม่สามารถค้นหาหรืออัพเดทร้านค้าได้"})
        //                     }
        //                 let diff = findShop.credit - findPno.price
        //                 let history = {
        //                         ID: id,
        //                         role: role,
        //                         shop_number: findPno.shop_number,
        //                         orderid: txLogisticId,
        //                         amount: findPno.price,
        //                         before: diff,
        //                         after: findShop.credit,
        //                         type: 'BEST(ICE)',
        //                         remark: "ยกเลิกขนส่งสินค้า(BEST)"
        //                 }
                        
        //                 const historyShop = await historyWalletShop.create(history)
        //                     if(!historyShop){
        //                         console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //                     }

        //                 const delProfitPartner = await profitPartner.deleteMany({orderid:txLogisticId})
        //                     if(!delProfitPartner){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txLogisticId(BEST) ได้"})
        //                     }
        
        //                 const delProfitIce = await profitIce.findOneAndDelete({orderid:txLogisticId})
        //                     if(!delProfitIce){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txLogisticId(BEST) ของคุณไอซ์ได้"})
        //                     }
        //             return res
        //                     .status(200)
        //                     .send({
        //                         status:true, 
        //                         order: findPno, 
        //                         // shop: findShop,
        //                         history: historyShop,
        //                         delPartner: delProfitPartner,
        //                         delIce: delProfitIce
        //                     })
        //         }else{
        //                 const findShopCOD = await historyWalletShop.findOne({orderid:txLogisticId})
        //                 if(!findShopCOD){
        //                     return res
        //                             .status(404)
        //                             .send({status:false, message:"ไม่สามารถค้นหาหมายเลข LogisticId ได้"})
        //                 }
        //                 let history = {
        //                         ID: id,
        //                         role: role,
        //                         shop_number: findPno.shop_number,
        //                         orderid: txLogisticId,
        //                         amount: findPno.price,
        //                         before: findShopCOD.before,
        //                         after: 'COD',
        //                         type: 'BEST(ICE)',
        //                         remark: "ยกเลิกขนส่งสินค้าแบบ COD(BEST)"
        //                 }
        //                 const historyShop = await historyWalletShop.create(history)
        //                     if(!historyShop){
        //                         console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //                     }
                            
        //                 const delProfitPartner = await profitPartner.deleteMany({orderid:txLogisticId}) //ทำการลบประวัติผลกำไรของ Partner
        //                     if(!delProfitPartner){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txLogisticId(BEST) ได้"})
        //                     }
        //                 const delProfitIce = await profitIce.deleteMany( //ทำการลบประวัติผลกำไรของ คุณไอซ์
        //                         {
        //                             orderid:txLogisticId
        //                         }
        //                     )
        //                     if(!delProfitIce){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txLogisticId(BEST) ของคุณไอซ์ได้"})
        //                     }
        //             return res
        //                     .status(200)
        //                     .send({
        //                         status:true, 
        //                         order: findPno, 
        //                         history: historyShop,
        //                         delPartner: delProfitPartner,
        //                         delIce: delProfitIce
        //                     })
        //         }
        // }
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
                        .send({staus:false, message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        if(weight == 0 || weight == undefined){
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
                        message: `ลำดับที่ ${no} กรุณาระบุค่า COD หรือ มูลค่าสินค้า(ประกัน) เป็นจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม`});
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

                    let pFirst = findShopCod.express.find((item)=> item.express == "J&T")

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

        //เช็คราคาไตรมาสของ BEST
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

                // คำนวนต้นทุนของร้านค้า
                let cost_hub
                let price
                let profit_partner
                let profit = []
                let status = null;
                let cut_partner
                let cod_profit
                let profitSaleMartket
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
                        profitSaleMartket = price - resultBase.salesBangkok_metropolitan
                        profit_partner = resultBase.salesBangkok_metropolitan - cost_hub
                        cut_partner = resultBase.salesBangkok_metropolitan

                        //cost ต้องบวกกับ กำไร cod ของผู้ส่ง เพราะว่า เค้าเก็บเงินหน้าร้านมาแล้ว สมมุติ ค่าธรรมเนียม COD อยู่ที่ 15 บาท กำไร COD ของเขาคือ 2 บาท 
                        //เขาเก็บเงินจากผู้ส่ง หน้าร้าน มาแล้ว ดังนั้นเวลาหัก Wallet ต้องหัก กำไร COD ของ Partner ผู้ทำการสั่ง ORDER ด้วย เพราะเขาได้เงินจากหน้าร้านมาแล้ว
                        let cost = resultP.costBangkok_metropolitan

                        let total = profit_partner + cod_profit
                            let dataOne = {
                                id: result.owner_id,
                                cost: parseFloat(cost.toFixed(2)),
                                profit: parseFloat(profit_partner.toFixed(2)),
                                cod_profit: parseFloat(cod_profit.toFixed(2)),
                                total: parseFloat(total.toFixed(2))
                            }
                        profit.push(dataOne)
                }else{
                        cost_hub = resultP.costUpcountry
                        // console.log(cost_hub)
                        price = resultP.salesUpcountry
                        profitSaleMartket = price - resultBase.salesUpcountry
                        profit_partner = resultBase.salesUpcountry - cost_hub
                        cut_partner = resultBase.salesUpcountry
                        let cost = resultP.costUpcountry
                        let total = profit_partner + cod_profit
                            let dataOne = {
                                id: result.owner_id,
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
                        cost: parseFloat(cost.toFixed(2)),
                        profit: parseFloat(profitTwo.toFixed(2)),
                        cod_profit: parseFloat(cod_iceprofit.toFixed(2)),
                        total: parseFloat(total.toFixed(2))
                    }
                    profit.push(dataICE)
                    cost_hub -= profitTwo
                }
                // console.log(profit)
                v = {
                        ...req.body,
                        express: "BEST",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cost_base: cut_partner,
                        fee_cod: 0,
                        price: Number(price.toFixed()),
                        profitSaleMartket: profitSaleMartket,
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
                                    v.total = total1
                                    v.cut_partner = cut_partner + price_remote_area + insuranceFee + formattedFee
                                    v.price_remote_area = price_remote_area
                            }else{
                                    v.cut_partner = cut_partner + insuranceFee + formattedFee
                                    v.total = total
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