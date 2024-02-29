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

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
apiUrl = process.env.JT_URL
ecom_id = process.env.ECOMPANY_ID
customer_id = process.env.CUSTOMER_ID

createOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const shop = req.body.shop_number
        const txlogisticid = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+txlogisticid);
        const fromData = {
            "logistics_interface" :{
                "actiontype": "add",
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "ordertype": "1",
                "servicetype": "6",
                "deliverytype": "1",
                "sender":{
                    ...req.body.sender
                },
                "receiver":{
                    ...req.body.receiver
                },
                "createordertime": dayTime,
                "sendstarttime": dayTime,
                "sendendtime": dayTime,
                "paytype": "1",
                "weight": req.body.weight,
                "length": req.body.length,
                "width": req.body.width,
                "height": req.body.height,
                "isinsured": "0",
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        if(cod_amount != undefined){
            fromData.logistics_interface.itemsvalue = cod_amount
            console.log(cod_amount)
        }
        const newData = await generateJT(fromData)
            console.log(newData)
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
            }
        const new_data = response.data.responseitems[0]
        const createOrder = await jntOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                cod_amount:cod_amount,
                price: price,
                ...new_data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        let historyShop

        if(cod_amount == undefined){
            const findShop = await shopPartner.findOneAndUpdate(
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
                    orderid: new_data.txlogisticid,
                    amount: price,
                    before: plus,
                    after: findShop.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้า(J&Tตรง)"
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
                orderid: new_data.txlogisticid,
                amount: price,
                before: findShopTwo.credit,
                after: "COD",
                type: 'J&T',
                remark: "ขนส่งสินค้า(J&Tตรง)"
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
                    data: response.data, 
                    order: createOrder,
                    history: historyShop
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
        return res
                .status(200)
                .send({status:true, data: response.data})
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
        const weight = formData.parcel.weight
        let codReq = req.body.cod
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
            if(codReq !== undefined){
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
                        express: "J&T",
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
                let p = percent.find((c) => c.courier_code === 'J&T');
                if (!p) {
                    console.log(`ยังไม่มี courier name: J&T`);
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
                        express: "J&T",
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

module.exports = {createOrder, trackingOrder, cancelOrder, label, priceList}