const { orderAll } = require('../../Models/Delivery/order_all')
const { Partner } = require('../../Models/partner')
const { profitIce } = require('../../Models/profit/profit.ice')
const { profitPartner } = require('../../Models/profit/profit.partner')
const { profitTemplate } = require('../../Models/profit/profit.template')
const { historyWalletShop } = require('../../Models/shop/shop_history')
const { shopPartner } = require('../../Models/shop/shop_partner')
const { historyWallet } = require('../../Models/topUp/history_topup')
const { getContractByID } = require('../contractController')
const { getById } = require('./topupController')

getAll = async (req, res)=>{
    try{
        const get = await historyWallet.find()
        if(get){
            return res  
                    .status(200)
                    .send({status:true,data: get})
        }else{
            return res  
                    .status(400)
                    .send({status:true,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findId = async (req, res)=>{
    try{
        const getid = req.params.id
        const getbyid = await historyWallet.find({partnerID:getid})
        if(getbyid.length > 0){
            return res  
                    .status(200)
                    .send({status:true,data: getbyid})
        }else{
            return res  
                    .status(400)
                    .send({status:false,message:"ไม่มีข้อมูลประวัติการเติมเงินของบุคคลนี้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findIdForUser = async (req, res)=>{
    try{
        const getid = req.decoded.userid
        const getbyid = await historyWallet.find({partnerID:getid})
        if(getbyid){
            return res
                    .status(200)
                    .send({status:true,data: getbyid})
        }else{
            return res
                    .status(400)
                    .send({status:false,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findShop = async (req, res)=>{
    try{
        const shop_number = req.params.shop_number
        const getbyShop_number = await historyWallet.find({shop_number:shop_number})
        if(getbyShop_number){
            return res
                    .status(200)
                    .send({status:true,data: getbyShop_number})
        }else{
            return res
                    .status(400)
                    .send({status:false,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

findAmountAll = async(req, res)=>{
    try{
        const partner_id = req.body.partner_id
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        const status = req.body.status
        let findPartner
        if(partner_id){
            if(day_start && day_end){
                if(status){
                    findPartner = await historyWallet.find({
                        partnerID:partner_id, 
                        after:status,
                        day: { $gte: day_start, $lte: day_end } 
                    })
                        if(findPartner.length == 0){
                            return res
                                    .status(200)
                                    .send({status:true, data:[]})
                        }
                }else{
                    findPartner = await historyWallet.find({
                        partnerID:partner_id, 
                        day: { $gte: day_start, $lte: day_end } 
                    })
                        if(findPartner.length == 0){
                            return res
                                    .status(200)
                                    .send({status:true, data:[]})
                        }
                }
            }else if(status){
                findPartner = await historyWallet.find({
                    partnerID:partner_id, 
                    after:status
                })
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[]})
                    }
            }else{
                findPartner = await historyWallet.find({
                    partnerID:partner_id, 
                })
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[]})
                    }
            }
        }else if(!partner_id){
            if(day_start && day_end){
                if(status){
                    findPartner = await historyWallet.find({
                        after:status,
                        day: { $gte: day_start, $lte: day_end } 
                    })
                        if(findPartner.length == 0){
                            return res
                                    .status(200)
                                    .send({status:true, data:[]})
                        }
                }else{
                    findPartner = await historyWallet.find({
                        day: { $gte: day_start, $lte: day_end } 
                    })
                        if(findPartner.length == 0){
                            return res
                                    .status(200)
                                    .send({status:true, data:[]})
                        }
                }
            }else if(status){
                findPartner = await historyWallet.find({
                    after:status,
                })
                    if(findPartner.length == 0){
                        return res
                                .status(200)
                                .send({status:true, data:[]})
                    }
            }
        }else{
            return res
                    .status(404)
                    .send({status:false, message:"ไม่พบข้อมูลที่ต้องการ"})
        }
        
        const totalAmount = findPartner.reduce((sum, record) => sum + record.amount, 0);
        console.log(`Total Amount: ${totalAmount}`);
        return res
                .status(200)
                .send({status:true,total: totalAmount, data:findPartner})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

findShopAmountAll = async(req, res)=>{
    try{
        const day = req.body.day
        const findHistory = await orderAll.find(
            {
                day:{
                    $lte:"2024-06-10"
                },
                order_status:"cancel"
            },{tracking_code:1}
        ).exec();
            if(findHistory.length == 0){
                return res
                        .status(404)
                        .send({status:false, data:[]})
            }
        
        console.log("findHistory:",findHistory.length)
        // const orderIdsToUpdate = findHistory.map(doc => doc.orderid);
        // console.log("orderIdsToUpdate:",orderIdsToUpdate.length)
        // const orderAllDocs = await orderAll.find({ tracking_code: { $in: orderIdsToUpdate } },{tracking_code:1, mailno:1}).exec()
        // console.log("orderAllDocs:",orderAllDocs.length)
        const findMap = await Promise.all(findHistory.map(item => ({
            updateOne: {
                filter: { orderid: item.tracking_code },
                update:{
                    $set:{
                        type: "ยกเลิกออเดอร์"
                    }
                }
            }
        })));
        console.log(findMap.length)
        const batchSize = 1000;
        const totalBatches = Math.ceil(findMap.length / batchSize);
        for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize;
            const endIndex = Math.min(startIndex + batchSize, findMap.length);
            
            const batch = findMap.slice(startIndex, endIndex); 
        
            // ส่ง batch ไปทำ bulkWrite
            try {
                const result = await profitTemplate.bulkWrite(batch);
                console.log(`Batch ${i + 1} bulkWrite result:`, result);
            } catch (error) {
                console.error(`Error performing bulkWrite for batch ${i + 1}:`, error);
            }
        }
        // ส่ง response เมื่อการลบเสร็จสิ้น
        return res
                .status(200)
                .json({ message: 'Documents fixed successfully' });

        // const id = req.params.id
        // const day_start = req.body.day_start
        // const day_end = req.body.day_end
        // const findData = await profitPartner.find({
        //     wallet_owner: '6639eceffeaaad9370b7bf8e',
        //     status: "เงินเข้า",
        //     day: {
        //         $gte: day_start,
        //         $lte: day_end
        //     }
        // }, { profitCOD: 1, profitCost: 1, profit: 1 }).lean().exec()

        // const totalCOD = findData.reduce((sum, record) => sum + record.profitCOD, 0);
        // const totalCOST = findData.reduce((sum, record) => sum + record.profitCost, 0);
        // const totalPROFIT = findData.reduce((sum, record) => sum + record.profit, 0);
        // console.log(findData.length)
        // return res
        //         .status(200)
        //         .send({
        //             status:true,
        //             totalCOD:parseFloat(totalCOD.toFixed(2)), 
        //             totalCOST:totalCOST,
        //             totalPROFIT:parseFloat(totalPROFIT.toFixed(2))
        //         })
        
        //ค้นหาสินค้าจากนั้นนำ amount มาบวกกัน
        // const shop_id = req.body.shop_id
        // const findShop = await historyWalletShop.find({shop_id:shop_id, remark:"ขนส่งสินค้า(J&T)"})
        //     if(findShop.length == 0){
        //         return res
        //                 .status(404)
        //                 .send({status:false, data:[]})
        //     }
        // const totalAmount = findShop.reduce((sum, record) => sum + record.amount, 0);
        // console.log(`Total Amount: ${totalAmount}`);
        // return res
        //         .status(200)
        //         .send({
        //             status:true,
        //             total:totalAmount, 
        //             data:findShop})
    }catch(err){
        return res  
                .status(500)
                .send({status:false, message:err.message})
    }
}

module.exports = {getAll, findId, findIdForUser, findShop, findAmountAll, findShopAmountAll}