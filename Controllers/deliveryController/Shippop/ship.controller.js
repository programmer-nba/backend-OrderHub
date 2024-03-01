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

priceList = async (req, res)=>{
    try{
        const percent = await PercentCourier.find();
        const shop = req.body.shop_number
        let reqCod = req.body.cod
        let percentCod
        if(reqCod == true){
            const findCod = await codExpress.findOne({express:"SHIPPOP"})
            percentCod = findCod.percent
        }
        const cod = percentCod
        console.log(cod)
        if(req.decoded.role === 'shop_member'){
            if(req.decoded.shop_number != shop){
                console.log(req.decoded.shop_number, shop)
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุรหัสร้านค้าที่ท่านอยู่"})
            }
        }
        // else if (req.decoded.role === 'partner'){
        //     const idPartner = req.decoded.userid
            
        //     const findShop = await Partner.findOne(
        //         {
        //             _id:idPartner,
        //             shop_partner:{
        //                 $elemMatch: { shop_number: shop }
        //             }
        //         })
            
        //     if(!findShop){
        //         return res
        //                 .status(400)
        //                 .send({status:false, message:"กรุณาระบุรหัสร้านค้าที่ท่านเป็นเจ้าของ/สร้างร้านค้าของท่าน"})
        //     }
        // }
        
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
                "weight": req.body.parcel.weight,
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
        );
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
                    // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
                    // ตัวอย่าง: คำนวนตัวเลข, เรียก function, หรือทำอย่างอื่น
                    let v = null;
                    let p = percent.find((c) => c.courier_code === obj[ob].courier_code);
                    if (!p) {
                        console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
                    }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = Number(obj[ob].price);
                    let cost = Math.ceil(cost_hub + (cost_hub * p.percent_orderHUB) / 100); // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
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
                        console.error(error);
                    }
                    v = {
                        ...obj[ob],
                        cost_hub: cost_hub,
                        cost: cost,
                        cod_amount: Number(cod_amount.toFixed()),
                        status: status,
                        price: Number(price.toFixed()),
                    };

                    if (cod !== undefined) {
                        let cod_price = Math.ceil(priceInteger + (priceInteger * cod) / 100)
                        v.cod_amount = Number(cod_price.toFixed()); // ถ้ามี req.body.cod ก็นำไปใช้แทนที่

                        if(price >= 100){
                            new_data.push(v);
                        }

                    }else{
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
                        // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
                        // ตัวอย่าง: คำนวนตัวเลข, เรียก function, หรือทำอย่างอื่น
                        let v = null;
                        let p = percent.find((c) => c.courier_code === obj[ob].courier_code);
                        if (!p) {
                            console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
                        }
                        // คำนวนต้นทุนของร้านค้า
                        let cost_hub = Number(obj[ob].price);
                        let cost = Math.ceil(cost_hub + (cost_hub * p.percent_orderHUB) / 100) // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                        let price = (cost + (cost * p.percent_shop) / 100) + cost_plus
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
                            ...obj[ob],
                            cost_hub: cost_hub,
                            cost: cost,
                            cod_amount: Number(cod_amount.toFixed()),
                            status: status,
                            price: Number(priceInteger.toFixed()),
                        };

                        if (cod !== undefined) {
                            let cod_price = Math.ceil(priceInteger + (priceInteger * cod) / 100)
                            v.cod_amount = Number(cod_price.toFixed()); // ถ้ามี req.body.cod ก็นำไปใช้แทนที่

                            if(price >= 100){
                                new_data.push(v);
                            }
                            
                        }else{
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
        const price = req.body.price
        const costHub = req.body.cost_hub
        const cost = req.body.cost
        const id = req.decoded.userid
        const shop_id = req.body.shop_id
        const data = [{...req.body}] //, courier_code:courierCode
        const findShop = await shopPartner.findOne({shop_number:shop_id})
        if(!findShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านกรอก"})
        }
        //ผู้ส่ง
        const sender = data[0].from; //ผู้ส่ง
        const filterSender = { shop_id: shop_id , tel: sender.tel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
        
            const data_sender = { //ข้อมูลที่ต้องการอัพเดท หรือ สร้างใหม่
                ...sender,
                ID: id,
                status: 'ผู้ส่ง',
                shop_id: shop_id,
                postcode: String(sender.postcode),
            };

        const optionsSender = { upsert: true }; // upsert: true จะทำการเพิ่มข้อมูลถ้าไม่พบข้อมูลที่ตรงกับเงื่อนไข
        
        const resultSender = await dropOffs.updateOne(filterSender, data_sender, optionsSender);
            if (resultSender.upsertedCount > 0) {
                console.log('สร้างข้อมูลผู้ส่งคนใหม่');
            } else {
                console.log('อัปเดตข้อมูลผู้ส่งเรียบร้อย');
            }

        //ผู้รับ
        const recipient = data[0].to; // ผู้รับ
        const filter = { ID: id, tel: recipient.tel, status: 'ผู้รับ' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

            const update = { //ข้อมูลที่ต้องการอัพเดท หรือ สร้างใหม่
                ...recipient,
                ID: id,
                status: 'ผู้รับ',
                shop_id: shop_id,
                postcode: String(recipient.postcode),
            };

        const options = { upsert: true }; // upsert: true จะทำการเพิ่มข้อมูลถ้าไม่พบข้อมูลที่ตรงกับเงื่อนไข
        
        const result = await dropOffs.updateOne(filter, update, options);
            if (result.upsertedCount > 0) {
                console.log('สร้างข้อมูลผู้รับคนใหม่');
            } else {
                console.log('อัปเดตข้อมูลผู้รับเรียบร้อย');
            }
        
        const value = {
            api_key: process.env.SHIPPOP_API_KEY,
            email: "OrderHUB@gmail.com",
            url: {
                "success": "http://shippop.com/?success",
                "fail": "http://shippop.com/?fail"
            },
            data: data,
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
                ID: id,
                role: role,
                purchase_id: String(resp.data.purchase_id),
                shop_id: req.body.shop_id,
                cost_hub: costHub,
                cost: cost,
                parcel:parcel,
                price: Number(price.toFixed()),
          };
         new_data.push(v);
        const booking_parcel = await BookingParcel.create(v);
            if(!booking_parcel){
                console.log("ไม่สามารถสร้างข้อมูล booking ได้")
            }
        
        return res
                .status(200)
                .send({status: true,
                    res:resp.data,
                    booking:booking_parcel, 
                });
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
        const tracking_code = req.params.id
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: tracking_code,
        };
        const findStatus = await BookingParcel.findOne({ tracking_code: tracking_code });
        if (!findStatus) {
            return res
                    .status(400)
                    .send({ status: false, message: "ไม่มีหมายเลขที่ท่านกรอก" });
            }
        let updatedStatus = null
        if (findStatus.order_status === 'cancel'){
            return res
                    .status(404)
                    .send({status: false, message:"หมายเลขสินค้านี้ถูก cancel ไปแล้ว"})
        } else if (findStatus.order_status !== 'booking') {
            // ทำการอัปเดต order_status เป็น 'cancel'
            updatedStatus = await BookingParcel.findOneAndUpdate(
                { tracking_code: tracking_code },
                { $set: { order_status: 'cancel' } },
                { new: true }
            );
            if (!updatedStatus) {
                // ไม่สามารถอัปเดต order_status ได้
                return res
                        .status(400)
                        .send({ status: false, message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
            }
        } else {
            return res
                    .status(400)
                    .send({status: false, message:"ไม่สามารถยกเลิกสินค้าได้"})
        }

        const respStatus = await axios.post(`${process.env.SHIPPOP_URL}/cancel/`,valueCheck,
            {
              headers: {"Accept-Encoding": "gzip,deflate,compress",
                        "Content-Type": "application/json"},
            }
          )
        if(respStatus.data.code !== 1){
            return res
                    .status(400)
                    .send({
                        data:respStatus.data
                    })
        }
        // //คืนเงินให้ SHOP
        // const findShop = await shopPartner.findOne({shop_number:findStatus.shop_id})
        // if(!findShop){
        //     return res
        //             .status(400)
        //             .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านระบุ"})
        // }
        // let diffRefund = findStatus.price + findShop.credit
        // const refund = await shopPartner.findOneAndUpdate(
        //     {shop_number:findShop.shop_number},
        //     {credit: diffRefund},
        //     {new:true})
        // if(!refund){
        //     return res  
        //             .status(400)
        //             .send({status:false, message:"ไม่สามารถแก้ไข credit shop ได้"})
        // }
        // //บันทึกประวัติการเงินของ SHOP
        //     const history = {
        //             partnerID: id,
        //             shop_number: findShop.shop_number,
        //             orderid: findStatus.purchase_id,
        //             amount: findStatus.price,
        //             before: findShop.credit,
        //             after: diffRefund,
        //             type: findStatus.courier_code,
        //             remark: "ยกเลิกการส่งสินค้า(คืนเงิน)"
        //     }
        // const historyShop = await historyWalletShop.create(history)
        // if(!historyShop){
        //     console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        // }
            return res
                    .status(200)
                    .send({
                        status:true, 
                        cancel:updatedStatus, 
                        //refund:refund, 
                        res:respStatus.data,
                        // history:historyShop
                    })
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
        if(resp){
            return res
                    .status(200)
                    .send({status:true, data:resp.data})
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
            logo: "https://drive.google.com/thumbnail?id=1iUqsVT-_XklVpTkYS1fSCVpCIsCj8GGv",
            type:"html",
            size: req.body.size
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
                        .send({status:false, message:"ไม่สามารถลบได้"})
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

module.exports = {priceList, booking, cancelOrder, tracking, confirmOrder, callPickup
                , getAllBooking, trackingPurchase, labelHtml, getById, delend}