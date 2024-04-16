const { priceBase } = require("../../../Models/Delivery/weight/priceBase.express");
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { shopPartner } = require("../../../Models/shop/shop_partner");
const { weightAll } = require("../../../Models/Delivery/weight/weight.all.express");

editPrice = async(req, res)=>{
    try{
        const id = req.params.id
        const express = req.body.express
        const weight = req.body.weight
        
        const findExpress = await priceBase.findOneAndUpdate(
            {_id:id},
            {
                weight: weight
            },
            {new:true})
            if(!findExpress){
                return res  
                        .status(400)
                        .send({status:false, message:"ไม่สามารถแก้ไขราคามาตรฐานได้"})
            }
        return res
                .status(200)
                .send({status:true, data:findExpress})
        //  try {
        //     const result = await weightAll.bulkWrite(weight.mcap(data => ({
        //         updateMany: {
        //             filter: { express: express },
        //             update: { 
        //                 $set: {
        //                     // 'weight.$[element].costBangkok_metropolitan': data.costBangkok_metropolitan,
        //                     // 'weight.$[element].costUpcountry': data.costUpcountry,
        //                     'weight.$[element].salesBangkok_metropolitan': data.salesBangkok_metropolitan,
        //                     'weight.$[element].salesUpcountry': data.salesUpcountry
        //                 }
        //             },
        //             arrayFilters: [{ 'element.weightEnd': data.weightEnd }],
        //             upsert: false,
        //         }
        //     })));

        //     return res
        //             .status(200)
        //             .send({ status: true, data: findExpress, result });

        // } catch (error) {
        //     console.error(error);
        //     return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });
        // }
       
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getAll = async(req, res)=>{
    try{
        const get = await priceBase.find()
            if(!get){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:get})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getByExpress = async(req, res)=>{
    try{
        const id = req.params.id
        const express = req.body.express
        const get = await priceBase.findOne({shop_id:id,express:express})
            if(!get){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:get})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = {editPrice, getAll, getByExpress}