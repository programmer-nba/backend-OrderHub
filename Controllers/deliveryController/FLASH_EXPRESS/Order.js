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
        const codForPrice = req.body.codForPrice
        const priceOrder = req.body.price
        const shop = req.body.shop_number
        let cod_amount = Math.ceil(codForPrice)*100 //ทำ cod_amount เป็นหน่วย สตางค์ และปัดเศษขึ้น เพื่อให้ยิง flash ได้(flash ไม่รับ COD AMOUNT เป็น ทศนิยม)
        let cod_integer = cod_amount / 100 //ทำ cod_amount เป็นหน่วย บาท เพื่อบันทึกลง database(จะได้ดูง่าย)

        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            outTradeNo: `${nonceStr}`,
            codEnabled: 0,
            ...req.body
            // เพิ่ม key-value pairs ตามต้องการ
          };
        if(codForPrice !== undefined){
            formData.codEnabled = 1
            formData.codAmount = cod_amount;
            console.log(cod_amount)
        }
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
              srcName: req.body.srcName, 
              srcPhone: req.body.srcPhone,
              srcProvinceName: req.body.srcProvinceName,
              srcCityName: req.body.srcCityName,
              srcDistrictName: req.body.srcDistrictName,
              srcPostalCode: req.body.srcPostalCode,
              srcDetailAddress: req.body.srcDetailAddress
            },
            to: {
              dstName: req.body.dstName, 
              dstPhone: req.body.dstPhone,
              dstHomePhone: req.body.dstHomePhone,
              dstProvinceName: req.body.dstProvinceName,
              dstCityName: req.body.dstCityName,
              dstDistrictName: req.body.dstDistrictName,
              dstPostalCode: req.body.dstPostalCode,
              dstDetailAddress: req.body.dstDetailAddress
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
              ...response.data.data
            },
            ID: id,
            shop_number: req.body.shop_number,
            role: req.decoded.role,
            cost_hub: req.body.cost_hub,
            cost: req.body.cost,
            priceOne: req.body.priceOne,
            price: req.body.price,
            codAmount: codForPrice
          };

        if(codForPrice !== undefined){
            new_data.codAmount = cod_integer;
            console.log(cod_integer)
        }

        const findShop = await shopPartner.findOneAndUpdate(
            {shop_number:shop},
            { $inc: { credit: -priceOrder } },
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
        const plus = findShop.credit + priceOrder
        const history = {
                ID: id,
                role: role,
                shop_number: shop,
                orderid: create.response.pno,
                amount: create.price,
                before: plus,
                after: findShop.credit,
                type: 'FLE(ICE)',
                remark: "ขนส่งสินค้า(FLASHตรง)"
            }
        const historyShop = await historyWalletShop.create(history)
            if(!historyShop){
                console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
            }
        
        return res
                .status(200)
                .send({
                    status:true, message:"เชื่อมต่อสำเร็จ", 
                    data: create,
                    shop: findShop,
                    history: historyShop
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

cancelOrder = async (req, res)=>{ //ตรวจสอบข้อมูลพัสดุแบบชุด
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
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
        // console.log(formDataOnly)  
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/cancel`,querystring.stringify(formDataOnly),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.data.code !== 1){
            return res
                    .status(400)
                    .send({status:false, message:response.data.message})
        }else{
            const findPno = await flashOrder.findOneAndUpdate(
                {'response.pno':pno},
                {status:"cancel"},
                {new:true})
                if(!findPno){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาหมายเลข pno หรืออัพเดทข้อมูลได้"})
                }
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
                    orderid: pno,
                    amount: findPno.price,
                    before: diff,
                    after: findShop.credit,
                    type: 'FLE(ICE)',
                    remark: "ยกเลิกขนส่งสินค้า(FLASHตรง)"
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
                        shop: findShop,
                        history: historyShop
                    })
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
        const percent = await PercentCourier.find();
        const apiUrl = process.env.TRAINING_URL
        const mchId = process.env.MCH_ID
        const shop = req.body.shop_number
        let codReq = req.body.cod
        let percentCod
        if(codReq == true){
            const findCod = await codExpress.findOne({express:"FLASH"})
            percentCod = findCod.percent
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
            weight: req.body.parcel.weight,
            width: req.body.parcel.width,
            length: req.body.parcel.length,
            height: req.body.parcel.height,
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
                pricingTable: 1
                // expressCategory: req.body.expressCategory,
                // insureDeclareValue: req.body.insureDeclareValue,
                // insured: req.body.insured,
                // opdInsureEnabled: req.body.opdInsureEnabled,
                // pricingTable: req.body.pricingTable
                //  เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
            //console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v1/orders/estimate_rate`,querystring.stringify(formDataOnly),{
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
                        let p = percent.find((c) => c.courier_code === 'FLE(ICE)');
                        if (!p) {
                            console.log(`ยังไม่มี courier name: FLE(ICE)`);
                        }
                        // คำนวนต้นทุนของร้านค้า
                        let cost_hub = Number(estimatedPriceInBaht);
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
                            console.error(error);
                        }
                        v = {
                            ...response.data.data,
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
                    let p = percent.find((c) => c.courier_code === 'FLE(ICE)');
                    if (!p) {
                        console.log(`ยังไม่มี courier name: FLE(ICE)`);
                    }
                    // คำนวนต้นทุนของร้านค้า
                    let cost_hub = Number(estimatedPriceInBaht);
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
                            console.error(error);
                        }
                        v = {
                            ...response.data.data,
                            cost_hub: cost_hub, //ต้นทุนที่ทาง flash ให้คุณไอซ์
                            cost: cost, //คุณไอซ์เก็บ 5%
                            cod_amount: Number(cod_amount.toFixed()),
                            priceOne: Number(priceOne.toFixed()),
                            price: Number(price.toFixed()), //พาร์ทเนอร์โดนเก็บเพิ่ม 10%
                            status: status,
                        };
                        if (cod !== undefined) {
                            let cod_price = Math.ceil(priceInteger + (priceInteger * cod) / 100)
                            v.cod_amount = Number(cod_price.toFixed()); // ถ้ามี req.body.cod ก็นำไปใช้แทนที่
                        }
                        new_data.push(v);
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

module.exports = { createOrder, statusOrder, getWareHouse, print100x180, print100x75
                    ,statusPOD, statusOrderPack, cancelOrder, notifyFlash, nontification,
                    estimateRate }