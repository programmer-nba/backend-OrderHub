const axios = require('axios')
const { generateSign } = require('./generate.sign')
const querystring = require('querystring');
const dayjs = require('dayjs')
const fs = require('fs');
const { costPlus } = require('../../../Models/costPlus');
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

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 const dayjsTimestamp = dayjs(Date.now());
 const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

 const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
 const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
 const nonceStr = milliseconds

createOrder = async (req, res)=>{ //สร้าง Order ให้ Flash express
    try{
        const apiUrl = process.env.TRAINING_URL
        const id = req.decoded.userid
        const role = req.decoded.role
        const mchId = process.env.MCH_ID
        const cost = req.body.cost
        const weight = req.body.weight * 1000
        const cost_hub = req.body.cost_hub
        const fee_cod = req.body.fee_cod
        const total = req.body.total
        const cut_partner = req.body.cut_partner
        const price_remote_area = req.body.price_remote_area
        const priceOne = req.body.priceOne
        const declared_value = req.body.declared_value
        const insuranceFee = req.body.insuranceFee
        const codForPrice = req.body.codForPrice
        const price = req.body.price
        const shop = req.body.shop_number
        let cod_amount = Math.ceil(codForPrice)*100 //ทำ cod_amount เป็นหน่วย สตางค์ และปัดเศษขึ้น เพื่อให้ยิง flash ได้(flash ไม่รับ COD AMOUNT เป็น ทศนิยม)
        let cod_integer = cod_amount / 100 //ทำ cod_amount เป็นหน่วย บาท เพื่อบันทึกลง database(จะได้ดูง่าย)

        const invoice = await invoiceNumber()
        // console.log(cod_integer, codForPrice)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            outTradeNo: `${nonceStr}`,
            codEnabled: 0,
            weight: weight,
            ...req.body
            // เพิ่ม key-value pairs ตามต้องการ
          };
        if(codForPrice > 0){
            formData.codEnabled = 1
            formData.codAmount = cod_amount;
            // console.log(cod_amount)
        }
        // if(declared_value > 0){
        //     formData.insured = 1
        //     formData.insureDeclareValue = declared_value * 100
        // }

        //ผู้ส่ง
        const senderTel = req.body.srcPhone;
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        console.log(updatedDocument)
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v3/orders`,querystring.stringify(formDataOnly),{
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

        const new_data = {
            from: {
                name: req.body.srcName, 
                tel: req.body.srcPhone,
                province: req.body.srcProvinceName,
                state: req.body.srcCityName,
                district: req.body.srcDistrictName,
                postcode: req.body.srcPostalCode,
                address: req.body.srcDetailAddress
            },
            to: {
                name: req.body.dstName, 
                tel: req.body.dstPhone,
                province: req.body.dstProvinceName,
                state: req.body.dstCityName,
                district: req.body.dstDistrictName,
                postcode: req.body.dstPostalCode,
                address: req.body.dstDetailAddress
            },
            parcel: {
              weight: req.body.weight, 
              width: req.body.width,
              length: req.body.length,
              height: req.body.height,
              expressCategory: req.body.expressCategory,
              articleCategory: req.body.articleCategory,
            },
            return: {
              returnName: req.body.returnName, 
              returnPhone: req.body.returnPhone,
              returnProvinceName: req.body.returnProvinceName,
              returnCityName: req.body.returnCityName,
              returnPostalCode: req.body.returnPostalCode,
              returnDetailAddress: req.body.returnDetailAddress,
            },
            response: {
              ...response.data.data,
              invoice: invoice
            },
            invoice: invoice,
            tracking_code: response.data.data.pno,
            ID: id,
            shop_number: shop,
            role: role,
            cost_hub: cost_hub,
            cost: cost,
            priceOne: priceOne,
            price: price,
            codAmount: codForPrice,
            cod_amount: codForPrice,
            cut_partner: cut_partner,
            price_remote_area: price_remote_area,
            declared_value: declared_value,
            insuranceFee: insuranceFee,
            total: total,
            fee_cod: fee_cod,
            express:"FLASH"
          };
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
        profitsICE = parseFloat(profitsICE.toFixed(2)); //FLASH ราคาต้นทุน(cost_hub) ที่ FLASH ให้มามีทศนิยม ดังนั้นจึงจำเป็นต้อง ใส่ทศนิยม
        let profit_partnerOne
        let profit_partner
        let profit_ice
        let profit_iceCOD
        if(codForPrice == 0){
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
            const create = await flashOrder.create(new_data)
                if(!create){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                }
            const createOrderAll = await orderAll.create(new_data)
                if(!createOrderAll){
                    console.log("ไม่สามารถสร้างข้อมูล orderAll ได้")
                }
            const plus = findShop.credit + cut_partner
            const history = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    amount: cut_partner,
                    before: plus,
                    after: findShop.credit,
                    type: 'FLE(ICE)',
                    remark: "ขนส่งสินค้า(FLASH)"
                }
            const historyShop = await historyWalletShop.create(history)
                if(!historyShop){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsPartner,
                    express: 'FLE(ICE)',
                    type: 'โอนเงิน',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }
            const profitPlus = await Partner.findOneAndUpdate(
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
                    orderid: create.response.pno,
                    profit: profitsICE,
                    express: 'FLE(ICE)',
                    type: 'กำไรจากต้นทุน',
            }
            profit_ice = await profitIce.create(pfICE)
                if(!profit_ice){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                }

            let profitPlusOne
            if(priceOne != 0){
                const findUpline = await Partner.findOne({_id:findShop.partnerID})
                const headLine = findUpline.upline.head_line

                const pfPartnerOne = {
                                wallet_owner: headLine,
                                Orderer: id,
                                role: role,
                                shop_number: shop,
                                orderid: create.response.pno,
                                profit: profitsPartnerOne,
                                express: 'FLE(ICE)',
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
            return res
                    .status(200)
                    .send({
                        status:true, message:"เชื่อมต่อสำเร็จ", 
                        data: createOrderAll,
                        // shop: findShop,
                        history: historyShop,
                        profitP: profit_partner,
                        profitPartnerOne: profit_partnerOne,
                        profitIce: profit_ice,
                        profitPlus: profitPlus,
                        profitPlusOne: profitPlusOne
                    })

        }else if(codForPrice != 0){
            new_data.codAmount = cod_integer;
            console.log(cod_integer)

            const create = await flashOrder.create(new_data)
                if(!create){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                }
            const createOrderAll = await orderAll.create(new_data)
                if(!createOrderAll){
                    console.log("ไม่สามารถสร้างข้อมูล orderAll ได้")
                }
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
                    orderid: create.response.pno,
                    amount: cut_partner,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'FLE(ICE)',
                    remark: "ขนส่งสินค้าแบบ COD(FLASH)"
            }
            // console.log(history)
            const historyShop2 = await historyWalletShop.create(historytwo)
                if(!historyShop2){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShopTwo.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsPartner,
                    express: 'FLE(ICE)',
                    type: 'COD',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }

            const profitPlus = await Partner.findOneAndUpdate(
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
                    orderid: create.response.pno,
                    profit: profitsICE,
                    express: 'FLE(ICE)',
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
                    orderid: create.response.pno,
                    profit: fee_cod,
                    express: 'FLE(ICE)',
                    type: 'COD',
            }
            profit_iceCOD = await profitIce.create(pfIceCOD)
                if(!profit_iceCOD){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                }
            const pfSenderTemplate = {
                    orderid: create.response.pno,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    type: 'COD(SENDER)',
                    'template.partner_number': create.response.pno,
                    'template.account_name':updatedDocument.flash_pay.name,
                    'template.account_number':updatedDocument.flash_pay.card_number,
                    'template.bank':updatedDocument.flash_pay.aka,
                    'template.amount':codForPrice,
                    'template.phone_number': updatedDocument.tel,
                    'template.email':updatedDocument.email,
                    status:"กำลังขนส่งสินค้า"
            }
           
            const createTemplate = await profitTemplate.create(pfSenderTemplate)
                if(!createTemplate){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างรายการ COD ของผู้ส่งได้"})
                }
            let profitPlusOne
            if(priceOne != 0){
                    const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                    const headLine = findUpline.upline.head_line

                    const pfPartnerOne = {
                            wallet_owner: headLine,
                            Orderer: id,
                            role: role,
                            shop_number: shop,
                            orderid: create.response.pno,
                            profit: profitsPartnerOne,
                            express: 'FLE(ICE)',
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
           
            return res
                    .status(200)
                    .send({
                        status:true, message:"เชื่อมต่อสำเร็จ", 
                        data: createOrderAll,
                        history: historyShop2,
                        profitPartner: profit_partner,
                        profitPartnerOne: profit_partnerOne,
                        profitIce: profit_ice,
                        profitIceCOD: profit_iceCOD,
                        profitPlus: profitPlus,
                        profitPlusOne: profitPlusOne,
                        template: createTemplate
                    })
        }

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
        const formDataOnly = newData.formData
        console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/routes`,querystring.stringify(formDataOnly),{
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
          const formDataOnly = newData.formData
          console.log(formDataOnly)
        try{
            const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/pre_print`,formDataOnly,{
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
        console.log(formDataOnly)
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
        console.log(formDataOnly)  

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

cancelOrder = async (req, res)=>{ //cancel order
    try{
        const role = req.decoded.role
        const id = req.decoded.userid
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            // เพิ่ม key-value pairs ตามต้องการ
          };

        const findStatus = await flashOrder.findOne({'response.pno':pno});
          if (!findStatus) {
              return res
                      .status(400)
                      .send({ status: false, message: "ไม่มีหมายเลขที่ท่านกรอก" });
          }else if(findStatus.status == 'cancel'){
              return res
                      .status(404)
                      .send({status: false, message:"หมายเลขสินค้านี้ถูก cancel ไปแล้ว"})
          }

        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
        // console.log(formDataOnly)  
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/cancel`,querystring.stringify(formDataOnly),{
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
            const findPno = await flashOrder.findOneAndUpdate(
                {'response.pno':pno},
                {status:"cancel"},
                {new:true})
                if(!findPno){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาหมายเลข pno(FLASH) หรืออัพเดทข้อมูลได้"})
                }
            return res
                    .status(200)
                    .send({status:false, data:findPno})
        }
        //     if(findPno.codAmount == 0){
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
        //                 orderid: pno,
        //                 amount: findPno.price,
        //                 before: diff,
        //                 after: findShop.credit,
        //                 type: 'FLE(ICE)',
        //                 remark: "ยกเลิกขนส่งสินค้า(FLASH)"
        //         }
        //         const historyShop = await historyWalletShop.create(history)
        //             if(!historyShop){
        //                 console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //             }

        //         const delProfitPartner = await profitPartner.deleteMany({orderid:pno})
        //             if(!delProfitPartner){
        //                 return res
        //                         .status(404)
        //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ได้"})
        //             }

        //         const delProfitIce = await profitIce.findOneAndDelete({orderid:pno})
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
        //                     // shop: findShop,
        //                     history: historyShop,
        //                     delPartner: delProfitPartner,
        //                     delIce: delProfitIce
        //                 })
        //     }else{
        //         const findShopCOD = await historyWalletShop.findOne({orderid:pno})
        //             if(!findShopCOD){
        //                 return res
        //                         .status(404)
        //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข pno ได้"})
        //             }
        //         let history = {
        //                 ID: id,
        //                 role: role,
        //                 shop_number: findPno.shop_number,
        //                 orderid: pno,
        //                 amount: findPno.price,
        //                 before: findShopCOD.before,
        //                 after: 'COD',
        //                 type: 'FLE(ICE)',
        //                 remark: "ยกเลิกขนส่งสินค้าแบบ COD(FLASH)"
        //         }
        //         const historyShop = await historyWalletShop.create(history)
        //             if(!historyShop){
        //                 console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
        //             }
        //         const delProfitPartner = await profitPartner.deleteMany({orderid:pno})
        //             if(!delProfitPartner){
        //                 return res
        //                         .status(404)
        //                         .send({status:false, message:"ไม่สามารถค้นหาหมายเลข Tracking code ได้"})
        //             }
        //         const delProfitIce = await profitIce.deleteMany(
        //                 {
        //                     orderid:pno
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
        //                     flash: findPno, 
        //                     history: historyShop,
        //                     delPartner: delProfitPartner,
        //                     delIce: delProfitIce
        //                 })
        //     }
        // }    
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
        const mchId = req.body.mchId
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
        const formDataOnly = newData.formData
        console.log(formDataOnly)  

        const response = await axios.post(`${apiUrl}/open/v1/notify`,formDataOnly,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
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

estimateRate = async (req, res)=>{ //เช็คราคาขนส่ง
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const shop = req.body.shop_number
        const declared_value = req.body.declared_value * 100 //เปลี่ยนจากบาทเป็นสตางค์
        const weight = req.body.parcel.weight * 1000
        let reqCod = req.body.cod
        let percentCod
        if(reqCod > 0){
            const findCod = await codExpress.findOne({express:"FLASH"})
            percentCod = findCod.percent
        }else if(weight == 0){
            return res
                    .status(400)
                    .send({status:false, message:"กรุณาระบุน้ำหนัก"})
        }
        const cod = percentCod
        if(req.decoded.role === 'shop_member'){
            if(req.decoded.shop_number != shop){
                console.log(req.decoded.shop_number, shop)
                return res
                        .status(400)
                        .send({status:false, message:"กรุณาระบุรหัสร้านค้าที่ท่านอยู่"})
            }
        }
        const formData = {
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
                weight: weight,
                width: req.body.parcel.width,
                length: req.body.parcel.length,
                height: req.body.parcel.height,
                pricingTable: 1,
                insureDeclareValue: 0,
                insured: 0,
                // mchId: mchId,
                // nonceStr: nonceStr,
                // srcName: "Mahunnop",
                // srcAdress: "เลขที่ 12/1",
                // srcProvinceName: req.body.srcProvinceName,
                // srcCityName: req.body.srcCityName,
                // srcDistrictName: req.body.srcDistrictName,
                // srcPostalCode: req.body.srcPostalCode,
                // srcPhone: "054355132",
                // dstName: "Kapkhao",
                // dstAdress: "54กดก",
                // dstProvinceName: req.body.dstProvinceName,
                // dstCityName: req.body.dstCityName,
                // dstDistrictName: req.body.dstDistrictName,
                // dstPostalCode: req.body.dstPostalCode,
                // dstPhone: "054755232",
                // weight: req.body.weight,
                // width: req.body.width,
                // length: req.body.length,
                // height: req.body.height,
                // expressCategory: req.body.expressCategory,
                // opdInsureEnabled: req.body.opdInsureEnabled,
                // pricingTable: req.body.pricingTable
                //  เพิ่ม key-value pairs ตามต้องการ
          };
          if(declared_value > 0){
                formData.insured = 1
                formData.insureDeclareValue = declared_value
          }
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v1/orders/estimate_rate`,querystring.stringify(formDataOnly),{
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
                    .send({status:false, message:"กรุณากรอกข้อมูล ผู้รับ/ผู้ส่ง ให้ถูกต้อง"})
        }else if(response.data.code == 1000){ //Error เกี่ยวกับน้ำหนักที่มากเกินไป
            return res
                    .status(400)
                    .send({status:false, message:combinedString})
        }
        const estimatedPrice = parseFloat(response.data.data.estimatePrice)
        const estimatedPriceInBaht = estimatedPrice / 100; //เปลี่ยนจาก สตางค์เป็นบาท

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
        let new_data = []
            if(upline === 'ICE'){
                let v = null;
                        let p = findForCost.express.find(element => element.courier_code == 'FLE(ICE)');
                        // console.log(p.percent_orderHUB, p.percent_shop, p.on_off)
                            if(p.on_off == false){
                                console.log(`Skipping 'FLE(ICE)' because courier is off`)
                                return res
                                        .status(200)
                                        .send({status:false, data:response.data, result: new_data })
                            }else if (!p) {
                                console.log(`ยังไม่มี courier name: 'FLE(ICE)'`);
                            }else if(p.percent_orderHUB <= 0 || p.percent_shop <= 0){
                                return res
                                        .status(400)
                                        .send({status:false, message:`ระบบยังไม่ได้กำหนดราคาขนส่ง FLE(ICE) กรุณาติดต่อ Admin`})
                            }

                        // คำนวนต้นทุนของร้านค้า
                        let cost_hub = Number(estimatedPriceInBaht);
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
                            ...response.data.data,
                            price_remote_area: 0,
                            cost_hub: cost_hub,
                            cost: cost,
                            cod_amount: Number(cod_amount.toFixed()),
                            fee_cod: 0,
                            profitPartner: 0,
                            priceOne: 0,
                            price: Number(price.toFixed()),
                            total: 0,
                            cut_partner: 0,
                            declared_value: declared_value / 100, //แปลงจากสตางค์ เป็นบาท
                            status: status
                        };
                        let respData = response.data.data
                        if (cod !== undefined) {
                            let fee = (reqCod * percentCod)/100
                            let formattedFee = parseFloat(fee.toFixed(2));
                            let profitPartner = price - cost
                            let total = price + formattedFee
                            let cut_partner = total - profitPartner
                                v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                                v.fee_cod = formattedFee
                                v.profitPartner = profitPartner
                                    if(respData.upCountry == true){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                                        let total1 = total + (parseFloat(respData.upCountryAmount)/100) //เปลี่ยนจาก สตางค์เป็นบาท
                                            v.total = total1
                                            v.cut_partner = total1 - profitPartner
                                            v.price_remote_area = (parseFloat(respData.upCountryAmount)/100)
                                                // if(reqCod > total1){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD + ราคาพื้นที่ห่างไกล) จึงเห็นและสั่ง order ได้
                                                //     new_data.push(v);
                                                // }
                                    }else{
                                        v.cut_partner = cut_partner
                                        v.total = total
                                            // if(reqCod > total){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD) จึงเห็นและสั่ง order ได้
                                            //     new_data.push(v);
                                            // }
                                    }
                                new_data.push(v);  
                        }else{
                            let profitPartner = price - cost
                                if(respData.upCountry == true){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                                    let total = price + (parseFloat(respData.upCountryAmount)/100) //เปลี่ยนจาก สตางค์เป็นบาทฃ
                                        v.price_remote_area = (parseFloat(respData.upCountryAmount)/100)
                                        v.total = total
                                        v.cut_partner = total - profitPartner
                                        v.profitPartner = profitPartner
                                }else{
                                    v.profitPartner = profitPartner
                                    v.total = price
                                    v.cut_partner = price - profitPartner
                                }
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
                    let p = findForCost.express.find(element => element.courier_code == 'FLE(ICE)');
                        // console.log(p.percent_orderHUB, p.percent_shop, p.on_off)
                            if(p.on_off == false){
                                console.log(`Skipping 'FLE(ICE)' because courier is off`)
                                return res
                                        .status(200)
                                        .send({status:false, data:response.data, result: new_data })
                            }else if (!p) {
                                console.log(`ยังไม่มี courier name: 'FLE(ICE)'`);
                            }else if(p.percent_orderHUB <= 0 || p.percent_shop <= 0){
                                return res
                                        .status(400)
                                        .send({status:false, message:`ระบบยังไม่ได้กำหนดราคาขนส่ง FLE(ICE) กรุณาติดต่อ Admin`})
                            }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = Number(estimatedPriceInBaht);
                    let cost = Math.ceil(cost_hub + p.percent_orderHUB) // ต้นทุน hub + ((ต้นทุน hub * เปอร์เซ็น hub)/100)
                    let priceOne = Math.ceil(cost + p.percent_shop)
                    let price = priceOne + cost_plus

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
                            console.error(error);
                        }
                        v = {
                            ...response.data.data,
                            price_remote_area: 0,
                            cost_hub: cost_hub,
                            cost: cost,
                            cod_amount: Number(cod_amount.toFixed()),
                            fee_cod: 0,
                            profitPartner: 0,
                            priceOne: priceOne,
                            price: Number(price.toFixed()),
                            total: 0,
                            cut_partner: 0,
                            declared_value: declared_value / 100, //แปลงจากสตางค์ เป็นบาท
                            status: status
                        };
                        let respData = response.data.data
                        if (cod !== undefined) {
                            let fee = (reqCod * percentCod)/100
                            let formattedFee = parseFloat(fee.toFixed(2));
                            let profitPartner = price - priceOne
                            let total = price + formattedFee
                            let cut_partner = total - profitPartner
                                v.cod_amount = reqCod; // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                                v.fee_cod = formattedFee
                                v.profitPartner = profitPartner
                                    if(respData.upCountry == true){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                                        let total1 = total + (parseFloat(respData.upCountryAmount)/100) //เปลี่ยนจาก สตางค์เป็นบาท
                                            v.total = total1
                                            v.cut_partner = total1 - profitPartner
                                            v.price_remote_area = (parseFloat(respData.upCountryAmount)/100)
                                                // if(reqCod > total1){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD + ราคาพื้นที่ห่างไกล) จึงเห็นและสั่ง order ได้
                                                //     new_data.push(v);
                                                // }
                                    }else{
                                        v.cut_partner = cut_partner
                                        v.total = total
                                            // if(reqCod > total){ //ราคา COD ที่พาร์ทเนอร์กรอกเข้ามาต้องมากกว่าราคารวม (ค่าขนส่ง + ค่าธรรมเนียม COD) จึงเห็นและสั่ง order ได้
                                            //     new_data.push(v);
                                            // }
                                    }
                                new_data.push(v);
                        }else{
                            let profitPartner = price - priceOne
                                if(respData.upCountry == true){ //เช็คว่ามี ราคา พื้นที่ห่างไกลหรือเปล่า
                                    let total = price + (parseFloat(respData.upCountryAmount)/100) //เปลี่ยนจาก สตางค์เป็นบาท
                                        v.price_remote_area = (parseFloat(respData.upCountryAmount)/100)
                                        v.total = total
                                        v.cut_partner = total - profitPartner
                                        v.profitPartner = profitPartner
                                }else{
                                    v.profitPartner = profitPartner
                                    v.total = price
                                    v.cut_partner = price - profitPartner
                                }
                            new_data.push(v);
                        }
            }

        return  res
                 .status(200)
                 .send({status:true, data:response.data, result: new_data})
        
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

async function invoiceNumber() {
    data = `ODHFLE`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + random;
    const findInvoice = await flashOrder.find({'response.invoice':combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + random;

        // เช็คใหม่
        findInvoice = await flashOrder.find({'response.invoice': combinedData});
    }

    console.log(combinedData);
    return combinedData;
}

module.exports = { createOrder, statusOrder, getWareHouse, print100x180, print100x75
                    ,statusPOD, statusOrderPack, cancelOrder, notifyFlash, nontification,
                    estimateRate, getAll, getById, delend, getMeBooking, getPartnerBooking }