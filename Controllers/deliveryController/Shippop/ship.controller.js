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
const { codPercent } = require('../../../Models/COD/cod.shop.model');
const { postalThailand } = require('../../../Models/postal.thailand/postal.thai.model');
const { weightAll } = require('../../../Models/Delivery/weight/weight.all.express');
const { priceBase } = require('../../../Models/Delivery/weight/priceBase.express');
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { Admin } = require('../../../Models/admin');
const { decrypt } = require('../../../functions/encodeCrypto');
const { logOrder } = require('../../../Models/logs_order');
const { pickupOrder } = require('../../../Models/Delivery/pickup_sp');

dayjs.extend(utc);
dayjs.extend(timezone);

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

priceList = async (req, res)=>{
    try{
        // const percent = await PercentCourier.find();
        const shop = req.body.shop_number
        const id = req.decoded.userid
        const weight = req.body.parcel.weight * 1000
        const role = req.decoded.role
        const declared_value = req.body.declared_value
        const remark = req.body.remark
        const formData = req.body
        const express = req.body.express
        const packing_price = req.body.packing_price
        const send_behalf = formData.from.send_behalf
        const send_number = formData.from.send_number
        const send_type = formData.from.send_type
        const percentCOD = req.body.percentCOD 
        let reqCod = req.body.cod_amount

        if(send_behalf != "บริษัท" && send_behalf != "บุคคล"){
            return res
                    .status(400)
                    .send({status:false, type:"sender",message:"ผู้ส่ง กรุณากรอก ส่งในนาม บริษัทหรือบุคคล"})
        }else if(send_number == undefined || send_number == ""){
            return res
                    .status(400)
                    .send({status:false, type:"sender",message:"ผู้ส่ง กรุณากรอกหมายเลขผู้เสียภาษี, บัตรประชาชน หรือ passport"})
        }
        if(send_behalf == "บริษัท"){
            if(send_type != "หมายเลขผู้เสียภาษี"){
                return res
                    .status(400)
                    .send({status:false, type:"sender",message:"กรุณากรอกประเภท หมายเลขผู้เสียภาษี เพราะท่านเลือกส่งในนามบริษัท"})
            }
        }else if(send_behalf == "บุคคล"){
            if(send_type != "บัตรประชาชน" && send_type != "passport"){
                return res
                    .status(400)
                    .send({status:false, type:"sender",message:"กรุณากรอกประเภท บัตรประชาชน หรือ passport เพราะท่านเลือกส่งในนามบุคคล"})
            }
        }

        //ตรวจสอบข้อมูลผู้ส่ง จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
        try{
            if(!formData.from.name){
                return res
                        .status(400)
                        .send({status:false, type:"sender",message:"กรุณากรอกชื่อผู้ส่ง"});
            }else if(!formData.from.tel){
                return res
                        .status(400)
                        .send({status:false, type:"sender",message:"กรุณากรอกเบอร์โทรผู้ส่ง"});
            }
            let dataSenderFail = `ผู้ส่ง(${formData.from.name}) กรุณากรอก: `
            if(!formData.from.province || !formData.from.district || !formData.from.state || !formData.from.postcode){
                if(!formData.from.province){
                    dataSenderFail += 'จังหวัด/ '
                }
                if(!formData.from.state){
                    dataSenderFail += 'อำเภอ/ '
                }
                if(!formData.from.district){
                    dataSenderFail += 'ตำบล/ '
                }
                if(!formData.from.postcode){
                    dataSenderFail += 'รหัสไปรษณีย์/ '
                }
                return res
                        .status(400)
                        .send({status:false, type:"sender",message: dataSenderFail});
            }

            const data = await postalThailand.find({postcode: formData.from.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, type:"sender", message:"ไม่พบรหัสไปรษณีย์ที่ผู้ส่งระบุ"})
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
                        .send({staus:false, type:"sender",message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        //ตรวจสอบข้อมูลผู้รับ จังหวัด อำเภอ ตำบล ที่ส่งเข้ามาว่าถูกต้องหรือไม่
        try{
            if(!formData.to.name){
                return res
                        .status(400)
                        .send({status:false, type:"receive",message:"กรุณากรอกชื่อผู้รับ"});
            }else if(!formData.to.tel){
                return res
                        .status(400)
                        .send({status:false, type:"receive",message:"กรุณากรอกเบอร์โทรผู้รับ"});
            }
            let dataReceiveFail = `กรุณากรอก: `
            if(!formData.to.province || !formData.to.district || !formData.to.state || !formData.to.postcode){
                if(!formData.to.province){
                    dataReceiveFail += 'จังหวัด/ '
                }
                if(!formData.to.state){
                    dataReceiveFail += 'อำเภอ/ '
                }
                if(!formData.to.district){
                    dataReceiveFail += 'ตำบล/ '
                }
                if(!formData.to.postcode){
                    dataReceiveFail += 'รหัสไปรษณีย์/ '
                }
                return res
                        .status(400)
                        .send({status:false, type:"receive",message: dataReceiveFail});
            }
        
            const data = await postalThailand.find({postcode: formData.to.postcode})
                if (!data || data.length == 0) {
                    return res
                            .status(404)
                            .send({status:false, type:"receive", message:"ไม่พบรหัสไปรษณีย์ที่ผู้รับระบุ"})
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
                        .send({staus:false, type:"receive", message: errorMessage.trim() || 'ข้อมูลไม่ตรงกับที่ระบุ'});
            } 
        }catch(err){
            console.log(err)
        }

        if(weight <= 0 || weight == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณาระบุน้ำหนัก(kg)`})
        }
        if(formData.parcel.width == 0 || formData.parcel.width == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกความกว้าง(cm)`})
        }else if(formData.parcel.length == 0 || formData.parcel.length == undefined){
            return res
                    .status(400)
                    .send({status:false,type:"receive", message:`ลำกรุณากรอกความยาว(cm)`})
        }else if(formData.parcel.height == 0 || formData.parcel.height == undefined){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกความสูง(cm)`})
        }

        if(!Number.isInteger(packing_price)){
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:`กรุณากรอกค่าบรรจุภัณฑ์เป็นเป็นตัวเลขจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม,ตัวอักษร หรือค่าว่าง`})
        }
        if (!Number.isInteger(reqCod)||
            !Number.isInteger(declared_value)) {
                    return res.status(400).send({
                        status: false,
                        type:"receive",
                        message: `กรุณาระบุค่า COD หรือ มูลค่าสินค้า(ประกัน) เป็นตัวเลขจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม,ตัวอักษร หรือค่าว่าง`
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
                // console.log('อัปเดตข้อมูลผู้ส่งเรียบร้อย');
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

        if(express){ //กรณีมีการกำหนด ขนส่ง เข้ามาเช่น เช่นการใช้ EXCEL ต้องมีการกำหนดขนส่งมาแน่นอน
            const checkSwitch = findForCost.express.find(item => item.express == `SHIPPOP(${express})`)
            if(checkSwitch.on_off == false || checkSwitch.cancel_contract == true){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่สามารถใช้งานระบบขนส่งนี้ได้"})
            }
        }

        let shopLine = []
        if(reqCod != 0){
            const findShopCod = await codPercent.findOne({shop_id:findForCost._id})
                if(!findShopCod){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่มีร้านค้าที่ท่านระบุในการค้นหาเปอร์เซ็นต์ COD"})
                }
                shopLine.push(findShopCod)
                let shop_line = findShopCod.shop_line
                if(shop_line != "ICE"){
                    do{
                        const findShopLine = await codPercent.findOne({shop_id:shop_line})
                            if(findShopLine){
                                shop_line = findShopLine.shop_line
                                shopLine.push(findShopLine)
                            }
                    }while(shop_line != "ICE")
                }
                shopLine.push({shop_line :"ICE"})
        }
        // let codCal = codCalculate(findForCost)
        // console.log(shopLine)
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
                "showall": 0,
                "shop_number": req.body.shop_number//524854
        });
        if(express){
            data[0].courier_code = express
        }
        if(reqCod > 0){
            data[0].cod_amount = reqCod
        }
        // console.log(data)
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
        const express_true = findForCost.express.filter(item =>  //ใช้หาว่า ขนส่ง SHIPPOP ใดบ้างของร้านค้าที่มีการ อนุมัติ และ ไม่ถูกยกเลิกสัญญา
                item.on_off === true && 
                item.cancel_contract === false && 
                item.express.startsWith("SHIPPOP")
            )
        // console.log(express_true)
            if(express_true.length == 0){ //ผู้แนะนำไม่ได้อนุมัติให้ใช้ ขนส่งของ SHIPPOP ตัวไหนเลย
                return res
                        .status(400)
                        .send({
                            status:false, 
                            message:"ไม่มีขนส่ง ORDERHUB PACKAGE อันไหนได้รับการอนุมัติ กรุณาให้ผู้แนะนำท่านอนุมัติการใช้งาน",
                            data:[]
                        })
            }
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

        let express_active = Object.keys(obj) //ใช้หาว่า ขนส่งไหนบ้านที่ SHIPPOP อนุญาติให้ใช้ใน ORDER นี้
                .filter(item => obj[item].available == true)
                .map(item => {
                    let v ={
                        ...obj[item],
                        express: `SHIPPOP(${obj[item].courier_code})`
                    }
                    return v 
                })
        if(express){
            if(express_active.length == 0){ //shippop ไม่มีขนส่งไหนอนุมัติให้ใช้เลย
                return res
                        .status(400)
                        .send({status:false, message:`ขนส่งของ ORDERHUB PACKAGE(${express}) ไม่รองรับออเดอร์ของท่าน`})
            }
        }else{
            if(express_active.length == 0){ //shippop ไม่มีขนส่งไหนอนุมัติให้ใช้เลย
                return res
                        .status(400)
                        .send({
                            status:false, 
                            message:"ไม่มีขนส่งไหนของ ORDERHUB PACKAGE รองรับออเดอร์ของท่าน",
                            data:[]
                        })
            }
        }

        let express_approve = []
        //ทำการวนเช็คว่ามีขนส่งที่อนุมัติ อันไหนบ้าง ที่ SHIPPOP อนุญาติให้ใช้งาน
        for(const express of express_true){ 
            const findExpress = express_active.find(item => item.express == express.express)
            if(findExpress){
                express_approve.push(findExpress)
                // console.log(findExpress)
            }else{
                let v = {
                    express: express.express,//ชื่อของ ขนส่งที่ อนุมัติ แต่ Shippop ไม่มีอนุญาติให้ทำการขนส่ง
                    courier_code: express.courier_code,
                    courier_name: express.courier_name,
                    available: false,
                    status: "ขนส่งนี้ไม่รองรับออเดอร์ของท่าน"
                }
                express_approve.push(v)
            }
        }
        // console.log(express_approve)

        const express_in = express_approve //สร้าง Array ของขนส่งที่ อนุมัติ และ Shippop อนุญาติให้ทำการใช้งาน
                .filter(item => item.available == true)
                .map(item => item.express)
        
        //ดึงราคากับน้ำหนักของขนส่งที่ อนุมัติ และ Shippop อนุญาติให้ทำการใช้งาน
        const result = await weightAll.find(
            {
                shop_id: findForCost._id,
                express: { $in: express_in }  // เปลี่ยนตำแหน่ง $in
            },{shop_id:1, weightMax:1, weight:1, express:1, owner_id:1, shop_line:1})
            if(!result){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีร้านค้านี้ในระบบ"})
            }

        //ดึงราคาขายหน้าร้านมาตรฐาน ของขนส่งที่ อนุมัติ และ Shippop อนุญาติให้ทำการใช้งาน
        const findPriceBase = await priceBase.find({express: { $in: express_in }})
            if(!findPriceBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }

         //เช็คว่าอยู่เขต กรุงเทพ/ปริมณฑล หรือเปล่า
         let priceBangkok = false;
         const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
             if (findPostcal) {
                 priceBangkok = true;
             }

        let new_data = [];
        for(const ob of express_approve){
            if(ob.available){
                let v = null;
                if(reqCod > 0 && ob.express == `SHIPPOP(ECP)`){
                    console.log('"ECP" not support COD. Skipping this iteration.');
                    continue; // ข้ามไปยังรอบถัดไป
                }
                let resultP
                let findP = result.find(item => item.express == ob.express)
                let p = findP.weight
                let weightKG = weight / 1000
                // console.log(weightKG)
                    for(let i = 0; i< p.length; i++){
                        if(weightKG >= p[i].weightStart && weightKG <= p[i].weightEnd){
                            resultP = p[i]
                            break;
                        }
                    }

                let resultBase
                let findBase = findPriceBase.find(item => item.express == ob.express)
                let base = findBase.weight
                    for(let i = 0; i< base.length; i++){
                        if(weightKG >= base[i].weightStart && weightKG <= base[i].weightEnd){
                            resultBase = base[i]
                            break;
                        }
                    }

                let returnMessage = {
                    express : ob.express,
                    courier_name : ob.courier_name
                }
                    if(findP.weightMax < weightKG){
                        if(findP.weightMax == 0){
                            returnMessage.status = `ร้านค้า ${req.body.shop_number} กรุณารอการระบุน้ำหนักที่สามารถใช้งานได้`
                            returnMessage.available = false

                        }else{
                            returnMessage.status = `น้ำหนักของร้านค้า ${req.body.shop_number} ที่คุณสามารถสั่ง Order ได้ต้องไม่เกิน ${findP.weightMax} กิโลกรัม`
                            returnMessage.available = false

                        }
                    }else if(resultP.costUpcountry == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคา(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`

                    }else if(resultP.costBangkok_metropolitan == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`
                        
                    }else if(resultP.salesBangkok_metropolitan == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณากรอกราคาขายหน้าร้าน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`
                       
                    }else if(resultP.salesUpcountry == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณากรอกราคาขายหน้าร้าน(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`
                       
                    }else if(resultBase.costUpcountry == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคาแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`
     
                    }else if(resultBase.costBangkok_metropolitan == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคาแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`
                       
                    }else if(resultBase.salesBangkok_metropolitan == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`
                        
                    }else if(resultBase.salesUpcountry == 0){
                        returnMessage.available = false
                        returnMessage.status = `กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`

                    }
                //คำนวนกำไร COD ของแต่ละคน 
                let cod_cal = {
                    cod_percent : [],
                    fee_cod_total : 0,
                }
                if(reqCod > 0){
                    cod_cal = await codCalculate(percentCOD,shopLine,ob.express,reqCod,ob.courier_name,ob.courier_code)
                }
                if(express){
                    if(returnMessage.available == false){
                        return res
                                .status(400)
                                .send({status:false,type:"sender",message:returnMessage.status})
                    }else if(cod_cal.available == false){
                        return res
                                .status(400)
                                .send({status:false,type:"sender",message:cod_cal.status})
                    }
                }
                if(returnMessage.available == false){
                    new_data.push(returnMessage)
                    continue;
                }else if(cod_cal.available == false){
                    new_data.push(cod_cal)
                    continue;
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
                // let profitSaleMartket
                
                let findOwner = cod_cal.cod_percent.find((item)=> item.id == findP.owner_id)
                    if(!findOwner){
                        cod_profit = 0
                    }else{
                        cod_profit = findOwner.cod_profit //กำไร COD ของผู้ส่งออเดอร์
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
                            id: findP.owner_id,
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
                            id: findP.owner_id,
                            cost_price: parseFloat(price.toFixed(2)),
                            cost: parseFloat(cost.toFixed(2)),
                            profit: parseFloat(profit_partner.toFixed(2)),
                            cod_profit: parseFloat(cod_profit.toFixed(2)),
                            total: parseFloat(total.toFixed(2))
                        }
                    profit.push(dataOne)
                }
                // console.log(profit)
                let shop_line = findP.shop_line
                if(shop_line != 'ICE'){
                    do{
                        const findHead = await weightAll.findOne(
                                {
                                    shop_id: shop_line,
                                    express:ob.express
                                })
                        let profitOne 
                        let cod_profit
                        let findWeight = findHead.weight.find((item)=> item.weightEnd == resultP.weightEnd )
                        let findOwner = cod_cal.cod_percent.find((item)=> item.id == findHead.owner_id)
                        // let findOwner = cod_percent.find((item)=> item.id == findHead.owner_id)  
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
                let findIce = cod_cal.cod_percent.find((item)=> item.id == 'ICE')
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
                let price_fuel_surcharge = ob.price_fuel_surcharge || 0; //ตรวจสอบว่ามีตัวแปร price_fuel_surcharge หรือไม่ ถ้าไม่มีให้เท่ากับ 0
                let price_remote_area = ob.price_remote_area || 0;
                let price_travel_area = ob.price_travel_area || 0;
                let price_island_area = ob.price_island_area || 0;
                v = {
                    ...req.body,
                    courier_code: ob.courier_code,
                    express: ob.express,
                    available: true,
                    price_remote_area: price_remote_area,
                    price_travel_area: price_travel_area,
                    price_island_area: price_island_area,
                    price_fuel_surcharge: price_fuel_surcharge,
                    cost_hub: cost_hub,
                    cost_base: cost_base,
                    fee_cod: 0,
                    fee_cod_orderhub: 0,
                    fee_cod_sp: ob.price_cod,
                    price: Number(price.toFixed()),
                    declared_value: declared_value,
                    insuranceFee: insuranceFee,
                    packing_price: packing_price,
                    total: 0,
                    cut_partner: 0,
                    status: status,
                    remark: remark,
                    profitAll: profit
                }
                if(declared_value > 0){
                    v.insurance_code = "DHPY"
                }

                let formattedFee = parseFloat(cod_cal.fee_cod_total.toFixed(2));
                let total = price + formattedFee + insuranceFee + packing_price + ob.price_cod + price_fuel_surcharge + price_remote_area + price_travel_area + price_island_area
                    v.fee_cod = formattedFee + ob.price_cod
                    v.fee_cod_orderhub = formattedFee

                let cut = cut_partner + insuranceFee + formattedFee + ob.price_cod + price_fuel_surcharge + price_remote_area + price_travel_area + price_island_area
                    v.cut_partner = parseFloat(cut.toFixed(2))
                    v.total = parseFloat(total.toFixed(2))
                    
                try {
                    await Promise.resolve(); // ใส่ Promise.resolve() เพื่อให้มีตัวแปรที่ await ได้
                    if (findForCost.credit < v.cut_partner) {
                        v.status = 'จำนวนเงินของท่านไม่เพียงพอ';
                        v.available = false
                    } else {
                        v.status = 'พร้อมใช้บริการ';
                    }
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการรอรับค่า');
                }
                    new_data.push(v);
            }else{
                if(!express){
                    new_data.push(ob)
                }
            }
        }

        return res
                .status(200)
                .send({ 
                    status: true, 
                    origin_data: resp.data, 
                    express_active: express_in,
                    // result: express_active,
                    new: new_data
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
        const id = req.decoded.userid
        const role = req.decoded.role
        const formData = req.body
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const remark = req.body.remark
        const packing_price = req.body.packing_price
        const declared_value = req.body.declared_value
        const insuranceFee = req.body.insuranceFee
        const cost_base = req.body.cost_base
        const fee_cod_orderhub = req.body.fee_cod_orderhub
        const fee_cod_sp = req.body.fee_cod_sp
        const profitAll = req.body.profitAll
        const print_code = req.body.print_code
        const express = req.body.express
        const price_remote_area = req.body.price_remote_area //ราคาพื้นที่ห่างไกล J&T ไม่มีบอกน้าา
        const price_travel_area = req.body.price_travel_area
        const price_island_area = req.body.price_island_area
        const price_fuel_surcharge = req.body.price_fuel_surcharge
        let cut = req.body.cut_partner
        const cut_partner = parseFloat(cut.toFixed(2))
        const shop = req.body.shop_number
        const weight = req.body.parcel.weight * 1000
        const data = [
            {
                ...formData
            }
        ] //, courier_code:courierCode
        data[0].parcel.weight = weight
        // console.log(data)
        const invoice = await invoiceNumber(dayTime)
        console.log(invoice)
        const findCredit = await shopPartner.findOne({shop_number:shop})
        if(!findCredit){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านกรอก"})
        }
        if(findCredit.credit < cut_partner){
            return res
                    .status(400)
                    .send({status:false, message:`Credits ปัจจุบันของร้านค้า ${findCredit.shop_name} ไม่เพียงพอต่อการส่งสินค้า`})
        }
        //ผู้ส่ง
        const sender = data[0].from; //ผู้ส่ง
        const filterSender = { shop_id: shop , tel: sender.tel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

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
        const purchase_id = resp.data.purchase_id
        const new_data = resp.data.data[0]

        let allProfit = []
        let profit_ice
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

            // console.log(findShop.credit)
            let credit = parseFloat(findShop.credit.toFixed(2))
            const plus = credit + cut_partner
            let plusFloat = parseFloat(plus.toFixed(2))
            const history = {
                    shop_id: findShop._id,
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.tracking_code,
                    mailno: purchase_id,
                    amount: cut_partner,
                    before: plusFloat,
                    after: credit,
                    type: express,
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
                    orderid: new_data.tracking_code,
                    mailno: purchase_id,
                    cost_price: profitAll[0].cost_price,
                    cost: profitAll[0].cost,
                    profitCost: profitAll[0].profit,
                    profitCOD: profitAll[0].cod_profit,
                    packing_price: packing_price,
                    profit: profitAll[0].total + packing_price,
                    express: express,
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
            let idReal
                if(role == 'partner'){
                    idReal = id
                }else if(role == 'shop_member'){
                    idReal = req.decoded.id_ownerShop
                }
            let profitOne = await Partner.findOneAndUpdate(
                    { _id: idReal },
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
                                        orderid: new_data.tracking_code,
                                        mailno: purchase_id,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: express,
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
                                        orderid: new_data.tracking_code,
                                        mailno: purchase_id,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: express,
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
                tracking_code: new_data.tracking_code,
                mailno: new_data.courier_tracking_code,
                purchase_id:purchase_id,
                from:{
                    ...formData.from
                },
                to:{
                    ...formData.to
                },
                parcel:{
                    ...formData.parcel
                },
                invoice: invoice,
                status:'booking',
                cost_hub: cost_hub,
                cost_base: cost_base,
                cod_amount:cod_amount,
                fee_cod: fee_cod,
                fee_cod_orderhub: fee_cod_orderhub,
                fee_cod_sp: fee_cod_sp,
                cod_vat: new_data.cod_vat,
                total: total,
                cut_partner: cut_partner,
                packing_price: packing_price,
                price_remote_area: price_remote_area,
                price_travel_area: price_travel_area,
                price_island_area: price_island_area,
                price_fuel_surcharge: price_fuel_surcharge,
                price: price,
                print_code: print_code,
                declared_value: declared_value,
                insuranceFee: insuranceFee,
                profitAll: profitAll,
                express: express,
                remark: remark,
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        if(cod_amount != 0){
            const pfSenderTemplate = {
                    orderid: new_data.tracking_code,
                    owner_id: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    type: 'COD(SENDER)',
                    'template.partner_number': new_data.courier_tracking_code,
                    'template.account_name':updatedDocument.flash_pay.name,
                    'template.account_number':updatedDocument.flash_pay.card_number,
                    'template.bank':updatedDocument.flash_pay.aka,
                    'template.amount':cod_amount,
                    'template.phone_number': updatedDocument.tel,
                    'template.email':updatedDocument.email,
                    status:"รอรถเข้ารับ",
                    express: express
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
                    // res: resp.data,
                    order: createOrderAll,
                    // shop: findShop,
                    profitAll: allProfit,
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
        const firstname = req.decoded.firstname
        const lastname = req.decoded.lastname
        const txlogisticid = req.body.txlogisticid
        const ip_address = req.decoded.ip_address
        const latitude = req.decoded.latitude
        const longtitude = req.decoded.longtitude
        const IP = await decrypt(ip_address)
        const LT = await decrypt(latitude)
        const LG = await decrypt(longtitude)
        const tracking_code = req.params.tracking_code
        const valueCheck = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: tracking_code,
        };
        const findCancel = await orderAll.findOne({ tracking_code: tracking_code });
            if (!findCancel) {
                return res
                        .status(400)
                        .send({ status: false, message: "ไม่มีหมายเลขที่ท่านกรอก" });
            }else if(findCancel.order_status == 'cancel'){
                return res
                        .status(404)
                        .send({status: false, message:"ออเดอร์นี้ถูก cancel ไปแล้ว"})
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
                            data:respStatus.data,
                            message:"ไม่สามารถทำการยกเลิกสินค้าได้"
                        })
        }else{
            let refundAll = []
            let formData = {
                        ip_address: IP,
                        id: id,
                        role: role,
                        type: 'CANCEL ORDER',
                        orderer:`${firstname} ${lastname}`,
                        description: "ยูสเซอร์ยกเลิกสินค้า",
                        order:[{
                            orderid:findCancel.tracking_code,
                            express:findCancel.express
                        }],
                        latitude: LT,
                        longtitude: LG
                }
             
            const createLog = await logOrder.create(formData)
                if(!createLog){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้าง Logs ได้"})
                }
            const findPno = await orderAll.findOneAndUpdate(
                {tracking_code:tracking_code},
                {
                    order_status:"cancel",
                    day_cancel: createLog.day,
                    user_cancel:`${firstname} ${lastname}`
                },
                {new:true})
                if(!findPno){
                    return res
                            .status(400)
                            .send({status:false, message:`ไม่สามารถค้นหาหมายเลข tracking_code(${tracking_code}) หรืออัพเดทข้อมูลได้`})
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
                let diff = findShop.credit - findPno.cut_partner
                let before = parseFloat(diff.toFixed(2));
                let after = findShop.credit.toFixed(2)
                let history = {
                            amount: findPno.cut_partner,
                            before: before,
                            after: after,
                            type: 'J&T',
                            remark: "ยกเลิกขนส่งสินค้า",
                            day_cancel: createLog.day,
                            user_cancel: `${firstname} ${lastname}`
                    }
            const historyShop = await historyWalletShop.findOneAndUpdate(
                {
                    orderid:tracking_code,
                },{
                    ...history
                },{
                    new:true
                })
                    if(!historyShop){
                        return res
                                .status(404)
                                .send({status:false, message:`ไม่มีหมายเลข tracking_code(${tracking_code}) ที่ท่านต้องการยกเลิก`})
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
                    orderid : tracking_code
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
                if(findPno.cod_amount != 0){
                   let findTemplate = await profitTemplate.findOneAndUpdate(
                        { orderid : tracking_code},
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
                            {orderid: tracking_code},
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
                                orderid : tracking_code
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
                    .send({
                        status:true, 
                        response: respStatus.data,
                        data:refundAll})
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
            tracking_code: req.body.tracking_code,
            type:"html",
            size: req.body.size,
            logo: "https://i.postimg.cc/28Np7d6d/unnamed.jpg"
        };
        const resp = await axios.post(`${process.env.SHIPPOP_URL}/label_tracking_code/`,valueCheck,
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

callPickup = async (req, res)=>{ 
    try{
        const id = req.decoded.userid
        const tracking_code = req.body.tracking_code
        const num_of_parcel = req.body.num_of_parcel
        const datetime_pickup = req.body.datetime_pickup
        const origin_name = req.body.origin_name
        const origin_phone = req.body.origin_phone
        const origin_address = req.body.origin_address
        const origin_district = req.body.origin_district
        const origin_city = req.body.origin_city
        const origin_province = req.body.origin_province
        const origin_postcode = req.body.origin_postcode
        const data = {
            api_key: process.env.SHIPPOP_API_KEY,
            tracking_code: tracking_code,
            num_of_parcel: num_of_parcel,
            datetime_pickup: datetime_pickup,
            origin_name : origin_name,
            origin_phone : origin_phone,
            origin_address : origin_address,
            origin_district : origin_district,
            origin_city : origin_city,
            origin_province : origin_province,
            origin_postcode : origin_postcode
        }
    
        const config = {
            method: 'post',
            maxBodyLength: Infinity, // เพิ่มส่วนนี้เพื่อรองรับข้อมูลขนาดใหญ่
            url: `${process.env.SHIPPOP_URL}/calltopickup/`,
            headers: {
                "Accept-Encoding": "gzip,deflate,compress",
                "Content-Type": "application/json"
            },
            data: data
        };
        try {
            const response = await axios(config);
                if(response.data.status == false){
                    return res
                            .status(400)
                            .send({
                                status:false, 
                                message:"เรียกรถเข้ารับล้มเหลว กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน",
                                data:response.data
                            })
                }
            let v = {
                partner_id:id,
                courier_ticket_id:response.data.courier_ticket_id,
                courier_pickup_id:response.data.courier_pickup_id,
                tracking_code: tracking_code,
                num_of_parcel: num_of_parcel,
                datetime_pickup: datetime_pickup,
                origin_name : origin_name,
                origin_phone : origin_phone,
                origin_address : origin_address,
                origin_district : origin_district,
                origin_city : origin_city,
                origin_province : origin_province,
                origin_postcode : origin_postcode,
                status:"กำลังเรียกรถเข้ารับ"
            }
            const createPickup = await pickupOrder.create(v)
                if(!createPickup){
                    return res  
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างข้อมูลเรียกรถเข้ารับได้"})
                }
            return res
                    .status(200)
                    .send({
                        status:true, 
                        data:createPickup,
                        response: response.data
                    })
        } catch (error) {
            console.error(error);
            return res
                    .status(400)
                    .send({status:false, message:error})
        }
       
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getPickup = async (req, res)=>{ 
    try{
        const courier_ticket_pickup_ids = req.body.courier_ticket_pickup_ids
        const page = req.body.page
        const data = {
            api_key: process.env.SHIPPOP_API_KEY,
            courier_ticket_pickup_ids: courier_ticket_pickup_ids,
            page: page,
            perpage: 100
        };
        
        const config = {
            method: 'post',
            maxBodyLength: Infinity, // เพิ่มส่วนนี้เพื่อรองรับข้อมูลขนาดใหญ่
            url: `${process.env.SHIPPOP_URL}/pickup/`,
            headers: {
                "Accept-Encoding": "gzip,deflate,compress",
                "Content-Type": "application/json"
            },
            data: data
        };
        try {
            const response = await axios(config);
            return res
                    .status(200)
                    .send({status:true, data:response.data.data})
        } catch (error) {
            console.error(error);
        }
       
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

cancelPickup = async (req, res)=>{
    try{
        const courier_pickup_id = req.body.courier_pickup_id
        const id = req.params.id
        const data = {
            api_key: process.env.SHIPPOP_API_KEY,
            courier_pickup_id: courier_pickup_id
        };
        
        const config = {
            method: 'post',
            maxBodyLength: Infinity, // เพิ่มส่วนนี้เพื่อรองรับข้อมูลขนาดใหญ่
            url: `${process.env.SHIPPOP_URL}/pickup/cancel/`,
            headers: {
                "Accept-Encoding": "gzip,deflate,compress",
                "Content-Type": "application/json"
            },
            data: data
        };
        try {
            const response = await axios(config);
            // console.log(response.data)
                if(response.data.status == false){
                    return res
                            .status(400)
                            .send({
                                status:false, 
                                message:"ไม่สามารถยกเลิกเรียกรถเข้ารับได้",
                                data:response.data
                            })
                }
            const update = await pickupOrder.findOneAndUpdate(
                    {
                        _id:id,
                        courier_pickup_id:courier_pickup_id
                    }, 
                    {
                        status:"ยกเลิกเข้ารับ"
                    }
                )
                if(!update){
                    return res  
                            .status(400)
                            .send({status:false, message:"ไม่สามารถยกเลิกเรียกรถเข้ารับได้"})
                }
            return res
                    .status(200)
                    .send({
                        status:true, 
                        resp:response.data,
                        data:update
                    })
        }catch(err){
            console.log(err)
            return res
                    .status(400)
                    .send({status:false, message:err})
        }
    }catch(err){
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

async function invoiceNumber(day) {
    day = `${dayjs(day).format("YYYYMMDD")}`
    let data = `ODHSP`
    let random = Math.floor(Math.random() * 10000000)
    const combinedData = data + day + random;
    const findInvoice = await orderAll.find({invoice:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000);
        combinedData = data + day + random;

        // เช็คใหม่
        findInvoice = await orderAll.find({invoice: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

async function codCalculate(percent,shopLine,express,reqCod,courier_name,courier_code){
    try{
        let cod_percent = []
        let fee_cod_total = 0
        let profitCOD = 0 //ห้ามลบ
            let fee_cod = 0
            let percentCOD = percent
                    
            // สร้าง regular expression เพื่อตรวจสอบทศนิยมไม่เกิน 2 ตำแหน่ง
            const regex = /^\d+(\.\d{1,2})?$/;

            let pFirst = shopLine[0].express.find((item)=> item.express == express)

                if(pFirst.percent == 0){
                        return {
                            express: express,
                            courier_code: courier_code,
                            courier_name:courier_name,
                            available:false,
                            type:"sender",
                            status:"กรุณารอพาร์ทเนอร์ที่แนะนำท่านกรอกเปอร์เซ็น COD ที่ต้องการ"
                        }
    
                }else if(!regex.test(percentCOD)){
                        return {
                                express: express,
                                courier_code: courier_code,
                                courier_name:courier_name,
                                available:false,
                                type:"sender",
                                status:"ค่าเปอร์เซ็น COD ต้องเป็นทศนิยมไม่เกิน 2 ตำแหน่ง"
                            }
                }else if(percentCOD != 0 && percentCOD < pFirst.percent){
                        return {
                                express: express,
                                courier_code: courier_code,
                                courier_name:courier_name,
                                available:false, 
                                type:"sender",
                                status:"กรุณาอย่าตั้ง %COD ต่ำกว่าพาร์ทเนอร์ที่แนะนำท่าน"
                            }
                }
                // console.log(percentCOD)
                if(percentCOD != 0){ //กรณีกรอก %COD ที่ต้องการมา
                        let feeOne = (reqCod * percentCOD)/100
                        fee_cod_total = feeOne
                        fee_cod = (reqCod * pFirst.percent)/100
                        let profit = feeOne - fee_cod
                            let v = {
                                id:shopLine[0].owner_id,
                                cod_profit:profit
                            }
                        profitCOD = profit
                        cod_percent.push(v)
                }else{
                        fee_cod = ((reqCod * pFirst.percent)/100)
                        fee_cod_total = fee_cod
                }

                // console.log(shop_line)
                for(const item of shopLine.slice(1)){  //เริ่มที่ Array index ที่ 1 ทันทีไม่ต้องเริ่มที่ 0 
                    // console.log(item)
                    if(!item.head_line){
                            let v = {
                                id:'ICE',
                                cod_profit:fee_cod
                            }
                        cod_percent.push(v)
                    }else{
                        const findShopLine = item
                            const p = findShopLine.express.find((item)=> item.express == express)
                            let feeOne = (reqCod * p.percent)/100
                            let profit = fee_cod - feeOne
                                fee_cod -= profit
                                    let v = {
                                            id:findShopLine.owner_id,
                                            cod_profit:profit
                                        }
                                cod_percent.push(v)
                    }
                }
            return {
                express:express,
                fee_cod_total:fee_cod_total,
                cod_percent:cod_percent
            }

    }catch(err){
        console.log(err)
        return {
            error:err
        }
    }
}

module.exports = {priceList, booking, cancelOrder, tracking, confirmOrder, callPickup
                , getAllBooking, trackingPurchase, labelHtml, getById, delend, getMeBooking, getMeBooking
                , getPartnerBooking, getOrderDay, getOrderByTracking, priceListTest, getPickup, cancelPickup}