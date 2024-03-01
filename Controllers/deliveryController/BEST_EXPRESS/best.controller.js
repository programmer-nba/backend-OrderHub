const { doSign } = require('./best.sign')
const querystring = require('querystring');
const axios = require('axios')
const dayjs = require('dayjs')

const dayjsTimestamp = dayjs(Date.now());
const BEST_URL = process.env.BEST_URL
const keys = process.env.PARTNER_KEY
const PARTNER_ID = process.env.PARTNER_ID
const charset = 'utf-8'

createOrder = async(req, res)=>{
    try{
        // const txLogistic = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
        //     console.log('txLogisticId : '+txLogistic);
        const formData = {
            serviceType:"KD_CREATE_WAYBILL_ORDER_NOTIFY",
            bizData:{
                txLogisticId:"425725",
                special:"1",
                sender:{
                    "name":"sender",
                    "postCode":"10254",
                    "mobile":"13668122696",
                    "prov":"Kampong Thom",
                    "city":"Stoung",
                    "county":"Chamna Leu",
                    "address":"123",
                    "email":"kkk@email.com",
                    "country":"06"
                },
                receiver:{
                    "name":"receiver",
                    "postCode":"50110",
                    "mobile":"13927089988",
                    "prov":"Kandal",
                    "city":"Kandal Stueng",
                    "county":"Ampov Prey",
                    "address":"456",
                    "email":"kkk@email.com",
                    "country":"06"
                },
                items:{
                    item:{
                            "itemWeight": "1",
                            "itemLength": "20",
                            "itemWidth": "20",
                            "itemHeight": "20"
                        }
                },
                piece: "1",
                itemsWeight: "1",
                length:"20",
                width:"20",
                height:"20"
            },
            partnerID: PARTNER_ID
        }
        const newData = await doSign(formData, charset, keys)
        console.log(newData)
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
        return res
                .status(200)
                .send({status:true, data:response.data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

// async function invoiceNumber(date) {
//     data = `${dayjs(date).format("YYYYMMDD")}`
//     let random = Math.floor(Math.random() * 1000000)
//     const combinedData = data + random;
//     const findInvoice = await historyWallet.find({orderid:combinedData})

//     while (findInvoice && findInvoice.length > 0) {
//         // สุ่ม random ใหม่
//         random = Math.floor(Math.random() * 1000000);
//         combinedData = data + random;

//         // เช็คใหม่
//         findInvoice = await historyWallet.find({orderid: combinedData});
//     }

//     console.log(combinedData);
//     return combinedData;
// }
module.exports = { createOrder }