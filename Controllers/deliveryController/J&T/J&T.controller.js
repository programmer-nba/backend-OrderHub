const { generateJT } = require("./generate.signJ&T")
const { jntOrder } = require("../../../Models/Delivery/J&T/orderJT");
const dayjs = require('dayjs')
const axios = require('axios');
const { priceWeight } = require("../../../Models/Delivery/J&T/priceWeight");
const { Partner } = require("../../../Models/partner");
const { shopPartner } = require("../../../Models/shop/shop_partner");
const { costPlus } = require("../../../Models/costPlus");
const { PercentCourier } = require("../../../Models/Delivery/ship_pop/percent");
const { codExpress } = require("../../../Models/COD/cod.model");
const { historyWalletShop } = require("../../../Models/shop/shop_history");
const { historyWallet } = require("../../../Models/topUp/history_topup");
const { profitIce } = require("../../../Models/profit/profit.ice");
const { profitPartner } = require("../../../Models/profit/profit.partner");
const { dropOffs } = require("../../../Models/Delivery/dropOff");

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
apiUrl = process.env.JT_URL
ecom_id = process.env.ECOMPANY_ID
customer_id = process.env.CUSTOMER_ID

createOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const data = req.body
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const cost = req.body.cost
        const cost_hub = req.body.cost_hub

        const fee_cod = req.body.fee_cod
        const total = req.body.total

        const priceOne = req.body.priceOne
        const shop = req.body.shop_number
        const weight = data.parcel.weight //หน่วยเป็น kg อยู่แล้วไม่ต้องแก้ไข
        const txlogisticid = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+txlogisticid);
        const invoice = await invoiceJNT()
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
                "isinsured": "0",
                // "offerfee": "2000"
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        if(cod_amount != 0){
            fromData.logistics_interface.itemsvalue = cod_amount
            console.log(cod_amount)
        }
         //ผู้ส่ง
         const senderTel = data.from.tel;
         console.log(senderTel)
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
                        .send({status:false, message:"ไม่สามารถส่งคำร้องขอไปยัง J&T ได้"})
            }else if(response.data.responseitems[0].reason == "S10"){
                return res
                        .status(404)
                        .send({status:false, message:"หมายเลขรหัสการสั่งซื้อเกิดการซ้ำกัน กรุณากดสร้างสินค้าอีกครั้ง"})
            }else if(response.data.responseitems[0].reason == "B0101"){
                return res
                        .status(404)
                        .send({status:false, message:"กรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง(10 หลัก)"})
            }
        const new_data = response.data.responseitems[0]
        const createOrder = await jntOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
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
                cod_amount:cod_amount,
                fee_cod: fee_cod,
                total: total,
                price: price,
                ...new_data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
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
        let profitSender
        let historyShop
        let findShop
        let profitPlus
        let profitPlusOne
        if(cod_amount == 0){
            findShop = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: total } },
                {new:true})
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShop.credit)
                
            const plus = findShop.credit + total
            const history = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    amount: total,
                    before: plus,
                    after: findShop.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้า(J&T)"
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
                    orderid: new_data.txlogisticid,
                    profit: profitsPartner,
                    express: 'J&T',
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
                    orderid: new_data.txlogisticid,
                    profit: profitsICE,
                    express: 'J&T',
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
                                orderid: new_data.txlogisticid,
                                profit: profitsPartnerOne,
                                express: 'J&T',
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
                            { $inc: { profit: +profitsPartnerOne } },
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
                { $inc: { credit: total } },
                {new:true})
                if(!findShopTwo){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShopTwo.credit)
    
            const plus = findShopTwo.credit + total
            const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    amount: total,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้าแบบ COD(J&T)"
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
                    orderid: new_data.txlogisticid,
                    profit: profitsPartner,
                    express: 'J&T',
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
                    orderid: new_data.txlogisticid,
                    profit: profitsICE,
                    express: 'J&T',
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
                    orderid: new_data.txlogisticid,
                    profit: fee_cod,
                    express: 'J&T',
                    type: 'COD',
            }
            profit_iceCOD = await profitIce.create(pfIceCOD)
                if(!profit_iceCOD){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                }

            const pfIceSender = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: cod_amount,
                    express: 'J&T',
                    type: 'COD(SENDER)',
                    'bookbank.name': updatedDocument.flash_pay.name,
                    'bookbank.card_number': updatedDocument.flash_pay.card_number,
                    'bookbank.aka': updatedDocument.flash_pay.aka,
            }
            profitSender = await profitIce.create(pfIceSender)
                if(!profitSender){
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
                            orderid: new_data.txlogisticid,
                            profit: profitsPartnerOne,
                            express: 'J&T',
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
                            { $inc: { profit: +profitsPartnerOne } },
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
                    order: response.data,
                    history: historyShop,
                    // shop: findShop,
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitSender: profitSender,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne
                })
    }catch(err){
        // console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

trackingOrder = async (req, res)=>{
    try{
        const txlogisticid = req.body.txlogisticid
        const formData = {
            "logistics_interface":{
                "billcode": txlogisticid,
                "querytype":"2",
                "lang":"th",
                "customerid":customer_id
            },
            "msg_type": "TRACKQUERY",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(formData)
            console.log(newData)
        const response = await axios.post(`${apiUrl}/track/trackForJson`,newData,{
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

cancelOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const txlogisticid = req.body.txlogisticid
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
        const findCancel = await jntOrder.findOne({txlogisticid:txlogisticid})
            if(!findCancel){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txlogisticid ได้"})
            }else if(findCancel.status == 'cancel'){
                return res
                        .status(200)
                        .send({status:true, message:"ออเดอร์นี้ถูก Cancel ไปแล้ว"})
            }
        const newData = await generateJT(formData)
            console.log(newData)
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
        if(response.data.responseitems[0].reason == 'S12'){ //S12 = Cancel order interface, Order status is GOT can not cancel order
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถทำการยกเลิกออเดอร์นี้ได้"})
        }else{
                const findPno = await jntOrder.findOneAndUpdate(
                    {txlogisticid:txlogisticid},
                    {status:"cancel"},
                    {new:true})
                    if(!findPno){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Logisticid(J&T) หรืออัพเดทข้อมูลได้"})
                    }
                return res
                        .status(200)
                        .send({status:false, data:findPno})
        }
            //     if(findPno.cod_amount == 0){
            //         const findShop = await shopPartner.findOneAndUpdate(
            //             {shop_number:findPno.shop_number},
            //             { $inc: { credit: +findPno.price } },
            //             {new:true})
            //             if(!findShop){
            //                 return res
            //                         .status(400)
            //                         .send({status:false,message:"ไม่สามารถค้นหาหรืออัพเดทร้านค้าได้"})
            //             }
            //         let diff = findShop.credit - findPno.price
            //         let history = {
            //                 ID: id,
            //                 role: role,
            //                 shop_number: findPno.shop_number,
            //                 orderid: txlogisticid,
            //                 amount: findPno.price,
            //                 before: diff,
            //                 after: findShop.credit,
            //                 type: 'J&T',
            //                 remark: "ยกเลิกขนส่งสินค้า(J&T)"
            //         }
            //         const historyShop = await historyWalletShop.create(history)
            //             if(!historyShop){
            //                 console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
            //             }
            //         const delProfitPartner = await profitPartner.deleteMany({orderid:txlogisticid})
            //             if(!delProfitPartner){
            //                 return res
            //                         .status(404)
            //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txlogisticid ได้"})
            //             }
    
            //         const delProfitIce = await profitIce.findOneAndDelete({orderid:txlogisticid})
            //             if(!delProfitIce){
            //                 return res
            //                         .status(404)
            //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข txlogisticid ของคุณไอซ์ได้"})
            //             }
            //         return res
            //                 .status(200)
            //                 .send({
            //                     status:true, 
            //                     order: findPno, 
            //                     // shop: findShop,
            //                     history: historyShop,
            //                     delPartner: delProfitPartner,
            //                     delIce: delProfitIce
            //                 })
            //     }else{
            //         const findShopCOD = await historyWalletShop.findOne({orderid:txlogisticid})
            //             if(!findShopCOD){
            //                 return res
            //                         .status(404)
            //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข pno ได้"})
            //             }
            //         let history = {
            //                 ID: id,
            //                 role: role,
            //                 shop_number: findPno.shop_number,
            //                 orderid: txlogisticid,
            //                 amount: findPno.price,
            //                 before: findShopCOD.before,
            //                 after: 'COD',
            //                 type: 'FLE(ICE)',
            //                 remark: "ยกเลิกขนส่งสินค้าแบบ COD(FLASHตรง)"
            //         }
            //         const historyShop = await historyWalletShop.create(history) //ทำการบันทึกประวัติการสั่งซื้อของ Shop
            //             if(!historyShop){
            //                 console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
            //             }
            //         const delProfitPartner = await profitPartner.deleteMany({orderid:txlogisticid}) //ทำการลบประวัติผลกำไรของ Partner
            //             if(!delProfitPartner){
            //                 return res
            //                         .status(404)
            //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ได้"})
            //             }
            //         const delProfitIce = await profitIce.deleteMany( //ทำการลบประวัติผลกำไรของ คุณไอซ์
            //                 {
            //                     orderid:txlogisticid
            //                 }
            //             )
            //             if(!delProfitIce){
            //                 return res
            //                         .status(404)
            //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ของคุณไอซ์ได้"})
            //             }
            //         return res
            //                 .status(200)
            //                 .send({
            //                     status:true, 
            //                     order: findPno, 
            //                     history: historyShop,
            //                     delPartner: delProfitPartner,
            //                     delIce: delProfitIce
            //                 })
            //     }
            // }
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

priceList = async (req, res)=>{
    // console.log(req.body)
    try{
        const percent = await PercentCourier.find();
        const formData = req.body
        const shop = formData.shop_number
        const weight = formData.parcel.weight * 1000
        let reqCod = req.body.cod
        let percentCod 
        const result  = await priceWeight.find({weight: {$gte: weight}})
            .sort({weight:1})
            .limit(1)
            .exec()

            if(result.length == 0){
                return res
                        .status(400)
                        .send({status: false, message:"น้ำหนักของคุณมากเกินไป"})
            }
            if(reqCod > 0){
                const findCod = await codExpress.findOne({express:"J&T"})
                percentCod = findCod.percent
            }
        const cod = percentCod
        const findForCost = await shopPartner.findOne({shop_number:shop})//เช็คว่ามีร้านค้าอยู่จริงหรือเปล่า
            if(!findForCost){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
            }
        
        const findPartner = await Partner.findOne({partnerNumber:findForCost.partner_number}) //เช็คว่ามี partner เจ้าของ shop จริงหรือเปล่า
            if(!findPartner){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขพาร์ทเนอร์ของท่าน"})
            }
        
        const upline = findPartner.upline.head_line

        let new_data = []
        if(upline === 'ICE'){
            let v = null;
            let p = percent.find((c) => c.courier_code === 'J&T');
                if (!p) {
                    console.log(`ยังไม่มี courier name: J&T`);
                }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = result[0].price;
                    let cost = Math.ceil(cost_hub + p.percent_orderHUB); // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                    let price = Math.ceil(cost + p.percent_shop);
                    let priceInteger = reqCod
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
                        express: "J&T",
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        fee_cod: 0,
                        profitPartner: 0,
                        priceOne: 0,
                        price: Number(price.toFixed()),
                        total: 0,
                        status: status
                    };
                    if (cod !== undefined) {
                        let fee = (reqCod * percentCod)/100
                        let formattedFee = parseFloat(fee.toFixed(2));
                        let total = price + formattedFee
                        let profitPartner = price - cost
                        let all = total - profitPartner
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.all = all
                            v.fee_cod = formattedFee
                            v.total = total
                            v.profitPartner = profitPartner
                        if(reqCod > price){
                            new_data.push(v);
                        }
                    }else{
                        let profitPartner = price - cost
                            v.profitPartner = profitPartner
                            v.total = price
                            v.all = price - profitPartner
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
                let p = percent.find((c) => c.courier_code === 'J&T');
                if (!p) {
                    console.log(`ยังไม่มี courier name: J&T`);
                }
                // คำนวนต้นทุนของร้านค้า
                let cost_hub = result[0].price;
                let cost = Math.ceil(cost_hub + p.percent_orderHUB) // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                let priceOne = Math.ceil(cost + p.percent_shop)
                let price = priceOne + cost_plus
                let priceInteger = reqCod
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
                        express: "J&T",
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        fee_cod: 0,
                        profitPartner: 0,
                        priceOne: priceOne,
                        price: Number(price.toFixed()),
                        total: 0,
                        all: 0,
                        status: status
                    };
                    // console.log(v)
                    if (cod !== undefined) {
                        let fee = (reqCod * percentCod)/100
                        let formattedFee = parseFloat(fee.toFixed(2));
                        let total = price + formattedFee
                        let profitPartner = price - priceOne
                        let all = total - profitPartner
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.all = all
                            v.fee_cod = formattedFee
                            v.total = total
                            v.profitPartner = profitPartner
                        if(reqCod > price){
                            new_data.push(v);
                        }
                    }else{
                        let profitPartner = price - priceOne
                            v.profitPartner = profitPartner
                            v.total = price
                            v.all = price - profitPartner
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
        const findAll = await jntOrder.find()
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
        const txlogisticid = req.params.txlogisticid
        const findTC = await jntOrder.findOne({txlogisticid:txlogisticid})
            if(!findTC){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลข txlogisticid ที่ท่านต้องการหา"})
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
        const txlogisticid = req.params.txlogisticid
        const delTC = await jntOrder.findOneAndDelete({txlogisticid:txlogisticid})
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
        console.log(today)
            today.setHours(23, 59, 59, 0); // ตั้งเวลาเป็นเที่ยงคืนของวันปัจจุบัน
        const findMe = await jntOrder.find({
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
        const findMe = await jntOrder.find({ID:id})
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
    try{
        data = `${dayjs(date).format("YYYYMMDD")}`
        let random = Math.floor(Math.random() * 100000)
        const combinedData = `JNT` + data + random;
        const findInvoice = await jntOrder.find({txlogisticid:combinedData})

            while (findInvoice && findInvoice.length > 0) {
                // สุ่ม random ใหม่
                random = Math.floor(Math.random() * 100000);
                combinedData = `JNT`+ data + random;

                // เช็คใหม่
                findInvoice = await jntOrder.find({txlogisticid: combinedData});
            }

        console.log(combinedData);
        return combinedData;
    }catch(err){
        console.log(err)
    }
}

async function invoiceJNT() {
    data = `ODHJNT`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + random;
    const findInvoice = await jntOrder.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await jntOrder.find({invoice: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = {createOrder, trackingOrder, cancelOrder, label, priceList, getAll, getById, delend, getMeBooking, getPartnerBooking, getPartnerBooking}