const { doSign } = require('./best.sign')
const axios = require('axios')
const dayjs = require('dayjs');
const fs = require('fs');
const { bestOrder } = require('../../../Models/Delivery/best_express/order')
const { priceWeightBest } = require('../../../Models/Delivery/best_express/priceWeightBest');
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
        if(cod_amount != 0){
            formData.bizData.items.item[0].itemValue = cod_amount
            formData.bizData.itemsValue = cod_amount
            formData.bizData.bankCardOwner = updatedDocument.best.name
            formData.bizData.bankCode = updatedDocument.best.code
            formData.bizData.bankCardNo = updatedDocument.best.card_number
            console.log(cod_amount)
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
                type:'PDF',
                fee_cod: fee_cod,
                total: total,
                cut_partner: cut_partner,
                price_remote_area: price_remote_area,
                pdfStream: base64Data,
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
                    order: createOrder,
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
        const formData = req.body
        const shop = formData.shop_number
        const weight = formData.parcel.weight
        let reqCod = req.body.cod
        let percentCod
        let price_remote_area
        if(weight == 0){
            return res
                    .status(400)
                    .send({status:false, message:"กรุณาระบุน้ำหนัก"})
        }
        const findForCost = await shopPartner.findOne({shop_number:shop})//เช็คว่ามีร้านค้าอยู่จริงหรือเปล่า
            if(!findForCost){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
            }
        const result  = await priceWeightBest.find(
            {
                id_shop: findForCost._id,
                weight: {$gte: weight}
            })
            .sort({weight:1})
            .limit(1)
            .exec()

            if(result.length == 0){
                return res
                        .status(400)
                        .send({status: false, message:"น้ำหนักของคุณมากเกินไป"})
            }
            if(reqCod > 0){
                const findCod = await codExpress.findOne({express:"BEST"})
                percentCod = findCod.percent
            }
        
        const cod = percentCod
        
        const findPartner = await Partner.findOne({partnerNumber:findForCost.partner_number}) //เช็คว่ามี partner เจ้าของ shop จริงหรือเปล่า
            if(!findPartner){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขพาร์ทเนอร์ของท่าน"})
            }
        
        const upline = findPartner.upline.head_line

        const findPostCode = await bestRemoteArea.findOne({Postcode:formData.to.postcode})
            if(findPostCode){
                price_remote_area = findPostCode.Price
            }
        let new_data = []
        if(upline === 'ICE'){
                let v = null;
                let p = findForCost.express.find(element => element.courier_code == 'J&T');
                        // console.log(p.percent_orderHUB, p.percent_shop, p.on_off)
                            if(p.on_off == false){
                                console.log(`Skipping 'J&T' because courier is off`)
                                return res
                                        .status(200)
                                        .send({status:true, result: new_data })
                            }else if (!p) {
                                console.log(`ยังไม่มี courier name: 'J&T'`);
                            }else if(p.percent_orderHUB <= 0 || p.percent_shop <= 0){
                                return res
                                        .status(400)
                                        .send({status:false, message:`ระบบยังไม่ได้กำหนดราคาขนส่ง J&T กรุณาติดต่อ Admin`})
                            }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = result[0].price;
                    let cost = Math.ceil(cost_hub + p.percent_orderHUB); // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                    let price = Math.ceil(cost + p.percent_shop);
                    let status = null;
                    let cod_amount = 0

                    try {
                        await Promise.resolve(); // ใส่ Promise.resolve() เพื่อให้มีตัวแปรที่ await ได้
                        if (findForCost.credit < price) {
                            status = 'จำนวนเงินของท่านไม่เพียงพอ';
                        } else {
                            status = 'พร้อมใช้บริการ';
                        }
                    } catch (error) {
                        console.error('เกิดข้อผิดพลาดในการรอรับค่า');
                    }
                    v = {
                        express: "BEST(ICE)",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        fee_cod: 0,
                        profitPartner: 0,
                        priceOne: 0,
                        price: Number(price.toFixed()),
                        total: 0,
                        cut_partner: 0,
                        status: status
                    };
                    if (cod !== undefined) {
                        let fee = (reqCod * percentCod)/100
                        let formattedFee = parseFloat(fee.toFixed(2));
                        let total = price + formattedFee
                        let profitPartner = price - cost
                        let cut_partner = total - profitPartner
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.fee_cod = formattedFee
                            v.profitPartner = profitPartner
                                if(price_remote_area != undefined){
                                    let total1 = total + price_remote_area
                                        v.total = total1
                                        v.cut_partner = total1 - profitPartner
                                        v.price_remote_area = price_remote_area
                                            // if(reqCod > total1){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD + ราคาพื้นที่ห่างไกล) จึงเห็นและสั่ง order ได้
                                            //     new_data.push(v);
                                            // }
                                }else{
                                    v.cut_partner = cut_partner
                                    v.total = total
                                        // if(reqCod > total){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม(ค่าขนส่ง + ค่าธรรมเนียม COD) จึงเห็นและสั่ง order ได้
                                        //     new_data.push(v);
                                        // }
                                }
                            new_data.push(v);
                    }else{
                        let profitPartner = price - cost
                        if(price_remote_area != undefined){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                            let total = price + price_remote_area
                                v.price_remote_area = price_remote_area
                                v.total = total
                                v.cut_partner = total - profitPartner
                                v.profitPartner = profitPartner
                        }else{
                            v.profitPartner = profitPartner
                            v.total = price
                            v.cut_partner = price - profitPartner
                        }
                        new_data.push(v);
                    }
        }else{
            const costFind = await costPlus.findOne(
                {_id:upline, 'cost_level.partner_number':findPartner.partnerNumber},
                { _id: 0, 'cost_level.$': 1 })
            if(!costFind){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาหมายเลขแนะนำไม่เจอ"})
            }else if(costFind.cost_level[0].cost_plus === ""){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณารอพาร์ทเนอร์ที่ทำการแนะนำระบุส่วนต่าง"})
            }
            const cost_plus = parseInt(costFind.cost_level[0].cost_plus, 10);
                let v = null;
                let p = findForCost.express.find(element => element.courier_code == 'J&T');
                // console.log(p.percent_orderHUB, p.percent_shop, p.on_off)
                    if(p.on_off == false){
                        console.log(`Skipping 'J&T' because courier is off`)
                        return res
                                .status(200)
                                .send({status:true, result: new_data })
                    }else if (!p) {
                        console.log(`ยังไม่มี courier name: 'J&T'`);
                    }else if(p.percent_orderHUB <= 0 || p.percent_shop <= 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ระบบยังไม่ได้กำหนดราคาขนส่ง J&T กรุณาติดต่อ Admin`})
                    }
                // คำนวนต้นทุนของร้านค้า
                let cost_hub = result[0].price;
                let cost = Math.ceil(cost_hub + p.percent_orderHUB) // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                let priceOne = Math.ceil(cost + p.percent_shop)
                let price = priceOne + cost_plus

                let cod_amount = 0
                let status = null;
                    try {
                        await Promise.resolve(); // ใส่ Promise.resolve() เพื่อให้มีตัวแปรที่ await ได้
                        if (findForCost.credit < price) {
                            status = 'จำนวนเงินของท่านไม่เพียงพอ';
                        } else {
                            status = 'พร้อมใช้บริการ';
                        }
                    } catch (error) {
                        console.error('เกิดข้อผิดพลาดในการรอรับค่า');
                    }
                    v = {
                        express: "BEST(ICE)",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        fee_cod: 0,
                        profitPartner: 0,
                        priceOne: priceOne,
                        price: Number(price.toFixed()),
                        total: 0,
                        cut_partner: 0,
                        status: status
                    };
                    console.log(v)
                    if (cod !== undefined) {
                        let fee = (reqCod * percentCod)/100
                        let formattedFee = parseFloat(fee.toFixed(2));
                        let total = price + formattedFee
                        let profitPartner = price - priceOne
                        let cut_partner = total - profitPartner
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.fee_cod = formattedFee
                            v.profitPartner = profitPartner
                                if(price_remote_area != undefined){
                                    let total1 = total + price_remote_area
                                        v.total = total1
                                        v.cut_partner = total1 - profitPartner
                                        v.price_remote_area = price_remote_area
                                            // if(reqCod > total1){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD + ราคาพื้นที่ห่างไกล) จึงเห็นและสั่ง order ได้
                                            //     new_data.push(v);
                                            // }
                                }else{
                                    v.cut_partner = cut_partner
                                    v.total = total
                                        // if(reqCod > total){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม(ค่าขนส่ง + ค่าธรรมเนียม COD) จึงเห็นและสั่ง order ได้
                                        //     new_data.push(v);
                                        // }
                                }
                            new_data.push(v);
                    }else{
                        let profitPartner = price - priceOne
                        if(price_remote_area != undefined){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                            let total = price + price_remote_area
                                v.price_remote_area = price_remote_area
                                v.total = total
                                v.cut_partner = total - profitPartner
                                v.profitPartner = profitPartner
                        }else{
                            v.profitPartner = profitPartner
                            v.total = price
                            v.cut_partner = price - profitPartner
                        }
                        new_data.push(v);
                    }
        }
        return res
                .status(200)
                .send({ status: true, data: result, new:new_data });
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