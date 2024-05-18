const { historyWalletShop } = require("../../Models/shop/shop_history");
const { shopPartner } = require("../../Models/shop/shop_partner");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
// เพิ่มปลั๊กอินสำหรับ UTC และ timezone ใน dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

let dayjsTimestamp
let dayTime

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
 function updateRealTime() {
    dayjsTimestamp = dayjs().tz('Asia/Bangkok');
    dayTime = dayjsTimestamp.format('YYYY-MM-DD');
    // console.log(dayTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 5 วินาที
setInterval(updateRealTime, 5000);

getAll = async (req, res)=>{
    try{
        const getAll = await historyWalletShop.find()
        if(getAll){
            return res
                    .status(200)
                    .send({status:true, data:getAll})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getOne = async (req, res)=>{
    try{
        const shop_id = req.params.shop_id
        const findShop = await historyWalletShop.find({shop_id:shop_id, day:dayTime})
        if(findShop.length == 0){
            return res
                    .status(200)
                    .send({
                        status:true,
                        data:[],
                        message:"ไม่สามารถค้นหาออเดอร์ได้เนื่องจากท่านยังไม่ได้สั่งสินค้าวันนี้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, data:findShop})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getById = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findShop = await historyWalletShop.find({ID:id})
        if(!findShop){
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาหมายเลขร้านค้าได้"})
        }else{
            return res
                    .status(200)
                    .send({status:true, data:findShop})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
module.exports = { getAll, getOne, getById }