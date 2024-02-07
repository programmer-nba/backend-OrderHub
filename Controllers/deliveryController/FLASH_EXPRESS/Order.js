const axios = require('axios')
const { generateSign } = require('./generate.sign')
const querystring = require('querystring');
const dayjs = require('dayjs')
const fs = require('fs');

 //เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 const dayjsTimestamp = dayjs(Date.now());
 const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

 const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
 const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
 const nonceStr = milliseconds

createOrder = async (req, res)=>{ //สร้าง Order ให้ Flash express
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            outTradeNo: `${nonceStr}`,
            ...req.body
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
            console.log(formDataOnly)
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
        }else{
            return res
                    .status(200)
                    .send({status:true, message:"เชื่อมต่อสำเร็จ", data:response.data})
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
        const mchId = req.body.mchId
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
        const mchId = req.body.mchId
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
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const pno = req.body.pno
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
        console.log(formDataOnly)  

        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/cancel`,querystring.stringify(formDataOnly),{
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

module.exports = { createOrder, statusOrder, getWareHouse, print100x180, print100x75
                    ,statusPOD, statusOrderPack, cancelOrder, notifyFlash, nontification }