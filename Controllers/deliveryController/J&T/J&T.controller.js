const { generateJT } = require("./generate.signJ&T")
const { jntOrder } = require("../../../Models/Delivery/J&T/orderJT");
const dayjs = require('dayjs')
const axios = require('axios');
const { priceWeight } = require("../../../Models/Delivery/weight/priceWeight");
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
const { profitTemplate } = require("../../../Models/profit/profit.template");
const { jntRemoteArea } = require("../../../Models/remote_area/JNT.area");
const { orderAll } = require("../../../Models/Delivery/order_all");
const { weightAll } = require("../../../Models/Delivery/weight/weight.all.express");
const { insuredExpress } = require("../../../Models/Delivery/insured/insured");
const { priceBase } = require("../../../Models/Delivery/weight/priceBase.express");
const { bangkokMetropolitan } = require("../../../Models/postcal_bangkok/postcal.bangkok");
const { Admin } = require("../../../Models/admin");
const { codPercent } = require("../../../Models/COD/cod.shop.model");

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
apiUrl = process.env.JT_URL
ecom_id = process.env.ECOMPANY_ID
customer_id = process.env.CUSTOMER_ID

createOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const no = req.body.no
        const data = req.body
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const profit_Partner = req.body.profitPartner
        const declared_value = req.body.declared_value
        const insuranceFee = req.body.insuranceFee
        const profitAll = req.body.profitAll
        const price_remote_area = req.body.price_remote_area //ราคาพื้นที่ห่างไกล J&T ไม่มีบอกน้าา
        const cut_partner = req.body.cut_partner
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
                "isinsured": "1",
                // "offerfee": "2000"
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        if(cod_amount > 0){
            fromData.logistics_interface.itemsvalue = cod_amount
            console.log(cod_amount)
        }
        // if(cod_amount != 0){
        //     fromData.logistics_interface.itemsvalue = cod_amount
        //     console.log(cod_amount)
        // }
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
                        .send({status:false, message:"ไม่สามารถส่งคำร้องขอไปยัง J&T ได้"})
            }else if(response.data.responseitems[0].reason == "S10"){
                return res
                        .status(404)
                        .send({status:false, message:"หมายเลขรหัสการสั่งซื้อเกิดการซ้ำกัน กรุณากดสร้างสินค้าอีกครั้ง"})
            }else if(response.data.responseitems[0].reason == "B0101"){
                return res
                        .status(404)
                        .send({status:false, message:"กรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง(10 หลัก)"})
            }else if(response.data.responseitems[0].success == 'false'){
                return res
                        .status(404)
                        .send({status:false, message:`ลำดับ ${no} ไม่สามารถสร้างออเดอร์ได้เนื่องจากมีความผิดพลาด กรุณาตรวจสอบ น้ำหนัก,ที่อยู่ของ ผู้รับ, ผู้ส่ง และ เบอร์โทร ว่าท่านได้กรอกถูกต้องหรือไม่(${response.data.responseitems[0].reason})`})
            }
        const new_data = response.data.responseitems[0]
        // const createOrder = await jntOrder.create(
        //     {
        //         ID:id,
        //         shop_number:shop,
        //         role:role,
        //         from:{
        //             ...data.from
        //         },
        //         to:{
        //             ...data.to
        //         },
        //         parcel:{
        //             ...data.parcel
        //         },
        //         invoice: invoice,
        //         status:'booking',
        //         cost_hub: cost_hub,
        //         cost: cost,
        //         cod_amount:cod_amount,
        //         fee_cod: fee_cod,
        //         total: total,
        //         cut_partner: cut_partner,
        //         price_remote_area: price_remote_area,
        //         price: price,
        //         declared_value: declared_value,
        //         insuranceFee: insuranceFee,
        //         ...new_data
        //     })
        //     if(!createOrder){
        //         return res
        //                 .status(404)
        //                 .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
        //     }
        const createOrderAll = await orderAll.create(
            {
                ID:id,
                shop_number:shop,
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
                cod_amount:cod_amount,
                fee_cod: fee_cod,
                total: total,
                cut_partner: cut_partner,
                price_remote_area: price_remote_area,
                price: price,
                declared_value: declared_value,
                insuranceFee: insuranceFee,
                express: "J&T",
                ...new_data //mailno อยู่ในนี้แล้ว ไม่ต้องประกาศ
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }

        let allProfit = []
        let profit_ice
        let profit_iceCOD
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

            console.log(findShop.credit)
                
            const plus = findShop.credit + cut_partner
            const history = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    amount: cut_partner,
                    before: plus,
                    after: findShop.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้า(J&T)"
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
                    cost: profitAll[0].cost,
                    profit: profit_Partner,
                    express: 'J&T',
                    type: 'โอนเงิน',
            }
            
            let profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }
            // console.log(id)
            console.log(profitAll)  
            let profitOne = await Partner.findOneAndUpdate(
                    { _id: id },
                    { $inc: { 
                            profit: +profit_Partner,
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
                                        profit: profitAll[i].profit,
                                        cost: profitAll[i].cost,
                                        express: 'J&T',
                                        type: 'กำไรจากต้นทุน',
                                    }
                            profit_ice = await profitIce.create(pfICE)
                                    if(!profit_ice){
                                        return res
                                                .status(400)
                                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                                    }

                            proficICE = await Admin.findOneAndUpdate(
                                        { username:'admin' },
                                        { $inc: { profit: +profitAll[i].profit } },
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
                                        cost: profitAll[i].cost,
                                        profit: profitAll[i].profit,
                                        express: 'J&T',
                                        type: 'โอนเงิน',
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
                                                    profit: +profitAll[i].profit,
                                                    credits: +profitAll[i].profit
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
        if(cod_amount != 0){
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
            let showProfitCOD = await Admin.findOneAndUpdate(
                    { username:'admin' },
                    { $inc: { profit: +fee_cod } },
                    {new:true, projection: { profit: 1 } })
                    if(!showProfitCOD){
                            return res
                                    .status(400)
                                    .send({status:false,message:"ไม่สามารถบันทึกกำไร COD คุณไอซ์ได้"})
                    }
            const pfSenderTemplate = {
                    orderid: new_data.txlogisticid,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    type: 'COD(SENDER)',
                    'template.partner_number': new_data.txlogisticid,
                    'template.account_name':updatedDocument.flash_pay.name,
                    'template.account_number':updatedDocument.flash_pay.card_number,
                    'template.bank':updatedDocument.flash_pay.aka,
                    'template.amount':cod_amount,
                    'template.phone_number': updatedDocument.tel,
                    'template.email':updatedDocument.email,
                    status:"กำลังขนส่งสินค้า"
            }
            createTemplate = await profitTemplate.create(pfSenderTemplate)
                if(!createTemplate){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างรายการ COD ของผู้ส่งได้"})
                }
            allProfit.push(profit_iceCOD)
            allProfit.push(showProfitCOD)
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
                const findPno = await orderAll.findOneAndUpdate(
                    {tracking_code:txlogisticid},
                    {order_status:"cancel"},
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
        const no = req.body.no
        const formData = req.body
        const id = req.decoded.userid
        const shop = formData.shop_number
        const weight = formData.parcel.weight
        const declared_value = formData.declared_value
        let reqCod = req.body.cod_amount
        let percentCod 
        if (!Number.isInteger(reqCod)||
            !Number.isInteger(declared_value)) {
                    return res.status(400).send({
                        status: false,
                        message: `ลำดับที่ ${no} กรุณาระบุค่า COD หรือ มูลค่าสินค้า(ประกัน) เป็นจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม`
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
        let cod_percent = []
        let fee_cod_total = 0
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
                        if(percentCOD != 0){
                            let feeOne = (reqCod * percentCOD)/100
                            fee_cod_total = feeOne
                            fee_cod = (reqCod * pFirst.percent)/100
                            let profit = feeOne - fee_cod
                                let v = {
                                    id:findShopCod.owner_id,
                                    cod_profit:profit
                                }
                            cod_percent.push(v)
                        }else{
                            fee_cod = ((reqCod * pFirst.percent)/100)
                        }
                // console.log(pFirst)
                let shop_line = findShopCod.shop_line
                // console.log(shop_line)
                    do{
                            const findShopLine = await codPercent.findOne({shop_id:shop_line})
                            const p = findShopLine.express.find((item)=> item.express == "J&T")
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
                }
        }
        console.log(cod_percent)
        const checkSwitch = findForCost.express.find(item => item.express == 'J&T')
            if(checkSwitch.on_off == false || checkSwitch.cancel_contract == true){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่สามารถใช้งานระบบขนส่งนี้ได้"})
            }
        
        const result  = await weightAll.findOne(
            {
                shop_id: findForCost._id,
                express:"J&T"
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

        const cod = 6.5

        let priceBangkok = false;
        const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
            if (findPostcal) {
                priceBangkok = true;
            }

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
        // console.log(insuranceFee)
        const findPriceBase = await priceBase.findOne({express:"J&T"})
            if(!findPriceBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }
        let new_data = []
        // if(upline === 'ICE'){
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
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคา(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณากรอกราคาขายหน้าร้าน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณากรอกราคาขายหน้าร้าน(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
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
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคาแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคาแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }

                    if(resultP.costBangkok_metropolitan > resultBase.salesBangkok_metropolitan){ //ใช้เช็คกรณีที่คุณไอซ์แก้ราคา มาตรฐาน แล้วราคาต้นทุนที่ partner คนก่อนตั้งไว้มากกว่าราคามาตรฐาน จึงต้องเช็ค
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} ราคาขาย(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                    }else if(resultP.costUpcountry > resultBase.salesUpcountry){
                        return res
                                .status(400)
                                .send({status:false, message:`ลำดับที่ ${no} ราคาขาย(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                    }
                
                // คำนวนต้นทุนของร้านค้า
                let cost_hub
                let price
                let profit_partner
                let profit = []
                let status = null;
                let cut_partner 
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
                    profit_partner = resultBase.salesBangkok_metropolitan - cost_hub
                    cut_partner = resultBase.salesBangkok_metropolitan
                        let dataOne = {
                            id: result.owner_id,
                            cost: resultP.costBangkok_metropolitan,
                            cod_profit: cod_profit,
                            profit: profit_partner,
                            total: profit_partner + cod_profit
                        }
                    
                    profit.push(dataOne)
                }else{
                    cost_hub = resultP.costUpcountry
                    // console.log(cost_hub)
                    price = resultP.salesUpcountry
                    profit_partner = resultBase.salesUpcountry - cost_hub
                    cut_partner = resultBase.salesUpcountry
                    let dataOne = {
                        id: result.owner_id,
                        cost: resultP.costUpcountry,
                        cod_profit: cod_profit,
                        profit: profit_partner,
                        total: profit_partner + cod_profit
                    }
                    profit.push(dataOne)
                }

                let shop_line = result.shop_line
                    do{
                        const findHead = await weightAll.findOne(
                                {
                                    shop_id: shop_line,
                                    express:"J&T"
                                })
                        let findWeight = findHead.weight.find((item)=> item.weightEnd == resultP.weightEnd )
                        let profitOne 
                        let cod_profit
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
                        let data = {
                                    id: findHead.owner_id,
                                    cod_profit: cod_profit,
                                    cost: cost,
                                    profit: profitOne,
                                    total: profitOne + cod_profit
                            }
                        profit.push(data)
                        shop_line = findHead.shop_line
                        cost_hub -= profitOne
                    }while(shop_line != 'ICE')
                
                let cod_iceprofit
                let findIce = cod_percent.find((item)=> item.id == "ICE")
                    if(!findIce){
                        cod_iceprofit = 0
                    }else{
                        cod_iceprofit = findIce.cod_profit
                    }

                if(priceBangkok){
                    // console.log(cost_hub)
                    let profitTwo = cost_hub - resultBase.costBangkok_metropolitan
                    let dataICE = {
                        id:"ICE",
                        cod_profit: cod_iceprofit,
                        cost: resultBase.costBangkok_metropolitan,
                        profit: profitTwo,
                        total: profitTwo + cod_iceprofit
                    }
                    profit.push(dataICE)
                    cost_hub -= profitTwo
                }else{
                    let profitTwo = cost_hub - resultBase.costUpcountry
                    let dataICE = {
                        id:"ICE",
                        cost: resultBase.costUpcountry,
                        cod_profit: cod_iceprofit,
                        profit: profitTwo,
                        total: profitTwo + cod_iceprofit
                    }
                    profit.push(dataICE)
                    cost_hub -= profitTwo
                    // console.log(cost_hub)
                }
                console.log(profit)
                    v = {
                        ...req.body,
                        express: "J&T",
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        fee_cod: 0,
                        profitPartner: profit_partner,
                        price: Number(price.toFixed()),
                        total: 0,
                        cut_partner: 0,
                        declared_value: declared_value,
                        insuranceFee: insuranceFee,
                        status: status,
                        profitAll: profit
                    };
                    // console.log(v)
                    // if (cod !== undefined) {
                        let formattedFee = parseFloat(fee_cod_total.toFixed(2));
                        let total = price + formattedFee + insuranceFee
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
                    // }else{
                    //     // let profitPartner = price - cost
                    //     if(price_remote_area != undefined){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                    //         let total = price + price_remote_area + insuranceFee
                    //             v.price_remote_area = price_remote_area
                    //             v.total = total
                    //             v.cut_partner = cut_partner + price_remote_area + insuranceFee
                    //             // v.profitPartner = profitPartner
                    //     }else{
                    //         // v.profitPartner = profitPartner
                    //         v.total = price + insuranceFee
                    //         v.cut_partner = cut_partner + insuranceFee
                    //     }
                    //     new_data.push(v);
                    // }
                    
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
                .send({ status: true, new:new_data, sender:infoSender});
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
        const findMe = await orderAll.find({
            ID:id,
            express:"JNT",
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