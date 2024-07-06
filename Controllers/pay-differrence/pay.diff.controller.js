const { orderAll } = require("../../Models/Delivery/order_all");
const { Partner } = require("../../Models/partner");
const { payDifference } = require("../../Models/pay_difference/pay.difference.models");
const { historyWallet } = require("../../Models/topUp/history_topup");
const { uploadFileCreate, deleteFile } = require("../../functions/uploadfileFree");
const multer = require("multer");
const mongoose = require('mongoose');
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

// เพิ่มปลั๊กอินสำหรับ UTC และ timezone ใน dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

let dayjsTimestamp
let dayTime
function updateRealTime() {
    dayjsTimestamp = dayjs().tz('Asia/Bangkok');
    dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')
    // console.log(dayTime)
}
// เรียกใช้ฟังก์ชัน updateRealTime() ทุก 1 วินาที
setInterval(updateRealTime, 60000);

exports.create = async (req, res) => {
    try {
        const partner_id = req.body.partner_id
        const price_difference = req.body.price_difference
        const weight = req.body.weight
        const cost_price = req.body.cost_price
        const actual_weight = req.body.actual_weight
        const new_price = req.body.new_price
        let v = {
            status_order:"ชำระแล้ว",
            status:'false',
            ...req.body
        }
        if (!price_difference || isNaN(price_difference) || price_difference < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
            return res
                    .status(400)
                    .send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
        }else if (!/^(\d+(\.\d{1,2})?)$/.test(price_difference.toString())){ //เช็คทศนิยมไม่เกิน 2 ตำแหน่ง
            return res
                    .status(400)
                    .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
        }
        // const checkOrderid = await payDifference.findOne({orderid: req.body.orderid})
        //     if(checkOrderid){
        //         return res
        //                 .status(400)
        //                 .send({ status: false, message: `มีหมายเลขออเดอร์ ${req.body.mailno} แล้วในระบบชำระค่าส่วนต่าง` });
        //     }
        let historyPartner
        const invoice = await invoiceCredit(dayTime)
        const findPartner = await Partner.findById(partner_id)
            if(!findPartner){
                return res
                        .status(404)
                        .send({ status: false, message: "ไม่สามารถหาข้อมูลพาร์ทเนอร์ได้" });
            }
            if(findPartner.credits < price_difference || findPartner.credits == 0){
                v.status_order = "รอชำระเงิน"
            }else{
                const update = await Partner.findByIdAndUpdate(
                    partner_id, 
                    { 
                        $inc: { credits: -price_difference } 
                    },{
                        new:true
                    });
                    if(!update){
                        return res
                                .status(400)
                                .send({ status: false, message: "ไม่สามารถสร้างข้อมูลได้" });
                    }
                const dataHistoryPartner = {
                            partnerID: update._id,
                            shop_number: "-",
                            orderid: req.body.mailno,
                            outTradeNo: invoice,
                            firstname: update.firstname,
                            lastname: update.lastname,
                            amount: price_difference,
                            before: parseFloat(findPartner.credits.toFixed(2)),
                            after: "หักส่วนต่างค่าขนส่ง",
                            money_now: parseFloat(update.credits.toFixed(2)),
                            type: "เงินออก",
                            remark:`น้ำหนัก ${weight}/${cost_price} กิโลกรัม/บาท, น้ำหนักจริง ${actual_weight}/${new_price} กิโลกรัม/บาท หักส่วนต่างค่าขนส่ง ${price_difference} บาท`,
                    }
                v.remark = dataHistoryPartner.remark
                historyPartner = await historyWallet.create(dataHistoryPartner)
                    if(!historyPartner){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
                    }
            }
        const create = await payDifference.create(v);
            if(!create){
                return res
                        .status(400)
                        .send({ status: false, message: "ไม่สามารถสร้างข้อมูลได้" });
            }
        return res
                .status(200)
                .send({ status: true, message: "สร้างข้อมูลสําเร็จ", data: create, history: historyPartner });
    } catch (err) {
            console.log(err);
            return res
                    .status(500)
                    .send({ status:false, message: err.message });
    }
}

exports.getAll = async(req, res)=>{
    try{
        const findAll = await payDifference.find()
            if(findAll.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาได้"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getById = async(req, res)=>{
    try{
        const id = req.params.id
        const find = await payDifference.findById(id)
            if(!find){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาได้"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.update = async(req, res)=>{
    try{
        const id = req.params.id
        const update = await payDifference.findByIdAndUpdate(id, req.body, {new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.delend = async(req, res)=>{
    try{
        const id = req.params.id
        const del = await payDifference.findByIdAndDelete(id)
            if(!del){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบได้"})
            }
        return res
                .status(200)    
                .send({status:true, message:"ลบสำเร็จ", data:del})
    }catch(err){
        return res
                .status(500)    
                .send({status:false, message:err.message})
    }
}

exports.getOrder = async(req, res)=>{
    try{
        const orderid = req.body.orderid
        const findMe = await orderAll.find(
            {
                 $or: [ 
                    { tracking_code: { $in: orderid } }, 
                    { mailno: { $in: orderid } } 
                ]
            },{
                owner_id: 1, tracking_code:1, shop_id:1, mailno:1, day:1, express:1, parcel:1, profitAll:1
            })
            if(findMe.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีรายการสินค้าของท่าน"})
            }
        const findPartner = await Partner.find({}, {_id:1, firstname:1, lastname:1, shop_me:1})
            if(findPartner.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบพาร์ทเนอร์"})
            }
        const data = findMe.map((item)=>{
            let partnerName = findPartner.find((i)=> i._id.toString() == item.owner_id)
            let shopName = partnerName.shop_me.find((i)=> i._id.toString() == item.shop_id)
            let info ={ 
                    partner_id:item.owner_id,
                    name:`คุณ${partnerName.firstname} ${partnerName.lastname}`,
                    shop_name: shopName.shop_name,
                    orderid: item.tracking_code,
                    mailno:item.mailno,
                    day_create:item.day,
                    express:item.express,
                    weight:item.parcel.weight,
                    size:`${item.parcel.width}x${item.parcel.length}x${item.parcel.height}`,
                    cost_price:item.profitAll[0].cost
            }
            return info
        })

        return res
                .status(200)
                .send({status:true, data:data})
    }catch(err){
        console.log(err)
        return res
                .status(500)    
                .send({status:false, message:err.message})
    }
}

exports.getReport = async(req, res)=>{
    try{
        const partner_id = req.body.partner_id
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        const express = req.body.express
        const status_order = req.body.status_order
        let data
            if(!day_start && !day_end){
                if(partner_id){
                    if(status_order && express){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            status_order: status_order,
                            express: express
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(1)",data:[]})
                        }
                    }else if(!status_order && !express){
                        data = await payDifference.find({
                            partner_id: partner_id
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(2)",data:[]})
                        }
                    }else if(status_order){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            status_order: status_order
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(3)",data:[]})
                        }
                    }else if(express){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            express: express
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(4)",data:[]})
                        }
                    }
                }else if(status_order && express){
                    data = await payDifference.find({
                        status_order: status_order,
                        express: express
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(5)",data:[]})
                    }
                }else if(!status_order && !express){
                    data = await payDifference.find()
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(6)",data:[]})
                    }
                }else if(status_order){
                    data = await payDifference.find({
                        status_order: status_order
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(7)",data:[]})
                    }
                }else if(express){
                    data = await payDifference.find({
                        express: express
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(8)",data:[]})
                    }
                }
            }else if(day_start && day_end){
                if(partner_id){
                    if(status_order && express){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            status_order: status_order,
                            express: express,
                            day: {
                                $gte: day_start,
                                $lte: day_end
                            }
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(9)",data:[]})
                        }
                    }else if(!status_order && !express){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            day: {
                                $gte: day_start,
                                $lte: day_end
                            }
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(10)",data:[]})
                        }
                    }else if(status_order){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            status_order: status_order,
                            day: {
                                $gte: day_start,
                                $lte: day_end
                            }
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(11)",data:[]})
                        }
                    }else if(express){
                        data = await payDifference.find({
                            partner_id: partner_id,
                            express: express,
                            day: {
                                $gte: day_start,
                                $lte: day_end
                            }
                        })
                        if(data.length == 0){    
                            return res
                                    .status(200)
                                    .send({status:true, message:"ไม่พบข้อมูล(12)",data:[]})
                        }
                    }
                }else if(status_order && express){
                    data = await payDifference.find({
                        status_order: status_order,
                        express: express,
                        day: {
                            $gte: day_start,
                            $lte: day_end
                        }
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(13)",data:[]})
                    }
                }else if(!status_order && !express){
                    data = await payDifference.find({
                        day: {
                            $gte: day_start,
                            $lte: day_end
                        }
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(14)",data:[]})
                    }
                }else if(status_order){
                    data = await payDifference.find({
                        status_order: status_order,
                        day: {
                            $gte: day_start,
                            $lte: day_end
                        }
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(15)",data:[]})
                    }
                }else if (express){
                    data = await payDifference.find({
                        express: express,
                        day: {
                            $gte: day_start,
                            $lte: day_end
                        }
                    })
                    if(data.length == 0){    
                        return res
                                .status(200)
                                .send({status:true, message:"ไม่พบข้อมูล(16)",data:[]})
                    }
                }
            }
        return res
                .status(200)
                .send({status:true, data:data})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.cutCredits = async(partner_id_string)=>{
    try{
        const partner_id = new mongoose.Types.ObjectId(partner_id_string);
        const partner = await Partner.findById(partner_id);
            if(!partner){
                return 'Partner not found';
            }

        const orderids = await payDifference.find(
            {
                partner_id: partner_id, status_order: "รอชำระเงิน"
            },
            {
                orderid:1, mailno:1, price_difference:1, weight:1,cost_price:1,actual_weight:1,new_price:1 
            }).sort({ price_difference: 1 });
            console.log(orderids)
            if(orderids.length == 0){
                return 'ไม่มีออเดอร์ที่ต้องจ่ายส่วนต่าง';
            }

        let data = [];
        let money = 0;
            for (let i = 0; i < orderids.length; i++) {
                let priceDifference = orderids[i].price_difference;
                if (money + priceDifference > partner.credits) {
                    break;
                }
                money += priceDifference;
                data.push(orderids[i]);
            }

        let pay_diff = []
        let cut_partner = []
        let history = []
        let before = partner.credits;
        let after = partner.credits
        if(data.length != 0){
            for (const item of data) {
                let pay = {
                    updateOne: {
                        filter: { mailno: item.orderid },
                        update: {
                        $set: {
                            status_order: "ชำระแล้ว",
                            status: "false"
                            }
                        }
                    }
                };
                pay_diff.push(pay);
                const invoice = await invoiceCredit(dayTime)
                after -= item.price_difference
                let v = {
                    partnerID: partner._id,
                    shop_number: "-",
                    outTradeNo: invoice,
                    orderid: item.mailno,
                    firstname: partner.firstname,
                    lastname: partner.lastname,
                    amount: item.price_difference,
                    before: parseFloat(before.toFixed(2)),
                    after: "หักส่วนต่างค่าขนส่ง",
                    money_now: parseFloat(after.toFixed(2)),
                    type: "เงินออก",
                    remark:`น้ำหนัก ${item.weight}/${item.cost_price} กิโลกรัม/บาท, น้ำหนักจริง ${item.actual_weight}/${item.new_price} กิโลกรัม/บาท หักส่วนต่างค่าขนส่ง ${item.price_difference} บาท`,
                }
                before -= item.price_difference
                history.push(v);
                let cut = {
                    updateOne: {
                        filter: {
                            _id:partner_id // Ensure partner_id is ObjectId
                        },
                        update: {
                        $inc: { credits: -item.price_difference }
                        }
                    }
                };
                cut_partner.push(cut);
            }
        }
        try {
            const update = await payDifference.bulkWrite(pay_diff);
            const update_partner = await Partner.bulkWrite(cut_partner);
            const history_create = await Promise.all(history.map(item => historyWallet.create(item)));

            return { update, update_partner, history_create };
        } catch (error) {
            console.error('Bulk write error:', error);
            return 'Error occurred during bulk write operations'
        }
    }catch(err){
        return err.message
    }
}

exports.upload = async (req, res) => {
    try{
        let location = process.env.GOOGLE_DRIVE_PAY_DIFF
        let upload = multer({ storage: storage })
        const fields = [
          {name: 'pictureSize', maxCount: 5},
          {name: 'pictureWeight', maxCount: 1}
        ]
        const uploadMiddleware = upload.fields(fields);
        uploadMiddleware(req, res, async function (err) {
          const reqFiles = [];
          const result = [];
          const remark = req.body.remark
          if (!req.files) {
            return res.status(400).send({ message: 'No files were uploaded.' });
          }
          const url = req.protocol + "://" + req.get("host");
          for (const fieldName in req.files) {
            const files = req.files[fieldName];
            for (var i = 0; i < files.length; i++) {
              const src = await uploadFileCreate(files[i], res, { i, reqFiles }, location);
              result.push(src);
            }
          }
        //   console.log(result[0])
          const id = req.params.id;
          const member = await payDifference.findByIdAndUpdate(id, {
              remark: "รอตรวจสอบเอกสารกับทางขนส่ง",
              "refutation.picture_size": result[0].responseDataId,
              "refutation.picture_weight": result[1].responseDataId,
              "refutation.remark_user": remark,
              "refutation.admin_read": "false",
              "refutation.status": "รอตรวจสอบ",
            },{new:true});
            if (!member) {
                return res.status(500).send({
                message: "ไม่สามารถเพิ่มรูปภาพได้",
                status: false,
              });
            }else{
                return res.status(200).send({
                message: "เพิ่มรูปภาพสำเร็จ",
                status: true,
                data: member
              });
            }
        });
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.approve = async(req, res)=>{
    try{
        const id = req.params.id;
        const status = req.body.status
        const remark = req.body.remark
            if(status != "อนุมัติ" && status != "ไม่อนุมัติ"){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณากรอกสถานะให้ถูกต้อง"})
            }
        if(status == 'อนุมัติ'){
            const invoice = await invoiceCredit(dayTime)
            const update = await payDifference.findByIdAndUpdate(
                id, 
                {
                    status_order:"คืนค่าส่วนต่าง",
                    status:"false",
                    "refutation.status":status,
                    "refutation.remark_admin":remark
                }, 
                {
                    new:true,
                    select: '_id partner_id mailno status_order status price_difference refutation '
                });
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถให้สถานะเอกสารได้"})
                }
            
            const update_partner = await Partner.findByIdAndUpdate(
                update.partner_id, 
                {
                    $inc: {
                        credits: +update.price_difference
                    }
                }, 
                {
                    new:true,
                    select: '_id firstname lastname credits'
                });
                if(!update_partner){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถให้สถานะเอกสารได้"})
                }
            let before = update_partner.credits - update.price_difference
            const dataHistoryPartner = {
                    partnerID: update_partner._id,
                    shop_number: "-",
                    orderid: update.mailno,
                    outTradeNo: invoice,
                    firstname: update_partner.firstname,
                    lastname: update_partner.lastname,
                    amount: update.price_difference,
                    before: parseFloat(before.toFixed(2)),
                    after: "คืนส่วนต่างค่าขนส่ง",
                    money_now: parseFloat(update_partner.credits.toFixed(2)),
                    type: "เงินเข้า",
                    remark:`คืนเงินส่วนต่างค่าขนส่งจำนวน ${update.price_difference} บาท`,
                }
            const historyPartner = await historyWallet.create(dataHistoryPartner)
                    if(!historyPartner){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้างประวัติการเงินพาร์ทเนอร์ได้"})
                    }
            return res
                    .status(200)
                    .send({status:true, data:update, partner:update_partner, history:historyPartner})
        }else{
            const update = await payDifference.findByIdAndUpdate(
                id, 
                {
                    status_order:"ไม่อนุมัติ",
                    status:"false",
                    "refutation.status":status,
                    "refutation.remark_admin":remark
                }, 
                {
                    new:true,
                    select: '_id partner_id mailno status_order status price_difference refutation'
                });
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถให้สถานะเอกสารได้"})
                }
            return res
                    .status(200)
                    .send({status:true, data:update})
        }

    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
async function invoiceCredit(date) {
    let data = `CDF`
    date = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 10000000000)
    const combinedData = data + date + random;
    const findInvoice = await historyWallet.find({orderid:combinedData})
  
    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 10000000000);
        combinedData = data + date + random;
  
        // เช็คใหม่
        findInvoice = await historyWallet.find({orderid: combinedData});
    }
  
    console.log(combinedData);
    return combinedData;
}