const { claimOrder } = require("../../Models/claim_order/claim.models");
const { uploadFileCreate } = require("../../functions/uploadfileTest");
const multer = require("multer");

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

exports.create = async (req, res) => {
    try {
        const id = req.decoded.userid
        const create = await claimOrder.create({ partner_id:id, ...req.body })
        if (!create) {
            return res
                .status(400)
                .send({ status: false, message: "ไม่สามารถสร้างข้อมูลได้" })
        }
        return res
            .status(200)
            .send({ status: true, data: create })
    } catch (err) {
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getAll = async(req, res) => {
    try{
        const findAll = await claimOrder.find()
            if(findAll.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getById = async(req, res)=>{
    try{
        const id = req.params.id
        const find = await claimOrder.findById(id)
            if(!find){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.update = async(req, res)=>{
    try{
        const id = req.params.id
        const update = await claimOrder.findByIdAndUpdate(id, req.body, {new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.delete = async(req, res)=>{
    try{
        const id = req.params.id
        const deleteData = await claimOrder.findByIdAndDelete(id)
            if(!deleteData){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"ลบข้อมูลสําเร็จ"})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.uploadPicture = async (req,res)=>{
    try {
        const location = process.env.GOOGLE_DRIVE_CLAIM
        let upload = multer({ storage: storage })
        const fields = [
            {name: 'pictureOne', maxCount: 5},
            {name: 'pictureTwo', maxCount: 5}
        ]
        const uploadMiddleware = upload.fields(fields);
        uploadMiddleware(req, res, async function (err) {
            if (err) {
                console.error('Error in uploadMiddleware');
                return res.status(400).send({ message: 'กรุณาอัพโหลดรูปภาพไม่เกิน 5 รูป' });
            }
            const reqFiles = [];
            const result = [];
            const resultLink = []
            if (!req.files) {
                return res
                        .status(400)
                        .send({ message: 'No files were uploaded.' });
            }

            const url = req.protocol + "://" + req.get("host");
            for (const fieldName in req.files) {
                const files = req.files[fieldName];
                for (var i = 0; i < files.length; i++) {
                    const src = await uploadFileCreate(files[i], res, { i, reqFiles }, location);
                    result.push(src);
                    resultLink.push(src.responseDataId)
                }
            }
            console.log(resultLink)
            const type = req.body.type
            const id = req.params.id;
            if(type == "product"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    picture_product: resultLink,
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "label"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    picture_label: resultLink,
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "broken"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    picture_broken: resultLink,
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "value"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    picture_value: resultLink,
                }, {new:true}) 
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "sender"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    "sender.picture_iden": resultLink[0],
                    "sender.picture_bookbank": resultLink[1],
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "video"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    video: resultLink,
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }else if(type == "weight"){
                const update = await claimOrder.findByIdAndUpdate(id, {
                    picture_weight: resultLink,
                }, {new:true})
                if(!update){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                }
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
            }
        });
    
    } catch (error) {
        return res
                .status(500)
                .send({ status: false, error: error.message });
    }
}

exports.getDate = async(req, res)=>{
    try{
        const partner_id = req.body.partner_id
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        const express = req.body.express
        const status = req.body.status
        let data
        if(!day_start && !day_end){
            if(partner_id){
                if(express && status){
                    data = await claimOrder.find({partner_id:partner_id, 'form_data.express':express, status_order:status})
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(0)"})
                        }
                }else if(!express && !status){
                    data = await claimOrder.find({partner_id:partner_id})
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(1)"})
                        }
                }else if(express){
                    data = await claimOrder.find({partner_id:partner_id, 'form_data.express':express})
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(2)"})
                        }
                }else if(status){
                    data = await claimOrder.find({partner_id:partner_id, status_order:status})
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(3)"})
                        }
                }
            }else if(express && status){
                data = await claimOrder.find({'form_data.express':express, status_order:status})
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(4)"})
                    }
            }else if(!express && !status){
                data = await claimOrder.find()
                    if(data.length == 0){ 
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(5)"})
                    }
            }else if(express){
                data = await claimOrder.find({'form_data.express':express})
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(6)"})
                    }
            }else if(status){
                data = await claimOrder.find({status_order:status})
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(7)"})
                    }
            }
        }else if(day_start && day_end){
            if(partner_id){
                if(express && status){
                    data = await claimOrder.find({
                        partner_id:partner_id, 
                        'form_data.express':express, 
                        status_order:status,
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(8)"})
                        }
                }else if(!express && !status){
                    data = await claimOrder.find({
                        partner_id:partner_id, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(9)"})
                        }
                }else if(express){
                    data = await claimOrder.find({
                        partner_id:partner_id, 
                        'form_data.express':express, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(10)"})
                        }
                }else if(status){
                    data = await claimOrder.find({
                        partner_id:partner_id, 
                        status_order:status, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                        if(data.length == 0){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่พบข้อมูล(11)"})
                        }
                }
            }else if(express && status){
                data = await claimOrder.find({
                    'form_data.express':express, 
                    status_order:status,
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }
                })
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(12)"})
                    }
            }else if(!express && !status){
                data = await claimOrder.find({
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }
                })
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(13)"})
                    }
            }else if(express){
                data = await claimOrder.find({
                    'form_data.express':express,
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }
                })
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(14)"})
                    }
            }else if(status){
                data = await claimOrder.find({
                    status_order:status, 
                    day:{
                        $gte:day_start,
                        $lte:day_end
                    }
                })
                    if(data.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่พบข้อมูล(15)"})
                    }
                
            }
        }
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