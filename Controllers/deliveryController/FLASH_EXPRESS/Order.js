const axios = require('axios')
const { generateSign } = require('./generate.sign')
const querystring = require('querystring');
const dayjs = require('dayjs')
const fs = require('fs');
const qs = require('qs');
const { Partner } = require('../../../Models/partner');
const { shopPartner } = require('../../../Models/shop/shop_partner');
const { PercentCourier } = require('../../../Models/Delivery/ship_pop/percent');
const { flashOrder } = require('../../../Models/Delivery/flash_express/create_order');
const { historyWalletShop } = require('../../../Models/shop/shop_history');
const { codExpress } = require('../../../Models/COD/cod.model');
const { profitIce } = require('../../../Models/profit/profit.ice');
const { profitPartner } = require('../../../Models/profit/profit.partner');
const { dropOffs } = require('../../../Models/Delivery/dropOff');
const { profitTemplate } = require('../../../Models/profit/profit.template');
const { orderAll } = require('../../../Models/Delivery/order_all');
const { postalThailand } = require('../../../Models/postal.thailand/postal.thai.model');
const { codPercent } = require('../../../Models/COD/cod.shop.model');
const { weightAll } = require('../../../Models/Delivery/weight/weight.all.express');
const { bangkokMetropolitan } = require('../../../Models/postcal_bangkok/postcal.bangkok');
const { priceBase } = require('../../../Models/Delivery/weight/priceBase.express');
const { Admin } = require('../../../Models/admin');
const { decrypt } = require('../../../functions/encodeCrypto');
const { logOrder } = require('../../../Models/logs_order');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { pickupOrder } = require('../../../Models/Delivery/pickup_sp');
const { set } = require('mongoose');
dayjs.extend(utc);
dayjs.extend(timezone);
//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 const dayjsTimestamp = dayjs(Date.now());
 const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

//  let dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
 let currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
 let dayjsObject  = dayjs(currentTime)
 let nonceStr = String(dayjsObject.valueOf()); // Initialize nonceStr with the current timestamp
function updateRealTime (){
    currentTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
    dayjsObject = dayjs(currentTime)
    nonceStr = String(dayjsObject.valueOf()); // Initialize nonceStr with the current timestamp
}
setInterval(updateRealTime, 60000);


createOrder = async (req, res)=>{ //สร้าง Order ให้ Flash express
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const dataForm = req.body
        const id = req.decoded.userid
        const role = req.decoded.role
        const packing_price = req.body.packing_price
        const weight = dataForm.parcel.weight * 1000
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const fee_cod_orderhub = req.body.fee_cod_orderhub
        const fee_cod_sp = req.body.fee_cod_sp
        const print_code = req.body.print_code
        const total = req.body.total
        const cost_base = req.body.cost_base
        const price_remote_area = req.body.price_remote_area
        const profitAll = req.body.profitAll
        const declared_value = req.body.declared_value
        const insuranceFee = req.body.insuranceFee
        const codForPrice = req.body.cod_amount
        const price = req.body.price
        const remark = req.body.remark
        const shop = req.body.shop_number
        let cut = req.body.cut_partner
        const cut_partner = parseFloat(cut.toFixed(2))
        let cod_amount = Math.ceil(codForPrice)*100 //ทำ cod_amount เป็นหน่วย สตางค์ และปัดเศษขึ้น เพื่อให้ยิง flash ได้(flash ไม่รับ COD AMOUNT เป็น ทศนิยม)
        let cod_integer = cod_amount / 100 //ทำ cod_amount เป็นหน่วย บาท เพื่อบันทึกลง database(จะได้ดูง่าย)
        let declared_valueStang = declared_value * 100//มูลค่าประกัน

        const invoice = await invoiceInvoice(currentTime)
        const numberTracking = await invoiceNumber(currentTime)
        // console.log(cod_integer, codForPrice)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            outTradeNo: `${numberTracking}`,
            expressCategory: 1,
            srcName: dataForm.from.name, //** src = ผู้ส่ง
            srcPhone: dataForm.from.tel ,//**
            srcProvinceName: dataForm.from.province,//** จังหวัด
            srcCityName: dataForm.from.state,//**อำเภอ
            srcDistrictName: dataForm.from.district,//**ตำบล
            srcPostalCode: dataForm.from.postcode,//**
            srcDetailAddress: dataForm.from.address,//** ที่อยู่โดยละเอียดของผู้ส่ง
            dstName: dataForm.to.name,//** dst = ผู้รับ
            dstPhone: dataForm.to.tel,//**
            dstProvinceName: dataForm.to.province,//** จังหวัด
            dstCityName: dataForm.to.state,//** อำเภอ
            dstDistrictName: dataForm.to.district,//** ตำบล
            dstPostalCode: dataForm.to.postcode,//**
            dstDetailAddress: dataForm.to.address,//**
            weight: weight,//** น้ำหนัก 
            width: dataForm.parcel.width,
            length: dataForm.parcel.length,
            height: dataForm.parcel.height,
            codEnabled:0,
            insured:0,
            articleCategory:2,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        if(codForPrice > 0){
            formData.codEnabled = 1
            formData.codAmount = cod_amount;
            formData.subItemTypes = [
                {
                    "itemName": dataForm.parcel.name,
                    "itemWeightSize": `${dataForm.parcel.width}x${dataForm.parcel.length}x${dataForm.parcel.height} ${dataForm.parcel.weight}kg`,
                    "itemColor": dataForm.parcel.itemColor,
                    "itemQuantity": dataForm.parcel.itemQuantity
                }
            ]
        }
        if(declared_value > 0){
            formData.insured = 1
            formData.insureDeclareValue = declared_valueStang
        }
        if(remark){
            formData.remark = remark
        }
        // console.log(formData)
        //ผู้ส่ง
        const senderTel = req.body.from.tel;
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        // console.log(updatedDocument)
        const newData = await generateSign(formData)
        // const formDataOnly = newData.formData
        const asciiSorted = newData.queryString
        // console.log(asciiSorted)
        const response = await axios.post(`${apiUrl}/open/v3/orders`,asciiSorted,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.data.code !== 1){
            return res
                    .status(400)
                    .send({status:false, data:response.data})
        }
        const new_data = response.data.data

        //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
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

            let credit = parseFloat(findShop.credit.toFixed(2))
            const plus = credit + cut_partner
            let plusFloat = parseFloat(plus.toFixed(2))
            const history = {
                        shop_id: findShop._id,
                        ID: id,
                        role: role,
                        shop_number: shop,
                        orderid: numberTracking,
                        mailno: new_data.pno,
                        amount: cut_partner,
                        before: plusFloat,
                        after: credit,
                        type: 'FLASH',
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
                    orderid: numberTracking,
                    mailno: new_data.pno,
                    cost_price: profitAll[0].cost_price,
                    cost: profitAll[0].cost,
                    profitCost: profitAll[0].profit,
                    profitCOD: profitAll[0].cod_profit,
                    packing_price: packing_price,
                    profit: profitAll[0].total + packing_price,
                    express: 'FLASH',
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
                                        orderid: numberTracking,
                                        mailno: new_data.pno,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'FLASH',
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
                                        orderid: numberTracking,
                                        mailno: new_data.pno,
                                        cost_price: profitAll[i].cost_price,
                                        cost: profitAll[i].cost,
                                        profitCost: profitAll[i].profit,
                                        profitCOD: profitAll[i].cod_profit,
                                        profit: profitAll[i].total,
                                        express: 'FLASH',
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
                tracking_code: numberTracking,
                mailno: new_data.pno,
                from:{
                    ...dataForm.from
                },
                to:{
                    ...dataForm.to
                },
                parcel:{
                    ...dataForm.parcel
                },
                invoice: invoice,
                status:'booking',
                cost_hub: cost_hub,
                cost_base: cost_base,
                cod_amount:cod_integer,
                fee_cod: fee_cod,
                fee_cod_sp: fee_cod_sp,
                fee_code_orderhub: fee_cod_orderhub,
                total: total,
                cut_partner: cut_partner,
                packing_price: packing_price,
                price_remote_area: price_remote_area,
                price: price,
                print_code: print_code,
                declared_value: declared_value,
                insuranceFee: insuranceFee,
                profitAll: profitAll,
                express: "FLASH",
                remark: remark,
            })
            if(!createOrderAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        if(cod_amount != 0){
            const pfSenderTemplate = {
                    orderid: numberTracking,
                    owner_id: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    type: 'COD(SENDER)',
                    'template.partner_number': new_data.pno,
                    'template.account_name':updatedDocument.flash_pay.name,
                    'template.account_number':updatedDocument.flash_pay.card_number,
                    'template.bank':updatedDocument.flash_pay.aka,
                    'template.amount':cod_integer,
                    'template.phone_number': updatedDocument.tel,
                    'template.email':updatedDocument.email,
                    status:"รอรถเข้ารับ",
                    express: "FLASH"
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
                    res: response.data,
                    order: createOrderAll,
                    // shop: findShop,
                    // profitAll: allProfit
                })

    }catch(err){
        console.log(err)
        return res
                .status(200)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

statusOrder = async (req, res)=>{ //เช็คสถานะพัสดุ
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            // เพิ่ม key-value pairs ตามต้องการ
          }
        const newData = await generateSign(formData)
        const formDataOnly = newData.queryString
        // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/routes`,formDataOnly,{
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
                }
        })
        if(!response){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
        }
            return res
                    .status(200)
                    .send({status:true, data: response.data})
        
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getWareHouse = async(req, res)=>{ //เรียกดูคลังสินค้า
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            sign: '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE',
            mchId: mchId,
            nonceStr: 'yyv6YJP436wCkdpNdghC',
            body: 'test',

            // sign: '7FE0E6EB255BE3277FC781E8E25F492549A1D4E65C2CE1C97B337E461A0830DE',
            // mchId: AA0051, ไอดีทดสอบดูคลังของ FLASH
            // nonceStr: 'yyv6YJP436wCkdpNdghC',
            // body: 'test',
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const response = await axios.post(`${apiUrl}/open/v1/warehouses`,querystring.stringify(formData),{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(!response){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, message:"เชื่อมต่อสำเร็จ", data:response.data})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

print100x180 = async(req, res)=>{ //ปริ้นใบปะหน้า(ขนาด 100*180 มม.)
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const newData = await generateSign(formData)
          const formDataOnly = newData.queryString
        //   console.log(formDataOnly)
        try{
            const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/pre_print`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // 'Accept': 'application/pdf,*/*',
                },
            responseType: 'arraybuffer', // ระบุให้ axios รับ binary data ในรูปแบบ array buffer
            })
            // แปลง array buffer เป็น base64
            // const base64String = Buffer.from(response.data, 'binary').toString('base64');

            // console.log(base64String);
            return res
                    .status(200)
                    .setHeader('Content-Type', 'application/pdf')
                    .send(response.data);
        }catch(error){
            console.error('Error fetching or processing PDF:', error)
            return res
                    .status(500)
                    .send({ status: false, message: 'เกิดข้อผิดพลาดในการดึงหรือประมวลผล PDF' });
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

print100x75 = async(req, res)=>{ //ปริ้นใบปะหน้า(ขนาด 100*75 มม.)
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
        // console.log(formDataOnly)
        try{
            const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/small/pre_print`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                },
            responseType: 'arraybuffer', // ระบุให้ axios รับ binary data ในรูปแบบ array buffer
            })
            return res
                    .status(200)
                    .setHeader('Content-Type', 'application/pdf')
                    .send(response.data);
        }catch(error){
            console.error('Error fetching or processing PDF:', error)
            return res
                    .status(500)
                    .send({ status: false, message: 'เกิดข้อผิดพลาดในการดึงหรือประมวลผล PDF' });
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด",err)
    }
}

statusPOD = async (req, res)=>{ //ตรวจสอบข้อมูล POD(การเซ็นรับ Order)
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const newData = await generateSign(formData)
          const formDataOnly = newData.formData
          console.log(formDataOnly)  
          const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/deliveredInfo`,querystring.stringify(formData),{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(!response){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, message:"เชื่อมต่อสำเร็จ", data:response.data})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

statusOrderPack = async (req, res)=>{ //ตรวจสอบข้อมูลพัสดุแบบชุด
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pnos = req.body.pnos
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            pnos: pnos
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
        // console.log(formDataOnly)  

        const response = await axios.post(`${apiUrl}/open/v1/orders/routesBatch`,querystring.stringify(formDataOnly),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(!response){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
        }
        // console.log(response.data.data)
        let detailBulk = []
        let codBulk = []
        const detail = response.data.data
        const detailMap = detail.map(item =>{
            let scantype
            console.log(item.state)
                if(item.state == 1 ){
                    scantype = 'รับพัสดุแล้ว'
                }else if(item.state == 2 || item.state == 3){
                    scantype = 'ระหว่างการจัดส่ง'
                }else if(item.state == 5){
                    scantype = 'เซ็นรับแล้ว'
                }else if(item.state == 7){
                    scantype = 'พัสดุตีกลับ'
                }else if(item.state == 6){
                    scantype = 'พัสดุมีปัญหา'
                }else{
                    return;
                }
            let changStatus = {
                updateOne: {
                    filter: { tracking_code: item.pno },
                    update: { 
                        $set: {
                            order_status:scantype
                        }
                    }
                }
            }
            let changStatusCod = {
                updateOne: {
                    filter: { 'template.partner_number': item.pno },
                    update: { 
                        $set: {
                            status:scantype
                        }
                    }
                }
            }
            detailBulk.push(changStatus)
            codBulk.push(changStatusCod)
        })
        const bulkDetail = await orderAll.bulkWrite(detailBulk)
        const bulkCod = await profitTemplate.bulkWrite(codBulk)
        return res
                .status(200)
                .send({status:true, 
                    data: response.data,
                    detailBulk: bulkDetail,
                    codBulk:bulkCod
                })
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

cancelOrder = async (req, res)=>{ //cancel order
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const firstname = req.decoded.firstname
        const lastname = req.decoded.lastname
        const ip_address = req.decoded.ip_address
        const latitude = req.decoded.latitude
        const longtitude = req.decoded.longtitude
        const IP = await decrypt(ip_address)
        const LT = await decrypt(latitude)
        const LG = await decrypt(longtitude)

        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            // เพิ่ม key-value pairs ตามต้องการ
          };

        const findCancel = await orderAll.findOne({mailno:pno});
          if (!findCancel) {
              return res
                      .status(400)
                      .send({ status: false, message: "ไม่สามารถค้นหาหมายเลข pno ได้" });
          }else if(findCancel.order_status == 'cancel'){
              return res
                      .status(404)
                      .send({status: false, message:"ออเดอร์นี้ถูก Cancel ไปแล้ว"})
          }
        
        // console.log(findStatus)
        const newData = await generateSign(formData)
        const formDataOnly = newData.queryString
        // console.log(formDataOnly)  
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/cancel`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.data.code != 1){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถทำการยกเลิกออเดอร์นี้ได้"})
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
                                orderid:findCancel.mailno,
                                express:"FLASH"
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
                    {mailno:pno},
                    {
                        order_status:"cancel",
                        day_cancel: createLog.day,
                        user_cancel:`${firstname} ${lastname}`
                    },
                    {new:true})
                if(!findPno){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาหมายเลข PNO หรืออัพเดทข้อมูลได้"})
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
                            type: 'FLASH',
                            remark: "ยกเลิกขนส่งสินค้า",
                            day_cancel: createLog.day,
                            user_cancel: `${firstname} ${lastname}`
                    }
            const historyShop = await historyWalletShop.findOneAndUpdate(
                    {
                        orderid:findPno.tracking_code,
                    },{
                        ...history
                    },{
                        new:true
                    })
                        if(!historyShop){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีหมายเลข PNO ที่ท่านต้องการยกเลิก"})
                        }

            //REFUND PARTNER//
            let profitRefundTotal = findPno.profitAll[0].total+ findPno.packing_price
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
                    orderid : findPno.tracking_code
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

                if(findPno.cod_amount != 0){
                    let findTemplate = await profitTemplate.findOneAndUpdate(
                        { orderid : findPno.tracking_code},
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
                            {orderid: findPno.tracking_code},
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
                                orderid : findPno.tracking_code
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
                    .send({status:false, data:refundAll})
        }   
        
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

notifyFlash = async (req, res)=>{ //เรียกคูเรียร์/พนักงานเข้ารับ 
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const id = req.decoded.userid
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            srcName: req.body.srcName, //src ชื่อผู้ส่ง
            srcPhone: req.body.srcPhone,
            srcProvinceName: req.body.srcProvinceName,
            srcCityName: req.body.srcCityName,
            srcDistrictName: req.body.srcDistrictName,
            srcPostalCode: req.body.srcPostalCode,
            srcDetailAddress: req.body.srcDetailAddress,
            estimateParcelNumber: req.body.estimateParcelNumber, //จำนวนพัสดุโดยประมาณ (เพื่อให้ทางสาขาจัดสรรจำนวนรถ)
            remark: req.body.remark
            //เพิ่ม key-value pairs ตามต้องการ
        };
        const newData = await generateSign(formData)
        const formDataOnly = newData.queryString
        // console.log(formDataOnly)  

        const response = await axios.post(`${apiUrl}/open/v1/notify`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.data.code != 1){
            let mes = response.data.message
            if(response.data.code == 1000){
                mes = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบ ตำบล/อำเภอ/จังหวัด และ รหัสไปรณีย์"
            }
            return res
                    .status(400)
                    .send({
                        status:false, 
                        code:response.data.code,
                        message:mes
                    })
        }else{
            let v = {
                        // tracking_code: tracking_code,
                        partner_id: id,
                        courier_ticket_id:response.data.data.staffInfoId,
                        courier_pickup_id:response.data.data.ticketPickupId,
                        num_of_parcel: req.body.estimateParcelNumber,
                        datetime_pickup: response.data.data.ticketMessage,
                        origin_name : req.body.srcName,
                        origin_phone : req.body.srcPhone,
                        origin_address : req.body.srcDetailAddress,
                        origin_district : req.body.srcDistrictName,
                        origin_city : req.body.srcCityName,
                        origin_province : req.body.srcProvinceName,
                        origin_postcode : req.body.srcPostalCode,
                        express: "FLASH",
                        status:"เรียกรถเข้ารับ"
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
                                message:"สร้างข้อมูลเรียกรถเข้ารับสําเร็จ", 
                                data:createPickup,
                                response: response.data
                        })

        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

nontification = async (req, res)=>{ //เรียกดูงานรับในวัน
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            date: req.body.date
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const newData = await generateSign(formData)
          const formDataOnly = newData.formData
          console.log(formDataOnly)  
          const response = await axios.post(`${apiUrl}/open/v1/notifications`,querystring.stringify(formData),{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(!response){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, message:"เชื่อมต่อสำเร็จ", data:response.data})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

cancelNontification = async (req, res)=>{ //ยกเลิกงานรับในวัน
    try{
        const id = req.body.id
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.queryString
        //   console.log(formDataOnly)  
        const response = await axios.post(`${apiUrl}/open/v1/notify/${id}/cancel`,formDataOnly,{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(response.data.code != 1){
            return res
                    .status(400)
                    .send({status:false,code:response.data.code, message:response.data.message})
        }else{
            const update = await pickupOrder.findOneAndUpdate(
                {courier_pickup_id:id},
                {status:"ยกเลิกเข้ารับ"},
                {new:true})
                if(!update){
                    return res  
                            .status(400)
                            .send({status:false, message:"ไม่สามารถยกเลิกงานรับได้"})
                }
            return res
                    .status(200)
                    .send({status:true, message:"ยกเลิกสำเร็จ", data:update})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

estimateRate = async (req, res)=>{ //เช็คราคาขนส่ง
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const id = req.decoded.userid
        const role = req.decoded.role
        const formData = req.body
        const shop = req.body.shop_number
        const declared_valueStang = req.body.declared_value * 100 //เปลี่ยนจากบาทเป็นสตางค์
        const declared_value = req.body.declared_value
        const weightGram = req.body.parcel.weight * 1000
        const weight = req.body.parcel.weight
        const remark = req.body.remark
        const send_behalf = formData.from.send_behalf
        const send_number = formData.from.send_number
        const send_type = formData.from.send_type
        const packing_price = req.body.packing_price
        const cod_amount = req.body.cod_amount * 100 //เปลี่ยนจากบาทเป็นสตางค์
        let reqCod = req.body.cod_amount 
        
        if(send_behalf != "บริษัท" && send_behalf != "บุคคล"){
            return res
                    .status(400)
                    .send({status:false, type:"sender", message:"ผู้ส่ง กรุณากรอก ส่งในนาม บริษัทหรือบุคคล"})
        }else if(send_number == undefined || send_number == ""){
            return res
                    .status(400)
                    .send({status:false, type:"sender", message:"ผู้ส่ง กรุณากรอกหมายเลขผู้เสียภาษี, บัตรประชาชน หรือ passport"})
        }
        if(send_behalf == "บริษัท"){
            if(send_type != "หมายเลขผู้เสียภาษี"){
                return res
                    .status(400)
                    .send({status:false, type:"sender", message:"กรุณากรอกประเภท หมายเลขผู้เสียภาษี เพราะท่านเลือกส่งในนามบริษัท"})
            }
        }else if(send_behalf == "บุคคล"){
            if(send_type != "บัตรประชาชน" && send_type != "passport"){
                return res
                    .status(400)
                    .send({status:false, type:"sender", message:"กรุณากรอกประเภท บัตรประชาชน หรือ passport เพราะท่านเลือกส่งในนามบุคคล"})
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
                    .send({status:false, type:"receive", message:`กรุณากรอกความยาว(cm)`})
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
        const checkSwitch = findForCost.express.find(item => item.express == 'FLASH')
            if(checkSwitch.on_off == false || checkSwitch.cancel_contract == true){
                return res
                        .status(400)
                        .send({status:false, message:"ท่านไม่สามารถใช้งานระบบขนส่งนี้ได้"})
            }
        
        const fromData = {
                mchId: mchId,
                nonceStr: nonceStr,
                srcName: req.body.from.name,
                srcAdress: req.body.from.address,
                srcProvinceName: req.body.from.province,
                srcCityName: req.body.from.state, //อำเภอ
                srcDistrictName: req.body.from.district, //ตำบล
                srcPostalCode: req.body.from.postcode,
                srcPhone: req.body.from.tel,
                dstName: req.body.to.name,
                dstAdress: req.body.to.address,
                dstProvinceName: req.body.to.province,
                dstCityName: req.body.to.state,
                dstDistrictName: req.body.to.district,
                dstPostalCode: req.body.to.postcode,
                dstPhone: req.body.to.tel,
                weight: weightGram,
                width: req.body.parcel.width,
                length: req.body.parcel.length,
                height: req.body.parcel.height,
                pricingTable: 1,
                insureDeclareValue: 0,
                insured: 0,
                codEnabled: 0
          }
          if(declared_value > 0){
            fromData.insured = 1
            fromData.insureDeclareValue = declared_valueStang
          }
          if(reqCod > 0){
            fromData.codEnabled = 1
            fromData.codAmount = cod_amount
            if(!formData.parcel.name || !formData.parcel.itemColor || !formData.parcel.itemQuantity){
                let errCod = 'กรณีสั่งแบบ COD กรุณากรอก '
                if(!formData.parcel.name){
                    errCod = errCod + '/ ชื่อสินค้า '
                }
                if(!formData.parcel.itemColor){
                    errCod = errCod + '/ สีพัสดุ '
                }
                if(!formData.parcel.itemQuantity){
                    errCod = errCod + '/ จำนวนพัสดุ '
                }
                return res
                        .status(400)
                        .send({status:false,type:"receive", message:errCod})
            }
          }
        // console.log(fromData)
        const newData = await generateSign(fromData)
        const formDataOnly = newData.queryString
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v1/orders/estimate_rate`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        let eFlash = []
        for (const key in response.data.data) { //ดึงข้อมูลเกี่ยวกับ Error เกี่ยวกับน้ำหนักที่ Response มาเก็บไว้ใน Array eFlash
            if (response.data.data.hasOwnProperty(key)) {
                // นำค่าข้างใน Array มาแสดง
                const values = response.data.data[key];
                eFlash = eFlash.concat(values)
                // console.log(`Key: ${key}, Values: ${values.join(', ')}`);
            }
        }
        const combinedString = eFlash.join(', ');
        // console.log(combinedString);
        if(response.data.code == 1002){ //Error เกี่ยวกับการใส่ข้อมูล ผู้รับ ผู้ส่ง ไม่ครบจึงเกิด "การเซ็นลายมือล้มเหลว"
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:"กรุณากรอกข้อมูล ผู้รับ/ผู้ส่ง ให้ครบถ้วน"})
        }else if(response.data.code != 1){ //Error
            return res
                    .status(400)
                    .send({status:false, type:"receive", message:combinedString})
        }
        const estimatedPrice = parseFloat(response.data.data.estimatePrice)
        const estimatedPriceInBaht = estimatedPrice / 100; //เปลี่ยนจาก สตางค์เป็นบาท
        let insuranceFee = (parseFloat(response.data.data.valueInsuranceFee)/100) //เปลี่ยนจาก สตางค์เป็นบาท
        // console.log((parseFloat(response.data.data.upCountryAmount)/100))
        let cod_percent = []
        let fee_cod_total = 0
        let profitCOD = 0
        if(reqCod != 0){
            const findShopCod = await codPercent.findOne({shop_id:findForCost._id})
                if(findShopCod){
                    let fee_cod = 0
                    let percentCOD = req.body.percentCOD 
                    
                    // สร้าง regular expression เพื่อตรวจสอบทศนิยมไม่เกิน 2 ตำแหน่ง
                    const regex = /^\d+(\.\d{1,2})?$/;

                    let pFirst = findShopCod.express.find((item)=> item.express == "FLASH")

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
                            const p = findShopLine.express.find((item)=> item.express == "FLASH")
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
        // console.log(cod_percent)

        const result  = await weightAll.findOne(
            {
                shop_id: findForCost._id,
                express:"FLASH"
            })
            if(!result){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีร้านค้านี้ในระบบ"})
            }
        // console.log(result.weight)
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

        let priceBangkok = false;
        const findPostcal = await bangkokMetropolitan.findOne({ Postcode: req.body.to.postcode });
            if (findPostcal) {
                priceBangkok = true;
            }

        const findPriceBase = await priceBase.findOne({express:"FLASH"})
            if(!findPriceBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }
        let new_data = []
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
                    if(!resultP || resultP.costUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคา(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณากรอกราคาขายหน้าร้าน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
                    }else if(resultP.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณากรอกราคาขายหน้าร้าน(ต่างจังหวัด) น้ำหนัก ${resultP.weightStart} ถึง ${resultP.weightEnd} กิโลกรัม`})
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
                                .send({status:false, message:`กรุณารอการตั้งราคาแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.costBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesBangkok_metropolitan == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }else if(resultBase.salesUpcountry == 0){
                        return res
                                .status(400)
                                .send({status:false, message:`กรุณารอการตั้งราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม`})
                    }
                let idReal
                    if(role == 'partner'){
                        idReal = id
                    }else if(role == 'shop_member'){
                        idReal = req.decoded.id_ownerShop
                        // console.log(idReal)
                    }
                const findPartner = await Partner.findById(idReal)
                    if(!findPartner){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลการเป็น Partner ของท่านในระบบ"})
                    }
                    // if(resultP.costBangkok_metropolitan > resultBase.salesBangkok_metropolitan){ //ใช้เช็คกรณีที่คุณไอซ์แก้ราคา มาตรฐาน แล้วราคาต้นทุนที่ partner คนก่อนตั้งไว้มากกว่าราคามาตรฐาน จึงต้องเช็ค
                    //     return res
                    //             .status(400)
                    //             .send({status:false, message:`ราคาขาย(กรุงเทพ/ปริมณฑล) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(กรุงเทพ/ปริมณฑล) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                    // }else if(resultP.costUpcountry > resultBase.salesUpcountry){
                    //     return res
                    //             .status(400)
                    //             .send({status:false, message:`ราคาขาย(ต่างจังหวัด) น้ำหนัก ${resultBase.weightStart} ถึง ${resultBase.weightEnd} กิโลกรัม ของท่าน มากกว่า ราคาขายหน้าร้านแบบมาตรฐาน(ต่างจังหวัด) กรุณาให้พาร์ทเนอร์ที่แนะนำท่านแก้ไข`})
                    // }
                // คำนวนต้นทุนของร้านค้า
                let cost_hub
                let price
                let profit_partner
                let profit = []
                let status = null;
                let cut_partner
                let cod_profit
                let cost_base
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
                    // profitSaleMartket = price - resultBase.salesBangkok_metropolitan
                    cut_partner = resultP.costBangkok_metropolitan
                    cost_base = resultBase.salesBangkok_metropolitan
                    profit_partner = price - cost_hub

                    let cost = resultP.costBangkok_metropolitan
                    let total = profit_partner + cod_profit
                        let dataOne = {
                            id: result.owner_id,
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
                    cut_partner = resultP.costUpcountry
                    cost_base = resultBase.salesUpcountry

                    let cost = resultP.costUpcountry
                    let total = profit_partner + cod_profit
                        let dataOne = {
                            id: result.owner_id,
                            cost_price: parseFloat(price.toFixed(2)),
                            cost: parseFloat(cost.toFixed(2)),
                            profit: parseFloat(profit_partner.toFixed(2)),
                            cod_profit: parseFloat(cod_profit.toFixed(2)),
                            total: parseFloat(total.toFixed(2))
                        }
                    profit.push(dataOne)
                }
                // console.log(profit)
                let shop_line = result.shop_line
                if(shop_line != 'ICE'){
                    do{
                        const findHead = await weightAll.findOne(
                                {
                                    shop_id: shop_line,
                                    express:"FLASH"
                                })
                        let profitOne 
                        let cod_profit
                        let findWeight = findHead.weight.find((item)=> item.weightEnd == resultP.weightEnd )
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
                let findIce = cod_percent.find((item)=> item.id == "ICE")
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
                const resultRes = response.data.data
                const upCountry = (parseFloat(resultRes.upCountryAmount)/100)
                const codPoundageAmount = (resultRes.codPoundageAmount)/100

                // console.log(profit)
                    v = {
                        ...req.body,
                        express: "FLASH",
                        price_remote_area: upCountry,
                        cost_hub: cost_hub,
                        cost_base: cost_base,
                        fee_cod: 0,
                        fee_cod_orderhub: 0,
                        fee_cod_sp: codPoundageAmount,
                        price: Number(price.toFixed()),
                        declared_value: declared_value,
                        insuranceFee: insuranceFee,
                        packing_price: packing_price,
                        total: 0,
                        cut_partner: 0,
                        status: status,
                        remark: remark,
                        profitAll: profit
                    };
                    // console.log(v)

                        let formattedFee = parseFloat(fee_cod_total.toFixed(2));
                        let total = price + formattedFee + packing_price + insuranceFee + upCountry + codPoundageAmount
                            v.fee_cod = formattedFee + codPoundageAmount
                            v.fee_cod_orderhub = formattedFee
        
                        let cut = cut_partner + insuranceFee + formattedFee + upCountry + codPoundageAmount
                            v.cut_partner = parseFloat(cut.toFixed(2))
                            v.total = parseFloat(total.toFixed(2))
                            // v.fee_cod = formattedFee
                            // // v.profitPartner = profitPartner
                            //     if(response.data.data.upCountry == true){
                            //         let upCountry = (parseFloat(response.data.data.upCountryAmount)/100) //เปลี่ยนจาก สตางค์เป็นบาท 
                            //         // console.log(upCountry)
                            //         let total1 = total + upCountry
                            //             v.total = total1
                            //             v.cut_partner = cut_partner + upCountry + insuranceFee + formattedFee
                            //             v.price_remote_area = upCountry
                            //     }else{
                            //         v.cut_partner = cut_partner + formattedFee + insuranceFee
                            //         v.total = total 
                            //     }
                        new_data.push(v);
                    
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

        return  res
                 .status(200)
                 .send({
                    status:true, 
                    data:response.data,
                    new:new_data[0],
                    sender:infoSender
                })
        
    }catch(err){
        console.log(err)
        return res
                .status(200)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getAll = async (req, res)=>{
    try{
        const findAll = await flashOrder.find()
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
        const pno = req.params.pno
        const findTC = await flashOrder.findOne({'response.pno':pno})
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
        const pno = req.params.pno
        const delTC = await flashOrder.findOneAndDelete({'response.pno':pno})
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
        const findMe = await flashOrder.find({
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
        const findMe = await flashOrder.find({ID:id})
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

updateStatusWebhookFlash = async(req, res)=>{
    try{
        // ข้อมูลจาก form-data จะอยู่ใน req.body
        const outTradeNo = req.body.data.outTradeNo;
        const state = req.body.data.state;
        const returned = req.body.data.returned
        const stateDate = req.body.data.stateDate

        // แปลง timestamp เป็นรูปแบบ YYYY-MM-DD HH:mm:ss
        const formatDateTime = dayjs.unix(stateDate).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
        // console.log(formattedDateTime); // Output: 2021-02-08 18:15:53
 
        let detailBulk = []
        let codBulk = []
        let scanUpdate = {
            order_status:"",
            day_sign:"",
            day_pay:"",
        }
        if(returned == 1){
            if(state == 5){

                scanUpdate.order_status = 'เซ็นรับแล้ว'
    
                let datePart = dayjs(formatDateTime).format('YYYY-MM-DD');
                let newDate = dayjs(formatDateTime).add(1, 'day').format('YYYY-MM-DD');
                scanUpdate.day_sign = datePart
                scanUpdate.day_pay = newDate
    
            }else if(state == 7){
    
                scanUpdate.order_status = 'เซ็นรับพัสดุตีกลับ'
    
                let datePart = dayjs(formatDateTime).format('YYYY-MM-DD');
                scanUpdate.day_sign = datePart
    
            }else{
                scanUpdate.order_status = 'พัสดุตีกลับ'
            }
        }else{
            if(state == 1){
                scanUpdate.order_status = 'รับพัสดุแล้ว'
                scanUpdate.day_pick = formatDateTime
            }else if(state == 2 || state == 3){
                scanUpdate.order_status = 'ระหว่างการจัดส่ง'
            }else if(state == 5){
    
                scanUpdate.order_status = 'เซ็นรับแล้ว'
    
                let datePart = dayjs(formatDateTime).format('YYYY-MM-DD');
                let newDate = dayjs(formatDateTime).add(1, 'day').format('YYYY-MM-DD');
                scanUpdate.day_sign = datePart
                scanUpdate.day_pay = newDate
    
            }else if(state == 7){
    
                scanUpdate.order_status = 'เซ็นรับพัสดุตีกลับ'
    
                let datePart = dayjs(formatDateTime).format('YYYY-MM-DD');
                scanUpdate.day_sign = datePart
    
            }else if(state == 4 || state == 6 || state == 8){
                scanUpdate.order_status = 'พัสดุมีปัญหา'
            }else{
                return res
                        .status(200)
                        .send({
                            status:true,
                            message:"ไม่มีสถานะที่ต้องการ",
                            errorCode:1,
                            state:"success"
                        })
            }
        }
        
        // console.log("scanUpdate:",scanUpdate)
        let changStatus = {
            updateOne: {
                filter: { tracking_code: outTradeNo },
                update: {
                    $set: scanUpdate
                }
            }
        }
        
        scanUpdate.status = scanUpdate.order_status
        // console.log("scanUpdate:",scanUpdate)
        let changStatusCod 
            if(scanUpdate.order_status == 'เซ็นรับพัสดุตีกลับ'){
                changStatusCod = {
                    updateOne: {
                        filter: { orderid: outTradeNo },
                        update: {
                            $set: {//ที่ไม่ใส่ day_sign ของพัสดุตีกลับใน profit_template เพราะเดี๋ยวมันจะไปทับกับ day_sign ของสถานะเซ็นรับแล้ว
                                status:scanUpdate.order_status,
                                // day_pick:findStatus.day_pick
                            }
                        }
                    }
                }
            }else{
                changStatusCod = {
                    updateOne: {
                        filter: { orderid: outTradeNo },
                        update: {
                            $set: scanUpdate
                        }
                    }
                }
            }
        detailBulk.push(changStatus)
        codBulk.push(changStatusCod)

        const [bulkDetail, bulkCod] = await Promise.all([
            orderAll.bulkWrite(detailBulk),
            profitTemplate.bulkWrite(codBulk)
        ]);
        return res
                .status(200)
                .send({
                    status:true, 
                    // data: response.data,
                    errorCode:1,
                    state:"success",
                    detailBulk: bulkDetail,
                    codBulk:bulkCod
                })
    }catch(err){
        return res
                .status(500)
                .send({
                    status:false, 
                    errorCode: 0,
                    state:"fail",
                    message:err.message
                })
    }
}

updateRouteWebhookFlash = async(req, res)=>{
    try{
        // ข้อมูลจาก form-data จะอยู่ใน req.body
        const outTradeNo = req.body.data.outTradeNo;
        const message = req.body.data.message
        let detailBulk = []

        let scanUpdate = {
            status_lastet:message,
        }

        // console.log("scanUpdate:",scanUpdate)
        let changStatus = {
            updateOne: {
                filter: { tracking_code: outTradeNo },
                update: {
                    $set: scanUpdate
                }
            }
        }

        detailBulk.push(changStatus)

        const [bulkDetail] = await Promise.all([
            orderAll.bulkWrite(detailBulk),
        ]);
        return res
                .status(200)
                .send({
                    status:true, 
                    // data: response.data,
                    errorCode:1,
                    state:"success",
                    detailBulk: bulkDetail,
                })
    }catch(err){
        return res
                .status(500)
                .send({
                    status:false, 
                    errorCode: 0,
                    state:"fail",
                    message:err.message
                })
    }
}

updateStatusCourier = async(req, res)=>{
    try{
        const state = req.body.data.state
        const ticketPickupId = req.body.data.ticketPickupId
        const updateAt = req.body.data.updateAt
        const updateAtInThai = dayjs.utc(updateAt).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
        let status
        let complete = ''
        if(state == 0){
            status = 'รอจัดสรร'
        }else if(state == 1){
            status = 'รอรับพัสดุ'
        }else if(state == 2){
            status = 'รับพัสดุแล้ว'
            complete = updateAtInThai
        }else if(state == 3){
            status = 'โอนงานรับ'
        }else if(state == 4){
            status = 'ยกเลิกแล้ว'
        }
        console.log(updateAt)
        const findStatus = await pickupOrder.findOneAndUpdate(
            {
                courier_pickup_id:ticketPickupId
            },{
                status:status,
                completed_at:complete
            },{new:true})
            if(!findStatus){
                return res
                        .status(200)
                        .send({
                            status:true,
                            message:"ไม่มีหมายเลข Pickup ID นี้",
                            errorCode:0,
                            state:"fail"
                        })
            }
        return res
                .status(200)
                .send({
                    status:true, 
                    data: findStatus,
                    errorCode:1,
                    state:"success"
                })
    }catch(err){
        return res
                .status(500)
                .send({
                    status:false, 
                    errorCode: 0,
                    state:"fail",
                    message:err.message
                })
    }
}

setWebHook = async(req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            serviceCategory: 1,
            url: req.body.url,
            webhookApiCode : req.body.webhookApiCode
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const newData = await generateSign(formData)
          const formDataOnly = newData.queryString

          const response = await axios.post(`${apiUrl}/open/v1/setting/web_hook_service`,formDataOnly,{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(response.data.code != 1){
            return res
                    .status(400)
                    .send({status:false, message:response.data.message})
        }
        return res
                .status(200)
                .send({
                    status:true, 
                    data: response.data,
                    errorCode:1,
                    state:"success"
                })
    }catch(err){
        return res
                .status(500)
                .send({
                    status:false, 
                    errorCode: 0,
                    state:"fail",
                    message:err.message
                })
    }
}

checkWebhook = async(req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.queryString
        //   console.log(formDataOnly)  
        const response = await axios.post(`${apiUrl}/gw/fda/open/standard/webhook/setting/infos`,formDataOnly,{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
          })
        if(response.data.code != 1){
            return res
                    .status(400)
                    .send({status:false, message:response.data})
        }
        return res
                .status(200)
                .send({
                    status:true, 
                    data: response.data,
                    errorCode:1,
                    state:"success"
                })
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

async function invoiceNumber(date) {
    try{
        data = `${dayjs(date).format("YYYYMMDD")}`
        let random = Math.floor(Math.random() * 10000000)
        const combinedData = `FLE` + data + random;
        const findInvoice = await orderAll.find({tracking_code:combinedData})

            while (findInvoice && findInvoice.length > 0) {
                // สุ่ม random ใหม่
                random = Math.floor(Math.random() * 10000000);
                combinedData = `FLE`+ data + random;

                // เช็คใหม่
                findInvoice = await orderAll.find({tracking_code: combinedData});
            }

        // console.log(combinedData);
        return combinedData;
    }catch(err){
        console.log(err)
    }
}

async function invoiceInvoice(day) {
    day = `${dayjs(day).format("YYYYMMDD")}`
    let data = `ODHFLE`
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

module.exports = { createOrder, statusOrder, getWareHouse, print100x180, print100x75
                    ,statusPOD, statusOrderPack, cancelOrder, notifyFlash, nontification,
                    estimateRate, getAll, getById, delend, getMeBooking, getPartnerBooking, 
                    cancelNontification, updateStatusWebhookFlash, updateStatusCourier, setWebHook, checkWebhook, updateRouteWebhookFlash }