const { doSign } = require('./best.sign')
const axios = require('axios')
const dayjs = require('dayjs');
const { bestOrder } = require('../../../Models/Delivery/best_express/order');

const dayjsTimestamp = dayjs(Date.now());
const BEST_URL = process.env.BEST_URL
const keys = process.env.PARTNER_KEY
const PARTNER_ID = process.env.PARTNER_ID
const charset = 'utf-8'

createOrder = async(req, res)=>{
    try{
        const txLogistic = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('txLogisticId : '+txLogistic);
        const id = req.decoded.userid
        const role = req.decoded.role
        const shop = req.body.shop_number
        const data = req.body
        const weight = data.parcel.weight / 1000
        const formData = {
            serviceType:"KD_CREATE_WAYBILL_ORDER_NOTIFY",
            bizData:{
                txLogisticId:txLogistic,
                special:"1",
                sender:{
                    "name":data.from.name,
                    "postCode":data.from.postcode,
                    "mobile":data.from.tel,
                    "prov":data.from.province,
                    "city":data.from.state, //อำเภอ
                    "county":data.from.district, //ตำบล
                    "address":data.from.address,
                    "email":data.from.email,
                    "country":"06"
                },
                receiver:{
                    "name":data.to.name,
                    "postCode":data.to.postcode,
                    "mobile":data.to.tel,
                    "prov":data.to.province,
                    "city":data.to.state, //อำเภอ
                    "county":data.to.district, //ตำบล
                    "address":data.to.address,
                    "email":data.to.email,
                    "country":"06"
                },
                items:{
                    item:{
                            "itemWeight": weight,
                            "itemLength": data.parcel.width,
                            "itemWidth": data.parcel.length,
                            "itemHeight": data.parcel.height
                        }
                },
                piece: "1",
                itemsWeight: weight,
                length:data.parcel.width,
                width:data.parcel.length,
                height:data.parcel.height
            },
            partnerID: PARTNER_ID
        }
        const newData = await doSign(formData, charset, keys)
        // console.log(newData)
        const response = await axios.post(BEST_URL,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br'
            },
        })
            if(!response){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถเชื่อมต่อได้"})
            }
        const createOrder = await bestOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                ...response.data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }

        return res
                .status(200)
                .send({status:true, data:response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 100000)
    const combinedData = `BE`+data + random;
    const findInvoice = await bestOrder.find({txLogisticId:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 100000);
        combinedData = `BE`+data + random;

        // เช็คใหม่
        findInvoice = await bestOrder.find({txLogisticId: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}
module.exports = { createOrder }