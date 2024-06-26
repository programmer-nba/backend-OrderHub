const axios = require('axios');
const { PercentCourier } = require('../../../Models/Delivery/ship_pop/percent');
const { Partner } = require('../../../Models/partner');
const { dropOffs } = require('../../../Models/Delivery/dropOff');
const { shopPartner } = require('../../../Models/shop/shop_partner');
const { BookingParcel } = require('../../../Models/Delivery/ship_pop/purchase_id');
const { historyWalletShop } = require('../../../Models/shop/shop_history');
const { historyWallet } = require('../../../Models/topUp/history_topup');
const { codExpress } = require('../../../Models/COD/cod.model');
const { profitPartner } = require('../../../Models/profit/profit.partner');
const { profitIce } = require('../../../Models/profit/profit.ice');
const { profitTemplate } = require("../../../Models/profit/profit.template");
const { orderAll } = require('../../../Models/Delivery/order_all');
const { bangkokMetropolitan } = require('../../../Models/postcal_bangkok/postcal.bangkok');
const { insuredExpress } = require('../../../Models/Delivery/insured/insured');

priceList = async (req, res)=>{
    try{
        // const percent = await PercentCourier.find();
        const shop = req.body.shop_number
        const id = req.decoded.userid
        const weight = req.body.parcel.weight * 1000
        const declared_value = req.body.declared_value
        const formData = req.body
        let reqCod = req.body.cod
        let percentCod
            if(reqCod > 0){
                const findCod = await codExpress.findOne({express:"SHIPPOP"})
                percentCod = findCod.percent
            }
            if(weight == 0){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุน้ำหนัก"})
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

        let priceBangkok = false;
        const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
            if (findPostcal) {
                priceBangkok = true;
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

        const line = []
        const findForCost = await shopPartner.findOne({shop_number:shop})
            if(findForCost){
                line.push({
                    shop_id:findForCost._id,
                    head_line:findForCost.upline.head_line,
                    down_line:findForCost.upline.down_line,
                    shop_line:findForCost.upline.shop_line,
                    level:findForCost.upline.level,
                    express:findForCost.express
                })
                let shop_line = findForCost.upline.shop_line
                while (shop_line != 'ICE') {
                    const findLine = await shopPartner.findOne({_id:shop_line})
                        if(findLine){
                            line.push({
                                shop_id:findLine._id,
                                head_line:findLine.upline.head_line,
                                down_line:findLine.upline.down_line,
                                shop_line:findLine.upline.shop_line,
                                level:findLine.upline.level,
                                express:findLine.express})
                        }
                        shop_line = findLine.upline.shop_line; // อัปเดตค่าของ findForCost สำหรับการวนลูปต่อไป
                }
                // return res
                //         .status(200)
                //         .send({status:false, data:line})
            }else if(!findForCost){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
            }

        // const findPartner = await Partner.findOne({partnerNumber:findForCost.partner_number})
        //     if(!findPartner){
        //         return res
        //                 .status(400)
        //                 .send({status:false, message:"ไม่มีหมายเลขพาร์ทเนอร์ของท่าน"})
        //     }
        // const upline = findPartner.upline.head_line

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
                    "name": req.body.parcel.name,
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

        const findinsured = await insuredExpress.findOne({express:"SHIPPOP"})
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
        console.log(insuranceFee)
        // if(upline === 'ICE'){
            for (const ob of Object.keys(obj)) {
                if (obj[ob].available) {
                    if (reqCod > 0 && obj[ob].courier_code == 'ECP') {
                        console.log('Encountered "ECP". Skipping this iteration.');
                        continue; // ข้ามไปยังรอบถัดไป
                    }
                    // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
                    let v = null;
                    let p = line[0].express.find(element => element.courier_code == obj[ob].courier_code);
                    // console.log(p)
                        if(p.on_off == false){
                            console.log(`Skipping ${obj[ob].courier_code} because courier is off`)
                            continue

                        }else if (p.cancel_contract == true) {
                            console.log(`PACKAGE ONE ไม่สามารถใช้งานได้ในขณะนี้`)
                            break

                        }else if(p.costBangkok_metropolitan <= 0 || p.costUpcountry <= 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:`ระบบยังไม่ได้กำหนดราคาขนส่ง ${p.courier_name}(PAGEKAGE ONE) กรุณาติดต่อ Admin`})

                        }else if (!p) {
                            console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
                        }
                    
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = Number(obj[ob].price);
                    let price
                    let profit_partner
                    let profit = []
                    if (priceBangkok) { //กรณีผู้รับอยู่ กรุงเทพ/ปริมณฑล
                            let price1 = cost_hub + p.salesBangkok_metropolitan;
                            price = price1 + p.costBangkok_metropolitan;
                            profit_partner = p.salesBangkok_metropolitan

                            let dataOne = {
                                id: line[0].down_line,
                                profit: p.salesBangkok_metropolitan,
                            }
                            let dataTwo = {
                                id: line[0].head_line,
                                profit: p.costBangkok_metropolitan,
                            }
                            profit.push(dataOne)
                            profit.push(dataTwo)
                    } else {//กรณีผู้รับอยู่ ต่างจังหวัด
                            let price1 = cost_hub + p.salesUpcountry;
                            price = price1 + p.costUpcountry
                            profit_partner = p.salesUpcountry

                            let dataOne = {
                                id: line[0].down_line,
                                profit: p.salesUpcountry,
                            }
                            let dataTwo = {
                                id: line[0].head_line,
                                profit: p.costUpcountry,
                            }
                            profit.push(dataOne)
                            profit.push(dataTwo)
                    }
                    
                    // บวก total กับ cost ของ array ที่เหลือ
                    for (let i = 1; i < line.length; i++) {
                        if (priceBangkok) {
                            let findExpress = line[i].express.find(element => element.courier_code == obj[ob].courier_code)
                            price += findExpress.costBangkok_metropolitan;
                            let dataOne = {
                                id: line[i].head_line,
                                profit: findExpress.costBangkok_metropolitan
                            }
                            profit.push(dataOne)
                        } else {
                            let findExpress = line[i].express.find(element => element.courier_code == obj[ob].courier_code)
                            price += findExpress.costUpcountry;
                            let dataOne = {
                                id: line[i].head_line,
                                profit: findExpress.costUpcountry
                            }
                            profit.push(dataOne)
                        }
                    }
                    // return res
                    //         .status(200)
                    //         .send({status:true , 
                    //             data:profit, 
                    //             cost_hub:cost_hub,
                    //             price:price,
                    //             line:line
                    //         })

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
                        price_remote_area: 0,
                        cost_hub: cost_hub,
                        cod_amount: Number(cod_amount.toFixed()),
                        fee_cod: 0,
                        profitPartner: 0,
                        price: Number(price.toFixed()),
                        total: 0,
                        cut_partner: 0,
                        declared_value: declared_value,
                        insuranceFee: insuranceFee,
                        status: status,
                        profitAll: profit
                    };

                    if (cod !== undefined) {
                        let fee = (reqCod * percentCod)/100
                        let formattedFee = parseFloat(fee.toFixed(2));
                        let total = price + formattedFee + insuranceFee
                        let cut_partner = total - profit_partner
                            v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                            v.fee_cod = formattedFee
                            v.profitPartner = profit_partner
                                if(obj[ob].hasOwnProperty("price_remote_area")){
                                    let total1 = total + obj[ob].price_remote_area
                                        v.total = total1
                                        v.cut_partner = total1 - profit_partner
                                        v.price_remote_area = obj[ob].price_remote_area
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
                        if(obj[ob].hasOwnProperty("price_remote_area")){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                            let total = price + obj[ob].price_remote_area + insuranceFee
                                v.price_remote_area = obj[ob].price_remote_area
                                v.total = total 
                                v.cut_partner = total - profit_partner
                                v.profitPartner = profit_partner
                        }else{
                            let total = price + insuranceFee
                            v.profitPartner = profit_partner
                            v.total = total
                            v.cut_partner = total - profit_partner
                        }
                        new_data.push(v);
                    }
                    // console.log(new_data);
                } else {
                    // ทำสิ่งที่คุณต้องการทำเมื่อ obj[ob].available เป็น false
                    console.log(`Skipping ${obj[ob].courier_code} because available is false`);
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
        const cut_partner = req.body.cut_partner
        const insuranceFee = req.body.insuranceFee
        const price_remote_area = req.body.price_remote_area
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
                ...Data, //มี declared_value อยู่แล้วใน ...Data ไม่ต้องสร้างเพิ่ม
                invoice: invoice,
                ID: id,
                role: role,
                purchase_id: String(resp.data.purchase_id),
                shop_id: req.body.shop_id,
                shop_number: req.body.shop_id,
                insuranceFee: insuranceFee,
                cost_hub: costHub,
                cost: cost,
                fee_cod: fee_cod,
                price_remote_area: price_remote_area,
                cut_partner: cut_partner,
                total: total,
                parcel: parcel,
                priceOne: priceOne,
                price: Number(price.toFixed()),
                express: "SHIPPOP"
          };
         new_data.push(v);
        const booking_parcel = await BookingParcel.create(v);
            if(!booking_parcel){
                console.log("ไม่สามารถสร้างข้อมูล booking ได้")
            }
        const createOrderAll = await orderAll.create(v)
            if(!createOrderAll){
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
        let historyShop
        let findShopForCredit
        let profitPlus
        let profitPlusOne
        let createTemplate
        if(cod_amount == 0){
                    findShopForCredit = await shopPartner.findOneAndUpdate(
                        {shop_number:shop},
                        { $inc: { credit: -cut_partner } },
                        {new:true})
                        if(!findShopForCredit){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                        }
                    console.log(findShopForCredit.credit)
                        
                    const plus = findShopForCredit.credit + cut_partner
                    const history = {
                            ID: id,
                            role: role,
                            shop_number: shop,
                            orderid: booking_parcel.tracking_code,
                            amount: cut_partner,
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
                        orderid: booking_parcel.tracking_code,
                        amount: cut_partner,
                        before: plus,
                        after: findShopTwo.credit,
                        type: booking_parcel.courier_code,
                        remark: "ขนส่งสินค้าแบบ COD(PACKAGE ONE)"
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
                    
                    const pfSenderTemplate = {
                            orderid: booking_parcel.tracking_code,
                            Orderer: id,
                            role: role,
                            shop_number: shop,
                            type: 'COD(SENDER)',
                            'template.partner_number': booking_parcel.tracking_code,
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
                    order: booking_parcel,
                    history: historyShop,
                    // shop: findShopForCredit
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne,
                    template: createTemplate
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
        //                         remark: "ยกเลิกขนส่งสินค้าแบบ COD(PACKAGE ONE)"
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

priceListTest = async(req, res)=>{
    try{
        // let data = [];
            // data.push({
            //     "0": {
            //         "from": {
            //             "name": "ผู้ส่ง ต้นทาง 1",
            //             "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 1",
            //             "district": "ถนนพญาไท",
            //             "state": "ราชเทวี",
            //             "province": "กรุงเทพมหานคร",
            //             "postcode": "10400",
            //             "tel": "0123456789",
            //         },
            //         "to": {
            //             "name": "ผู้รับ ปลายทาง 1",
            //             "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 2",
            //             "district": "สีลม",
            //             "state": "บางรัก",
            //             "province": "กรุงเทพมหานคร",
            //             "postcode": "10500",
            //             "tel": "0123456789",
            //         },
            //         "parcel": {
            //             "name": "สินค้าชิ้นที่ 1",
            //             "weight": 18000,
            //             "width": 30,
            //             "length": 30,
            //             "height": 30
            //         },
            //         "courier_code": "FLE",
            //         "showall": 1
            //     },
            //     "1": {
            //         "from": {
            //             "name": "ผู้ส่ง ต้นทาง 2",
            //             "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 2",
            //             "district": "ถนนพญาไท",
            //             "state": "ราชเทวี",
            //             "province": "กรุงเทพมหานคร",
            //             "postcode": "10400",
            //             "tel": "0123456789"
            //         },
            //         "to": {
            //             "name": "ผู้รับ ปลายทาง 2",
            //             "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 2",
            //             "district": "สีลม",
            //             "state": "บางรัก",
            //             "province": "กรุงเทพมหานคร",
            //             "postcode": "10500",
            //             "tel": "0123456789"
            //         },
            //         "parcel": {
            //             "name": "สินค้าชิ้นที่ 2",
            //             "weight": 1000,
            //             "width": 1,
            //             "length": 1,
            //             "height": 1
            //         },
            //         "courier_code": "EMST",
            //         "showall": 1
            //     }
            // });
        const value = {
            api_key: process.env.SHIPPOP_API_KEY,
            data: {
                "0": {
                    "from": {
                        "name": "ผู้ส่ง ต้นทาง 1",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด 2 ​",
                        "district": "ถนนพญาไท",
                        "state": "ราชเทวี",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10400",
                        "tel": "0123456789",
                    },
                    "to": {
                        "name": "ผู้รับ ปลายทาง 1",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 2",
                        "district": "สีลม",
                        "state": "บางรัก",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10500",
                        "tel": "0123456789",
                    },
                    "parcel": {
                        "name": "สินค้าชิ้นที่ 1",
                        "weight": 1000,
                        "width": 30,
                        "length": 30,
                        "height": 30
                    },
                    "courier_code": "FLE",
                    "showall": 1
                },
                "1": {
                    "from": {
                        "name": "ผู้ส่ง ต้นทาง 2",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด 1​",
                        "district": "ถนนพญาไท",
                        "state": "ราชเทวี",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10400",
                        "tel": "0123456789"
                    },
                    "to": {
                        "name": "ผู้รับ ปลายทาง 2",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 2",
                        "district": "สีลม",
                        "state": "บางรัก",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10500",
                        "tel": "0123456789"
                    },
                    "parcel": {
                        "name": "สินค้าชิ้นที่ 2",
                        "weight": 1000,
                        "width": 10,
                        "length": 10,
                        "height": 10
                    },
                    "courier_code": "FLE",
                    "showall": 1
                },
                "2": {
                    "from": {
                        "name": "ผู้ส่ง ต้นทาง 3",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด 3",
                        "district": "ถนนพญาไท",
                        "state": "ราชเทวี",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10400",
                        "tel": "0123456789"
                    },
                    "to": {
                        "name": "ผู้รับ ปลายทาง 3",
                        "address": "บริษัท​ ชิปป๊อป​ จำกัด​ 23",
                        "district": "สีลม",
                        "state": "บางรัก",
                        "province": "กรุงเทพมหานคร",
                        "postcode": "10500",
                        "tel": "0123456789"
                    },
                    "parcel": {
                        "name": "สินค้าชิ้นที่ 3",
                        "weight": 2000,
                        "width": 10,
                        "length": 10,
                        "height": 10
                    },
                    "courier_code": "FLE",
                    "showall": 1
                }
            }
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
        
        return res
                .status(200)
                .send({ 
                    status: true, 
                    // origin_data: req.body, 
                    data: resp.data
                });
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
                , getPartnerBooking, getOrderDay, getOrderByTracking, priceListTest}