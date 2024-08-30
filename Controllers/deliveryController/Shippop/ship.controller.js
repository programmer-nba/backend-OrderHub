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
        if(express){
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
        }
        // let codCal = codCalculate(findForCost)

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
        let express_in = []
        let express_active = Object.keys(obj)
                .filter(item => obj[item].available == true)
                .map(item => {
                    let v ={
                        ...obj[item],
                        courier_code: `SHIPPOP(${obj[item].courier_code})`
                    }
                    express_in.push(`SHIPPOP(${obj[item].courier_code})`)
                    return v 
                })
        const result = await weightAll.find(
            {
                shop_id: findForCost._id,
                express: { $in: express_in }  // เปลี่ยนตำแหน่ง $in
            },{shop_id:1, weightMax:1, weight:1, express:1})
            if(!result){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีร้านค้านี้ในระบบ"})
            }       
        // // if(upline === 'ICE'){
        //     for (const ob of Object.keys(obj)) {
        //         if (obj[ob].available) { // ทำการประมวลผลเฉพาะเมื่อ obj[ob].available เป็น true
        //             if (reqCod > 0 && obj[ob].courier_code == 'ECP') {
        //                 console.log('Encountered "ECP". Skipping this iteration.');
        //                 continue; // ข้ามไปยังรอบถัดไป
        //             }
        //             const express = findForCost.express.find(item => item.courier_code == `${obj[ob].courier_code}`)
        //             let v = null;
        //                 if(express.on_off == false){
        //                     console.log(`Skipping ${obj[ob].courier_code} because courier is off`)
        //                     continue
        //                 }else if (express.cancel_contract == true) {
        //                     console.log(`PACKAGE ONE ${obj[ob].courier_code} ไม่สามารถใช้งานได้ในขณะนี้`)
        //                     continue
        //                 }else if (!express) {
        //                     console.log(`ยังไม่มี courier name: ${obj[ob].courier_code}`);
        //                     continue
        //                 }
                    
        //             // คำนวนต้นทุนของร้านค้า
        //             let cost_hub = Number(obj[ob].price);
        //             let price
        //             let profit_partner
        //             let profit = []
        //             if (priceBangkok) { //กรณีผู้รับอยู่ กรุงเทพ/ปริมณฑล
        //                     let price1 = cost_hub + p.salesBangkok_metropolitan;
        //                     price = price1 + p.costBangkok_metropolitan;
        //                     profit_partner = p.salesBangkok_metropolitan

        //                     let dataOne = {
        //                         id: line[0].down_line,
        //                         profit: p.salesBangkok_metropolitan,
        //                     }
        //                     let dataTwo = {
        //                         id: line[0].head_line,
        //                         profit: p.costBangkok_metropolitan,
        //                     }
        //                     profit.push(dataOne)
        //                     profit.push(dataTwo)
        //             } else {//กรณีผู้รับอยู่ ต่างจังหวัด
        //                     let price1 = cost_hub + p.salesUpcountry;
        //                     price = price1 + p.costUpcountry
        //                     profit_partner = p.salesUpcountry

        //                     let dataOne = {
        //                         id: line[0].down_line,
        //                         profit: p.salesUpcountry,
        //                     }
        //                     let dataTwo = {
        //                         id: line[0].head_line,
        //                         profit: p.costUpcountry,
        //                     }
        //                     profit.push(dataOne)
        //                     profit.push(dataTwo)
        //             }
                    
        //             // บวก total กับ cost ของ array ที่เหลือ
        //             for (let i = 1; i < line.length; i++) {
        //                 if (priceBangkok) {
        //                     let findExpress = line[i].express.find(element => element.courier_code == obj[ob].courier_code)
        //                     price += findExpress.costBangkok_metropolitan;
        //                     let dataOne = {
        //                         id: line[i].head_line,
        //                         profit: findExpress.costBangkok_metropolitan
        //                     }
        //                     profit.push(dataOne)
        //                 } else {
        //                     let findExpress = line[i].express.find(element => element.courier_code == obj[ob].courier_code)
        //                     price += findExpress.costUpcountry;
        //                     let dataOne = {
        //                         id: line[i].head_line,
        //                         profit: findExpress.costUpcountry
        //                     }
        //                     profit.push(dataOne)
        //                 }
        //             }
        //             // return res
        //             //         .status(200)
        //             //         .send({status:true , 
        //             //             data:profit, 
        //             //             cost_hub:cost_hub,
        //             //             price:price,
        //             //             line:line
        //             //         })

        //             let status = null;
        //             let cod_amount = 0
                    
        //             try {
        //                 await Promise.resolve(); // ใส่ Promise.resolve() เพื่อให้มีตัวแปรที่ await ได้
        //                 if (findForCost.credit < price) {
        //                     status = 'จำนวนเงินของท่านไม่เพียงพอ';
        //                 } else {
        //                     status = 'พร้อมใช้บริการ';
        //                 }
        //             } catch (error) {
        //                 console.error('เกิดข้อผิดพลาดในการรอรับค่า');
        //                 console.error(error);
        //             }
        //             v = {
        //                 ...obj[ob],
        //                 price_remote_area: 0,
        //                 cost_hub: cost_hub,
        //                 cod_amount: Number(cod_amount.toFixed()),
        //                 fee_cod: 0,
        //                 profitPartner: 0,
        //                 price: Number(price.toFixed()),
        //                 total: 0,
        //                 cut_partner: 0,
        //                 declared_value: declared_value,
        //                 insuranceFee: insuranceFee,
        //                 status: status,
        //                 profitAll: profit
        //             };

        //             if (cod !== undefined) {
        //                 let fee = (reqCod * percentCod)/100
        //                 let formattedFee = parseFloat(fee.toFixed(2));
        //                 let total = price + formattedFee + insuranceFee
        //                 let cut_partner = total - profit_partner
        //                     v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
        //                     v.fee_cod = formattedFee
        //                     v.profitPartner = profit_partner
        //                         if(obj[ob].hasOwnProperty("price_remote_area")){
        //                             let total1 = total + obj[ob].price_remote_area
        //                                 v.total = total1
        //                                 v.cut_partner = total1 - profit_partner
        //                                 v.price_remote_area = obj[ob].price_remote_area
        //                                     // if(reqCod > total1){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD + ราคาพื้นที่ห่างไกล) จึงเห็นและสั่ง order ได้
        //                                     //     new_data.push(v);
        //                                     // }
        //                         }else{
        //                             v.cut_partner = cut_partner
        //                             v.total = total
        //                                 // if(reqCod > total){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม(ค่าขนส่ง + ค่าธรรมเนียม COD) จึงเห็นและสั่ง order ได้
        //                                 //     new_data.push(v);
        //                                 // }
        //                         }
        //                     new_data.push(v);

        //             }else{
        //                 if(obj[ob].hasOwnProperty("price_remote_area")){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
        //                     let total = price + obj[ob].price_remote_area + insuranceFee
        //                         v.price_remote_area = obj[ob].price_remote_area
        //                         v.total = total 
        //                         v.cut_partner = total - profit_partner
        //                         v.profitPartner = profit_partner
        //                 }else{
        //                     let total = price + insuranceFee
        //                     v.profitPartner = profit_partner
        //                     v.total = total
        //                     v.cut_partner = total - profit_partner
        //                 }
        //                 new_data.push(v);
        //             }
        //             // console.log(new_data);
        //         } else {
        //             // ทำสิ่งที่คุณต้องการทำเมื่อ obj[ob].available เป็น false
        //             console.log(`Skipping ${obj[ob].courier_code} because available is false`);
        //         }
        //     }

        return res
                .status(200)
                .send({ 
                    status: true, 
                    // origin_data: req.body, 
                    // data: resp.data.data,
                    express_active: express_in,
                    result: result
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

async function codCalculate(){
    try{
        let cod_percent = []
        let fee_cod_total = 0
        let profitCOD = 0 //ห้ามลบ
        if(reqCod != 0){
            const findShopCod = await codPercent.findOne({shop_id:findForCost._id})
                if(findShopCod){
                    let fee_cod = 0
                    let percentCOD = req.body.percentCOD 
                    
                    // สร้าง regular expression เพื่อตรวจสอบทศนิยมไม่เกิน 2 ตำแหน่ง
                    const regex = /^\d+(\.\d{1,2})?$/;

                    let pFirst = findShopCod.express.find((item)=> item.express == `${express}`)

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
                                .send({
                                    status:false, 
                                    type:"sender",
                                    message:"กรุณาอย่าตั้ง %COD ต่ำกว่าพาร์ทเนอร์ที่แนะนำท่าน"})
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
                            fee_cod_total = fee_cod
                        }

                    // console.log(shop_line)
                    if(findShopCod.shop_line != 'ICE'){
                        let shop_line = findShopCod.shop_line
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
                    }else{
                        let v = {
                                id:'ICE',
                                cod_profit:fee_cod
                            }
                        cod_percent.push(v)
                    }
                    
                }
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
                , getPartnerBooking, getOrderDay, getOrderByTracking, priceListTest}