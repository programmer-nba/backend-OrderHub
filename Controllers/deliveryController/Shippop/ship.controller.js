const axios = require('axios');
const { PercentCourier } = require('../../../Models/Delivery/ship_pop/percent');
const { Partner } = require('../../../Models/partner');
const { dropOffs } = require('../../../Models/Delivery/dropOff');
const { shopPartner } = require('../../../Models/shop/shop_partner');
const { BookingParcel } = require('../../../Models/Delivery/ship_pop/purchase_id');
const { historyWalletShop } = require('../../../Models/shop/shop_history');
const { historyWallet } = require('../../../Models/topUp/history_topup');
const { costPlus } = require('../../../Models/costPlus');
const { codExpress } = require('../../../Models/COD/cod.model');
const { profitPartner } = require('../../../Models/profit/profit.partner');
const { profitIce } = require('../../../Models/profit/profit.ice');

priceList = async (req, res)=>{
    try{
        const percent = await PercentCourier.find();
        const shop = req.body.shop_number
        const id = req.decoded.userid
        const weight = req.body.parcel.weight * 1000
        const formData = req.body
        let reqCod = req.body.cod
        let percentCod
        if(reqCod > 0){
            const findCod = await codExpress.findOne({express:"SHIPPOP"})
            percentCod = findCod.percent
        }
        const cod = percentCod
        console.log(cod)
        if(req.decoded.role == 'shop_member'){
            if(req.decoded.shop_number != shop){
                console.log(req.decoded.shop_number, shop)
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุรหัสร้านค้าที่ท่านอยู่"})
            }
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

        //ผู้รับ
        const recipient = formData.to; // ผู้รับ
        const filter = { ID: id, tel: recipient.tel, status: 'ผู้รับ' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

            const update = { //ข้อมูลที่ต้องการอัพเดท หรือ สร้างใหม่
                ...recipient,
                ID: id,
                status: 'ผู้รับ',
                shop_id: shop,
                postcode: String(recipient.postcode),
            };

        const options = { upsert: true }; // upsert: true จะทำการเพิ่มข้อมูลถ้าไม่พบข้อมูลที่ตรงกับเงื่อนไข
        
        const result = await dropOffs.updateOne(filter, update, options);
            if (result.upsertedCount > 0) {
                console.log('สร้างข้อมูลผู้รับคนใหม่');
            } else {
                console.log('อัปเดตข้อมูลผู้รับเรียบร้อย');
            }
        
        const findForCost = await shopPartner.findOne({shop_number:shop})
        if(!findForCost){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
        }

        const findPartner = await Partner.findOne({partnerNumber:findForCost.partner_number})
        if(!findPartner){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีหมายเลขพาร์ทเนอร์ของท่าน"})
        }
        const upline = findPartner.upline.head_line

        let data = [];
            data.push({
                "from": {
                    "name": req.body.from.name,
                    "address": req.body.from.address,
                    "district": req.body.from.district,
                    "state": req.body.from.state,
                    "province": req.body.from.province,
                    "postcode": req.body.from.postcode,
                    "tel": req.body.from.tel
                },
                "to": {
                    "name": req.body.to.name,
                    "address": req.body.to.address,
                    "district": req.body.to.district,
                    "state": req.body.to.state,
                    "province": req.body.to.province,
                    "postcode": req.body.to.postcode,
                    "tel": req.body.to.tel
                },
                "parcel": {
                    // "name": "สินค้าชิ้นที่ 1",
                    "weight": weight,
                    "width": req.body.parcel.width,
                    "length": req.body.parcel.length,
                    "height": req.body.parcel.height
                },
            //DHL FLE
                "showall": 1,
                "shop_number": req.body.shop_number//524854
        });
        const value = {
            api_key: process.env.SHIPPOP_API_KEY,
            data: data,
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/pricelist/`,value,
            {
                headers: {"Accept-Encoding": "gzip,deflate,compress"},
            }
        )
        if (!resp.data.status) {
            return res
                    .status(400)
                    .send({status: false, message: resp.data.message});
        }
        const obj = resp.data.data[0];
        const new_data = [];

        if(upline === 'ICE'){
            for (const ob of Object.keys(obj)) {
                if (obj[ob].available) {
                    if (reqCod > 0 && obj[ob].courier_code == 'ECP') {
                        console.log('Encountered "ECP". Skipping this iteration.');
                        continue; // ข้ามไปยังรอบถัดไป
                    }
                    // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
                    // ตัวอย่าง: คำนวนตัวเลข, เรียก function, หรือทำอย่างอื่น
                    let v = null;
                    let p = percent.find((c) => c.courier_code === obj[ob].courier_code);
                    if (!p) {
                        console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
                    }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = Number(obj[ob].price);
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
                        console.error(error);
                    }
                    v = {
                        ...obj[ob],
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
                        v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                        v.fee_cod = formattedFee
                        v.total = price + formattedFee
                        v.profitPartner = price - cost
                        if(reqCod > price){
                            new_data.push(v);
                        }
                    }else{
                        v.profitPartner = price - cost
                        v.total = price
                        new_data.push(v);
                    }
                    // console.log(new_data);
                } else {
                    // ทำสิ่งที่คุณต้องการทำเมื่อ obj[ob].available เป็น false
                    console.log(`Skipping ${obj[ob].courier_code} because available is false`);
                }
            }
        }else {
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
                for (const ob of Object.keys(obj)) {
                    if (obj[ob].available) {
                        if (reqCod > 0 && obj[ob].courier_code == 'ECP') {
                            console.log('Encountered "ECP". Skipping this iteration.');
                            continue; // ข้ามไปยังรอบถัดไป
                        }
                        // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
                        // ตัวอย่าง: คำนวนตัวเลข, เรียก function, หรือทำอย่างอื่น
                        let v = null;
                        let p = percent.find((c) => c.courier_code === obj[ob].courier_code);
                        if (!p) {
                            console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
                        }
                        // คำนวนต้นทุนของร้านค้า
                        let cost_hub = Number(obj[ob].price);
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
                            ...obj[ob],
                            cost_hub: cost_hub,
                            cost: cost,
                            cod_amount: Number(cod_amount.toFixed()),
                            fee_cod: 0,
                            profitPartner: 0,
                            priceOne: priceOne,
                            price: Number(price.toFixed()),
                            total: 0,
                            status: status
                        };

                        if (cod !== undefined) {
                            let fee = (reqCod * percentCod)/100
                            let formattedFee = parseFloat(fee.toFixed(2));
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.fee_cod = formattedFee
                            v.total = price + formattedFee
                            v.profitPartner = price - priceOne
                            if(reqCod > price){
                                new_data.push(v);
                            }
                        }else{
                            v.profitPartner = price - priceOne
                            v.total = price
                            new_data.push(v);
                        }
                        // console.log(new_data);
                    } else {
                        // ทำสิ่งที่คุณต้องการทำเมื่อ obj[ob].available เป็น false
                        console.log(`Skipping ${obj[ob].courier_code} because available is false`);
                    }
                }
        }
        return res
                .status(200)
                .send({ 
                    status: true, 
                    origin_data: req.body, 
                    new: new_data,
                    sender: infoSender
                });
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

booking = async(req, res)=>{
    try{
        const role = req.decoded.role
        const formData = req.body
        const price = req.body.price
        const priceOne = req.body.priceOne
        const costHub = req.body.cost_hub
        const cost = req.body.cost
        const shop = req.body.shop_id

        const fee_cod = req.body.fee_cod
        const total = req.body.total

        const weight = req.body.parcel.weight * 1000
        const id = req.decoded.userid
        const cod_amount = req.body.cod_amount
        const shop_id = req.body.shop_id
        formData.parcel.weight = weight
        const data = [{...formData}] //, courier_code:courierCode

        const invoice = await invoiceNumber()
        console.log(invoice)
        const findShop = await shopPartner.findOne({shop_number:shop_id})
        if(!findShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านกรอก"})
        }
        //ผู้ส่ง
        const sender = data[0].from; //ผู้ส่ง
        const filterSender = { shop_id: shop_id , tel: sender.tel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        
        const value = {
            api_key: process.env.SHIPPOP_API_KEY,
            email: "OrderHUB@gmail.com",
            url: {
                "success": "http://shippop.com/?success",
                "fail": "http://shippop.com/?fail"
            },
            data: data,
            force_confirm: 1
        };
        
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/booking/`,value,
            {
              headers: {"Accept-Encoding": "gzip,deflate,compress",
                        "Content-Type": "application/json"},
            }
          );
            if (!resp.data.status) {
                return res
                        .status(400)
                        .send({status: false, message: resp.data.data[0]});
            }
        const Data = resp.data.data[0]
        const parcel = data[0].parcel
        const new_data = []
        const v = {
                ...Data,
                invoice: invoice,
                ID: id,
                role: role,
                purchase_id: String(resp.data.purchase_id),
                shop_id: req.body.shop_id,
                cost_hub: costHub,
                cost: cost,
                fee_cod: fee_cod,
                total: total,
                parcel: parcel,
                priceOne: priceOne,
                price: Number(price.toFixed()),
          };
         new_data.push(v);
        const booking_parcel = await BookingParcel.create(v);
            if(!booking_parcel){
                console.log("ไม่สามารถสร้างข้อมูล booking ได้")
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
        let profitsICE = cost - costHub //SHIPPOP ราคาต้นทุน(costHub) ที่ให้มาไม่มีทศนิยมอย่างแน่นอน ดังนั้นไม่จำเป็นต้องปัดเศษ หรือ ใส่ทศนิยม
        let profit_partner
        let profit_partnerOne
        let profit_ice
        let profit_iceCOD
        let profitSender
        let historyShop
        let findShopForCredit
        let profitPlus
        let profitPlusOne
        if(cod_amount == 0){
                    findShopForCredit = await shopPartner.findOneAndUpdate(
                        {shop_number:shop},
                        { $inc: { credit: -total } },
                        {new:true})
                        if(!findShopForCredit){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                        }
                    console.log(findShopForCredit.credit)
                        
                    const plus = findShopForCredit.credit + total
                    const history = {
                            ID: id,
                            role: role,
                            shop_number: shop,
                            orderid: booking_parcel.tracking_code,
                            amount: total,
                            before: plus,
                            after: findShopForCredit.credit,
                            type: booking_parcel.courier_code,
                            remark: "ขนส่งสินค้า(SHIPPOP)"
                        }
                    
                    // console.log(history)
                    historyShop = await historyWalletShop.create(history)
                        if(!historyShop){
                            console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                        }
                    const pf = {
                            wallet_owner: findShopForCredit.partnerID,
                            Orderer: id,
                            role: role,
                            shop_number: shop,
                            orderid: booking_parcel.tracking_code,
                            profit: profitsPartner,
                            express: booking_parcel.courier_code,
                            type: 'โอนเงิน',
                    }
                    profit_partner = await profitPartner.create(pf)
                        if(!profit_partner){
                            return  res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                        }
                    profitPlus = await Partner.findOneAndUpdate(
                            {_id:findShopForCredit.partnerID},
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
                            orderid: booking_parcel.tracking_code,
                            profit: profitsICE,
                            express: booking_parcel.courier_code,
                            type: 'กำไรจากต้นทุน',
                    }
                    profit_ice = await profitIce.create(pfICE)
                        if(!profit_ice){
                            return res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                        }
                    if(priceOne != 0){
                        const findUpline = await Partner.findOne({_id:findShopForCredit.partnerID})
                        const headLine = findUpline.upline.head_line
    
                        const pfPartnerOne = {
                                    wallet_owner: headLine,
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: profitsPartnerOne,
                                    express: booking_parcel.courier_code,
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
                    { $inc: { credit: -total } },
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
                        orderid: booking_parcel.tracking_code,
                        amount: total,
                        before: plus,
                        after: findShopTwo.credit,
                        type: booking_parcel.courier_code,
                        remark: "ขนส่งสินค้าแบบ COD(SHIPPOP)"
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
                            orderid: booking_parcel.tracking_code,
                            profit: profitsPartner,
                            express: booking_parcel.courier_code,
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
                            orderid: booking_parcel.tracking_code,
                            profit: profitsICE,
                            express: booking_parcel.courier_code,
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
                            orderid: booking_parcel.tracking_code,
                            profit: fee_cod,
                            express: booking_parcel.courier_code,
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
                            orderid: booking_parcel.tracking_code,
                            profit: cod_amount,
                            express: booking_parcel.courier_code,
                            type: 'COD(SENDER)',
                            'bookbank.name': updatedDocument.flash_pay.name,
                            'bookbank.card_number': updatedDocument.flash_pay.card_number,
                            'bookbank.aka': updatedDocument.flash_pay.aka,
                            status:"รอดำเนินการ"
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
                                orderid: booking_parcel.tracking_code,
                                profit: profitsPartnerOne,
                                express: booking_parcel.courier_code,
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
                    order: booking_parcel,
                    history: historyShop,
                    // shop: findShopForCredit
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitSender: profitSender,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

cancelOrder = async(req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const tracking_code = req.params.tracking_code
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: tracking_code,
        };
        const findStatus = await BookingParcel.findOne({ tracking_code: tracking_code });
            if (!findStatus) {
                return res
                        .status(400)
                        .send({ status: false, message: "ไม่มีหมายเลขที่ท่านกรอก" });
            }else if(findStatus.order_status == 'cancel'){
                return res
                        .status(404)
                        .send({status: false, message:"หมายเลขสินค้านี้ถูก cancel ไปแล้ว"})
            }

        const respStatus = await axios.post(`${process.env.SHIPPOP_URL}/cancel/`,valueCheck,
                    {
                        headers: {"Accept-Encoding": "gzip,deflate,compress",
                                "Content-Type": "application/json"},
                    }
                )
        if(respStatus.data.status != true){
                return res
                        .status(400)
                        .send({
                            status: false, 
                            message:"ไม่สามารถทำการยกเลิกสินค้าได้"
                        })
        }else{
                const findPno = await BookingParcel.findOneAndUpdate(
                        { tracking_code: tracking_code },
                        { $set: { order_status: 'cancel' } },
                        { new: true }
                    );
                    if(!findPno){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาหมายเลข tracking_code หรืออัพเดทข้อมูลได้"})
                    }
                return res
                        .status(200)
                        .send({status:false, data:findPno})
        }
        //         if(findPno.cod_amount == 0){
        //                 const findShop = await shopPartner.findOneAndUpdate(
        //                     {shop_number:findPno.shop_id},
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
        //                         shop_number: findPno.shop_id,
        //                         orderid: tracking_code,
        //                         amount: findPno.price,
        //                         before: diff,
        //                         after: findShop.credit,
        //                         type: findPno.courier_code,
        //                         remark: "ยกเลิกขนส่งสินค้า(SHIPPOP)"
        //                 }
        //                 const historyShop = await historyWalletShop.create(history)
        //                     if(!historyShop){
        //                         console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //                     }
        //                 const delProfitPartner = await profitPartner.deleteMany({orderid:tracking_code})
        //                     if(!delProfitPartner){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ได้"})
        //                     }
        //                 const delProfitIce = await profitIce.findOneAndDelete({orderid:tracking_code})
        //                     if(!delProfitIce){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ของคุณไอซ์ได้"})
        //                     }
        //                 return res
        //                         .status(200)
        //                         .send({
        //                             status:true, 
        //                             order: findPno, 
        //                             // shop: findShop,
        //                             history: historyShop,
        //                             delPartner: delProfitPartner,
        //                             delIce: delProfitIce
        //                         })
        //         }else{
        //                 const findShopCOD = await historyWalletShop.findOne({orderid:tracking_code})
        //                     if(!findShopCOD){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข tracking_code ได้"})
        //                     }
        //                 let history = {
        //                         ID: id,
        //                         role: role,
        //                         shop_number: findPno.shop_id,
        //                         orderid: tracking_code,
        //                         amount: findPno.price,
        //                         before: findShopCOD.before,
        //                         after: 'COD',
        //                         type: findPno.courier_code,
        //                         remark: "ยกเลิกขนส่งสินค้าแบบ COD(SHIPPOP)"
        //                 }
        //                 const historyShop = await historyWalletShop.create(history)
        //                     if(!historyShop){
        //                         console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //                     }
        //                 const delProfitPartner = await profitPartner.deleteMany({orderid:tracking_code})
        //                     if(!delProfitPartner){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ได้"})
        //                     }
        //                 const delProfitIce = await profitIce.deleteMany(
        //                         {
        //                             orderid:tracking_code
        //                         }
        //                     )
        //                     if(!delProfitIce){
        //                         return res
        //                                 .status(404)
        //                                 .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ของคุณไอซ์ได้"})
        //                     }
        //                 return res
        //                         .status(200)
        //                         .send({
        //                             status:true, 
        //                             order: findPno, 
        //                             history: historyShop,
        //                             delPartner: delProfitPartner,
        //                             delIce: delProfitIce
        //                         })
        //         }
        // }    
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

tracking = async (req, res)=>{
    try{
        const tracking = req.params.id
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: tracking,
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/tracking/`,valueCheck,
            {
            headers: {"Accept-Encoding": "gzip,deflate,compress",
                        "Content-Type": "application/json"},
            }
        )
            if(!resp){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถหาหมายเลข Tracking ได้"})
            }
        // console.log(resp.data.order_status)
        return res
                .status(200)
                .send({status:true, data:resp.data})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

confirmOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const purchase_id = req.params.purchase_id
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            purchase_id: purchase_id,
        };
        const fixStatus = await BookingParcel.findOneAndUpdate(
            {purchase_id:purchase_id},
            {order_status: "booking"},
            {new:true}
        )
        if(!fixStatus){
            return res
                    .status(404)
                    .send({status:false, message:"ไม่สามารถแก้ไข booking ได้"})
        }
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/confirm/`,valueCheck,
            {
                headers: {"Accept-Encoding": "gzip,deflate,compress",
                            "Content-Type": "application/json"},
            }
        )
        console.log(resp.data.status)
        if(!resp.data.status){
            return res
                    .status(400)
                    .send({
                        data:resp.data, 
                    })
        }

        const findShop = await shopPartner.findOne({shop_number:fixStatus.shop_id})
        const diff = findShop.credit - fixStatus.price
        const diffShop = await shopPartner.findOneAndUpdate(
            {shop_number:findShop.shop_number},
            {credit:diff},
            {new:true})
        if(!diffShop){
            console.log("ไม่สามารถแก้ไขเงินของ shop ได้")
        }
        const history = {
            ID: id,
            role: role,
            shop_number: fixStatus.shop_id,
            orderid: fixStatus.purchase_id,
            amount: fixStatus.price,
            before: findShop.credit,
            after: diff,
            type: fixStatus.courier_code,
            remark: "ขนส่งสินค้า(SHIPPOP)"
        }
        const historyShop = await historyWalletShop.create(history)
        if(!historyShop){
            console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        }
        return res
                .status(200)
                .send({
                    status:true,
                    data:resp.data,
                    history:historyShop
                    })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

trackingPurchase = async (req, res)=>{
    try{
        const purchase_id = req.params.purchase_id
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            purchase_id: purchase_id,
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/tracking_purchase/`,valueCheck,
            {
            headers: {"Accept-Encoding": "gzip,deflate,compress",
                        "Content-Type": "application/json"},
            }
        )
        if(resp){
            return res
                    .status(200)
                    .send({status:true, data:resp.data})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถหาหมายเลข Purchase ID ได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

labelHtml = async (req, res)=>{ //ใบแปะหน้าโดย purchase(html)
    try{
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            purchase_id: req.body.purchase_id,
            type:"html",
            size: req.body.size,
            logo: "https://drive.google.com/thumbnail?id=1-ibHHTEzCLaRisxTJa0FKa653kNpQT-L"
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/v2/label/`,valueCheck,
            {
                headers: {"Accept-Encoding": "gzip,deflate,compress",
                            "Content-Type": "application/json"},
            }
        )
        if(resp){
            return res
                    .status(200)
                    .send(resp.data.html)
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถหาหมายเลข Tracking ได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

callPickup = async (req, res)=>{ //ใช้ไม่ได้
    try{
        const courier_tracking_code = req.params.courier_tracking_code
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: courier_tracking_code
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/calltopickup/`,valueCheck,
            {
                headers: {"Content-Type": "application/json"},
            }
        )
        if(resp){
            return res 
                    .status(200)
                    .send({status:true, data: resp.data})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเรียกขนส่งเข้ารับได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getAllBooking = async (req, res) => { //Get All Bookin Only Admin
    try {
        const booking = await BookingParcel.find();
        if (booking) {
            return res.status(200).send({status: true, data: booking});
        } else {
            return res
            .status(400)
            .send({status: false, message: "ดึงข้อมูลไม่สำเร็จ"});
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
    }
}

getById = async(req, res)=>{
    try{
        const tracking_code = req.params.tracking_code
        const findTC = await BookingParcel.findOne({tracking_code:tracking_code})
            if(!findTC){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลข tracking code ที่ท่านต้องการหา"})
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
        const tracking_code = req.params.tracking_code
        const delTC = await BookingParcel.findOneAndDelete({tracking_code: tracking_code})
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
        const findMe = await BookingParcel.find({
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
        const findMe = await BookingParcel.find({ID:id})
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

getOrderDay = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findDay = await BookingParcel.aggregate([
            {
                $match: {
                    ID: id // ใช้ _id หรือ field อื่นที่เกี่ยวข้องกับ userid ของผู้ใช้ตามที่ต้องการ
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    documents: { $push: "$$ROOT" },
                    count: { $sum: 1 } // เพิ่มการนับจำนวนเอกสารในแต่ละกลุ่ม
                }
            },
            {
                $sort: {
                    "_id.year": -1,
                    "_id.month": -1,
                    "_id.day": -1
                }
            }
        ])
        if(!findDay){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถทำได้"})
        }
        return res
                .status(200)
                .send({status:true, data:findDay})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getOrderByTracking = async (req, res)=>{
    try{
        const tracking_code = req.params.tracking_code
        const findTracking = await BookingParcel.findOne({tracking_code:tracking_code})
            if(!findTracking){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหา tracking number ได้"})
            }
        return res 
                .status(200)
                .send({status:true, data:findTracking})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

async function invoiceNumber() {
    data = `ODHSP`
    let random = Math.floor(Math.random() * 100000000000)
    const combinedData = data + random;
    const findInvoice = await BookingParcel.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await BookingParcel.find({invoice: combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = {priceList, booking, cancelOrder, tracking, confirmOrder, callPickup
                , getAllBooking, trackingPurchase, labelHtml, getById, delend, getMeBooking, getMeBooking
                , getPartnerBooking, getOrderDay, getOrderByTracking}