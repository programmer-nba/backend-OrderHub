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

getCreditDis = async(req, res)=>{
    try{
        const shop_number = req.body.shop_number
        const day = req.body.day

        const findHistory = await historyWalletShop.find({shop_number:shop_number, day:day})
            if(findHistory.length == 0){
                return res
                        .status(404)
                        .send({status:false, data:[]})
            }
        return res
                .status(200)
                .send({status:true, data:findHistory})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getShopHistory = async(req, res)=>{
    try{
        const shop_number = req.body.shop_number
        const orderer = req.body.orderer
        const type = req.body.type
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        let findMe = []

        if(!day_start && !day_end){
            if(shop_number){    
                if(!orderer && !type){
                    findMe = await historyWalletShop.find({shop_number:shop_number})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(1)"})
                        }
                }else if(orderer && type){
                    findMe = await historyWalletShop.find({shop_number:shop_number, ID:orderer, type:type})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(2)"})
                        }
                }else if(orderer){
                    findMe = await historyWalletShop.find({shop_number:shop_number, ID:orderer})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(3)"})
                        }
                }else if(type){
                    findMe = await historyWalletShop.find({shop_number:shop_number, type:type})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(4)"})
                        }
                }
            }else if(orderer){
                if(type){
                    findMe = await historyWalletShop.find({ID:orderer, type:type})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(5)"})
                        }
                }else {
                    findMe = await historyWalletShop.find({ID:orderer})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(6)"})
                        }
                }
            }else if(type){
                findMe = await historyWalletShop.find({type:type})
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(7)"})
                    }
            }
        }else if(day_start && day_end){
            if(shop_number){
                if(!orderer && !type){
                    findMe = await historyWalletShop.find({
                        shop_number:shop_number, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(8)"})
                        }
                }else if(orderer && type){
                    console.log("11")
                    findMe = await historyWalletShop.find({
                        shop_number:shop_number, 
                        ID:orderer, 
                        type:type, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(9)"})
                        }
                }else if(orderer){
                    console.log("9")
                    findMe = await historyWalletShop.find({
                        shop_number:shop_number, 
                        ID:orderer, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(10)"})
                        }
                }else if(type){
                    findMe = await historyWalletShop.find({
                        shop_number:shop_number, 
                        type:type, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(11)"})
                        }
                }
            }else if(orderer){
                if(type){
                    findMe = await historyWalletShop.find({
                        ID:orderer,
                        type:type, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(12)"})
                        }
                }else {
                    findMe = await historyWalletShop.find({
                        ID:orderer, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(13)"})
                        }
                }
            }else if(type){
                findMe = await historyWalletShop.find({
                    type:type, 
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }})
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(14)"})
                    }
            }else{
                findMe = await historyWalletShop.find({
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }})
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(15)"})
                    }
            }
        }
        return res
                .status(200)
                .send({status:true,data:findMe})
    }catch(err){
        console.log(err)
        return res 
                .status(500)
                .send({status:false, message:err.message})
    }
}
module.exports = { getAll, getOne, getById, getCreditDis, getShopHistory }