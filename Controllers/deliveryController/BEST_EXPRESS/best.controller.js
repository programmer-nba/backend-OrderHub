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
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const data = req.body
        const weight = data.parcel.weight / 1000
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
            formData.bizData.bankCardOwner = "ICE"
            formData.bizData.bankCode = "004"
            formData.bizData.bankCardNo = "5211478224"
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
                ...response.data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        // console.log(createOrder)
        let historyShop
        let findShop
        if(cod_amount == 0){
                findShop = await shopPartner.findOneAndUpdate(
                    {shop_number:shop},
                    { $inc: { credit: -price } },
                    {new:true})
                    if(!findShop){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                    }
                console.log(findShop.credit)
                    
                const plus = findShop.credit + price
                const history = {
                        ID: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        amount: price,
                        before: plus,
                        after: findShop.credit,
                        type: 'BEST(ICE)',
                        remark: "ขนส่งสินค้า(BESTตรง)"
                    }
                // console.log(history)
                historyShop = await historyWalletShop.create(history)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
        }else{
                const findShopTwo = await shopPartner.findOne({shop_number:shop})
                const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: createOrder.txLogisticId,
                    amount: price,
                    before: findShopTwo.credit,
                    after: "COD",
                    type: 'BEST(ICE)',
                    remark: "ขนส่งสินค้าแบบ COD(BESTตรง)"
                }
                // console.log(history)
                historyShop = await historyWalletShop.create(historytwo)
                    if(!historyShop){
                        console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                    }
            }
        return res
                .status(200)
                .send({
                    status:true, 
                    order: createOrder,
                    history: historyShop,
                    shop: findShop
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
        const cod_amount = req.body.cod
        const data = req.body
        const weight = data.parcel.weight / 1000
        // console.log(data)
        const formData = {
            serviceType:"KD_CREATE_WAYBILL_ORDER_PDF_NOTIFY",
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
        // console.log(formData)
        if(cod_amount != 0){
            formData.bizData.items.item[0].itemValue = cod_amount
            formData.bizData.itemsValue = cod_amount
            formData.bizData.bankCardOwner = "2489444705"
            formData.bizData.bankCode = "004"
            formData.bizData.bankCardNo = "5211478224"
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
        // ข้อมูล Base64 ที่ต้องการ decode
        const base64Data = response.data.pdfStream;

        // Decode Base64
        const binaryData = Buffer.from(base64Data, 'base64');

        // สร้างไฟล์ PDF
        // fs.writeFileSync(`D:\PDF/${txLogistic}.pdf`, binaryData, 'binary', (err) => {
        //     if (err) throw err;
        //         console.log('สร้าง PDF ไม่สำเร็จ');
        //     });
        const createOrder = await bestOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                status:'booking',
                cod_amount:cod_amount,
                price: price,
                type:'PDF',
                ...response.data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        
            let historyShop
            let findShop
            if(cod_amount == 0){
                    findShop = await shopPartner.findOneAndUpdate(
                        {shop_number:shop},
                        { $inc: { credit: -price } },
                        {new:true})
                        if(!findShop){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                        }
                    console.log(findShop.credit)
                        
                    const plus = findShop.credit + price
                    const history = {
                            ID: id,
                            role: role,
                            shop_number: shop,
                            orderid: createOrder.txLogisticId,
                            amount: price,
                            before: plus,
                            after: findShop.credit,
                            type: 'BEST(ICE)',
                            remark: "ขนส่งสินค้า(BESTตรง)"
                        }
                    // console.log(history)
                    historyShop = await historyWalletShop.create(history)
                        if(!historyShop){
                            console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                        }
            }else{
                    const findShopTwo = await shopPartner.findOne({shop_number:shop})
                    const historytwo = {
                        ID: id,
                        role: role,
                        shop_number: shop,
                        orderid: createOrder.txLogisticId,
                        amount: price,
                        before: findShopTwo.credit,
                        after: "COD",
                        type: 'BEST(ICE)',
                        remark: "ขนส่งสินค้า(BESTตรง)"
                    }
                    // console.log(history)
                    historyShop = await historyWalletShop.create(historytwo)
                        if(!historyShop){
                            console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                        }
            }
            return res
                    .status(200)
                    .send({
                        status:true, 
                        order: createOrder,
                        history: historyShop,
                        shop: findShop
                    })
    }catch(err){
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
        // console.log(response.data.result)
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
                
                if(findPno.cod_amount == 0){
                        const findShop = await shopPartner.findOneAndUpdate(
                            {shop_number:findPno.shop_number},
                            { $inc: { credit: +findPno.price } },
                            {new:true})
                            if(!findShop){
                                return res
                                        .status(400)
                                        .send({status:false,message:"ไม่สามารถค้นหาหรืออัพเดทร้านค้าได้"})
                            }
                        let diff = findShop.credit - findPno.price
                        let history = {
                                ID: id,
                                role: role,
                                shop_number: findPno.shop_number,
                                orderid: txLogisticId,
                                amount: findPno.price,
                                before: diff,
                                after: findShop.credit,
                                type: 'BEST(ICE)',
                                remark: "ยกเลิกขนส่งสินค้า(BESTตรง)"
                        }
                        
                        const historyShop = await historyWalletShop.create(history)
                            if(!historyShop){
                                console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                            }
   
                    return res
                            .status(200)
                            .send({
                                status:true, 
                                flash: findPno, 
                                // shop: findShop,
                                history: historyShop
                            })
                }else{
                        const findShopCOD = await historyWalletShop.findOne({orderid:txLogisticId})
                        if(!findShopCOD){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลข LogisticId ได้"})
                        }
                        let history = {
                                ID: id,
                                role: role,
                                shop_number: findPno.shop_number,
                                orderid: txLogisticId,
                                amount: findPno.price,
                                before: findShopCOD.before,
                                after: 'COD',
                                type: 'BEST(ICE)',
                                remark: "ยกเลิกขนส่งสินค้าแบบ COD(BESTตรง)"
                        }
                        const historyShop = await historyWalletShop.create(history)
                            if(!historyShop){
                                console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                            }
                    return res
                            .status(200)
                            .send({
                                status:true, 
                                flash: findPno, 
                                history: historyShop
                            })
                }
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
        const percent = await PercentCourier.find();
        const formData = req.body
        const shop = formData.shop_number
        const weight = formData.parcel.weight
        let codReq = req.body.cod
        let percentCod 
        const result  = await priceWeightBest.find({weight: {$gte: weight}})
            .sort({weight:1})
            .limit(1)
            .exec()

            if(result.length == 0){
                return res
                        .status(400)
                        .send({status: false, message:"น้ำหนักของคุณมากเกินไป"})
            }
            if(codReq == true){
                const findCod = await codExpress.findOne({express:"BEST"})
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
            let p = percent.find((c) => c.courier_code === 'BEST(ICE)');
                if (!p) {
                    console.log(`ยังไม่มี courier name: BEST(ICE)`);
                }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = result[0].price;
                    let cost = cost_hub + (cost_hub * p.percent_orderHUB) / 100; // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                    let price = Math.ceil(cost + (cost * p.percent_shop) / 100);
                    let priceInteger = Math.ceil(price)
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
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        status: status,
                        price: Number(price.toFixed()),
                    };
                    if (cod !== undefined) {
                        let cod_price = Math.ceil(priceInteger + (priceInteger * cod) / 100)
                        v.cod_amount = Number(cod_price.toFixed()); // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                    }
                    new_data.push(v);
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
                let p = percent.find((c) => c.courier_code === 'BEST(ICE)');
                if (!p) {
                    console.log(`ยังไม่มี courier name: BEST(ICE)`);
                }
                // คำนวนต้นทุนของร้านค้า
                let cost_hub = result[0].price;
                let cost = cost_hub + (cost_hub * p.percent_orderHUB) / 100; // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                let priceOne = Math.ceil(cost + (cost * p.percent_shop) / 100)
                let price = Math.ceil((cost + (cost * p.percent_shop) / 100) + cost_plus)
                let priceInteger = Math.ceil(price)
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
                        cost_hub: cost_hub, //ต้นทุนที่ทางคุณไอซ์ กำหนด
                        cost: cost, //คุณไอซ์เก็บ 5%
                        cod_amount: Number(cod_amount.toFixed()),
                        priceOne: Number(priceOne.toFixed()),
                        price: Number(price.toFixed()), //พาร์ทเนอร์โดนเก็บเพิ่ม 10%
                        status: status,
                    };
                    console.log(v)
                    if (cod !== undefined) {
                        let cod_price = Math.ceil(priceInteger + (priceInteger * cod) / 100)
                        v.cod_amount = Number(cod_price.toFixed()); // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                    }
                    new_data.push(v);
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
        console.log(id)
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

module.exports = { createOrder, createPDFOrder, statusOrder, statusOrderPush, cancelOrder, priceList, getAll,
                    getById, delend, getMeBooking, getPartnerBooking
                 }