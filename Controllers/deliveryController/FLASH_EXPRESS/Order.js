const axios = require('axios')
const { generateSign } = require('./generate.sign')
const querystring = require('querystring');
const fs = require('fs');

createOrder = async (req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            sign: sign,
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            outTradeNo: `#${nonceStr}#`,
            ...req.body
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v3/orders`,querystring.stringify(formData),{
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

statusOrder = async (req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const pno = req.body.pno
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            sign: sign,
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/routes`,formData,{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
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
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

print100x180 = async(req, res)=>{ //ปริ้นใบปะหน้า(ขนาด 100*180 มม.)
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const pno = req.body.pno
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            sign: sign,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        try{
            const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/pre_print`,formData,{
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
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            sign: sign,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        try{
            const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/small/pre_print`,formData,{
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
        console.log("มีบางอย่างผิดพลาด")
    }
}

statusPOD = async (req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const mchId = req.body.mchId
        const pno = req.body.pno
        const {sign, nonceStr} = await generateSign(mchId)
        const formData = {
            sign: sign,
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            // เพิ่ม key-value pairs ตามต้องการ
          };
          const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/deliveredInfo`,querystring.stringify(formData),{
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Accept': 'application/json',
              }
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
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

module.exports = { createOrder, statusOrder, getWareHouse, print100x180, print100x75
                    ,statusPOD }