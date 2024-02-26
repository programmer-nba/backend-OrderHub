const { generateJT } = require("./generate.signJ&T")
const { jntOrder } = require("../../../Models/Delivery/J&T/orderJT");
const dayjs = require('dayjs')
const axios = require('axios');

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
apiUrl = process.env.JT_URL
ecom_id = process.env.ECOMPANY_ID
customer_id = process.env.CUSTOMER_ID

createOrder = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = req.body.shop_number
        const txlogisticid = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+txlogisticid);
        const fromData = {
            "logistics_interface" :{
                "actiontype": "add",
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "ordertype": "1",
                "servicetype": "6",
                "deliverytype": "1",
                "sender":{
                    ...req.body.sender
                },
                "receiver":{
                    ...req.body.receiver
                },
                "createordertime": dayTime,
                "sendstarttime": dayTime,
                "sendendtime": dayTime,
                "paytype": "1",
                "weight": req.body.weight,
                "length": req.body.length,
                "width": req.body.width,
                "height": req.body.height,
                "isinsured": "0",
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(fromData)
            console.log(newData)
        const response = await axios.post(`${apiUrl}/order/create`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถส่งคำร้องขอไปยัง J&T ได้"})
            }else if(response.data.responseitems[0].reason == "S10"){
                return res
                        .status(404)
                        .send({status:false, message:"หมายเลขรหัสการสั่งซื้อเกิดการซ้ำกัน กรุณากดสร้างสินค้าอีกครั้ง"})
            }
        const new_data = response.data.responseitems[0]
        const createOrder = await jntOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                ...new_data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        return res
                .status(200)
                .send({status:true, data: response.data, order: createOrder})
    }catch(err){
        // console.log(err)
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

trackingOrder = async (req, res)=>{
    try{
        const txlogisticid = req.body.txlogisticid
        const formData = {
            "logistics_interface":{
                "billcode": txlogisticid,
                "querytype":"2",
                "lang":"th",
                "customerid":customer_id
            },
            "msg_type": "TRACKQUERY",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(formData)
            console.log(newData)
        const response = await axios.post(`${apiUrl}/track/trackForJson`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถใช้ได้"})
            }
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

cancelOrder = async (req, res)=>{
    try{
        const txlogisticid = req.body.txlogisticid
        const formData = {
            "logistics_interface":{
                "actiontype":"cancel",
                "eccompanyid": ecom_id,
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "reason": "EZ"
            },
            "msg_type": "ORDERCANCEL",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(formData)
            console.log(newData)
        const response = await axios.post(`${apiUrl}/order/cancel`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถใช้ได้"})
            }
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

label = async (req, res)=>{
    try{
        const formData = {
            "logistics_interface":{
                "mailNo": req.body.mailNo,
                "type": req.body.type,
            },
            "msg_type": "GETREPORTURL",
            "eccompanyid": ecom_id,
        }
        const newData = await generateJT(formData)
            //console.log(newData)
        const response = await axios.post(`${apiUrl}/order/getReportUrl`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถใช้ได้"})
            }
        return res
                .status(200)
                .send({status:true, data: response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

priceList = async (req, res)=>{
    try{

    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

weightPrice = async (req, res)=>{
    try{

    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

async function invoiceNumber(date) {
    try{
        data = `${dayjs(date).format("YYYYMMDD")}`
        let random = Math.floor(Math.random() * 100000)
        const combinedData = `JNT` + data + random;
        const findInvoice = await jntOrder.find({txlogisticid:combinedData})

            while (findInvoice && findInvoice.length > 0) {
                // สุ่ม random ใหม่
                random = Math.floor(Math.random() * 100000);
                combinedData = `JNT`+ data + random;

                // เช็คใหม่
                findInvoice = await jntOrder.find({txlogisticid: combinedData});
            }

        console.log(combinedData);
        return combinedData;
    }catch(err){
        console.log(err)
    }
}

module.exports = {createOrder, trackingOrder, cancelOrder, label}