const { claimOrder } = require("../../Models/claim_order/claim.models");
const { uploadFileCreate, deleteFile } = require("../../functions/uploadfileTest");
const multer = require("multer");
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { ObjectId } = require('mongodb');
const { checkAndCompressFile } = require("../../functions/compress.file");
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

dayjs.extend(utc);
dayjs.extend(timezone);

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });
const upload = multer({ dest: 'uploads/' });
exports.compressArray = upload.array('files')

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
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(0)", data:[]})
                        }
                }else if(!express && !status){
                    data = await claimOrder.find({partner_id:partner_id})
                        if(data.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(1)", data:[]})
                        }
                }else if(express){
                    data = await claimOrder.find({partner_id:partner_id, 'form_data.express':express})
                        if(data.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(2)", data:[]})
                        }
                }else if(status){
                    data = await claimOrder.find({partner_id:partner_id, status_order:status})
                        if(data.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(3)", data:[]})
                        }
                }
            }else if(express && status){
                data = await claimOrder.find({'form_data.express':express, status_order:status})
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(4)", data:[]})
                    }
            }else if(!express && !status){
                data = await claimOrder.find()
                    if(data.length == 0){ 
                        return res
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(5)", data:[]})
                    }
            }else if(express){
                data = await claimOrder.find({'form_data.express':express})
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(6)", data:[]})
                    }
            }else if(status){
                data = await claimOrder.find({status_order:status})
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(7)", data:[]})
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
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(8)", data:[]})
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
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(9)", data:[]})
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
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(10)", data:[]})
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
                                    .status(200)
                                    .send({status:false, message:"ไม่พบข้อมูล(11)", data:[]})
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
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(12)", data:[]})
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
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(13)", data:[]})
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
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(14)", data:[]})
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
                                .status(200)
                                .send({status:false, message:"ไม่พบข้อมูล(15)", data:[]})
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

exports.delPicture = async(req, res)=>{
    try{
        const dayEnd = req.body.dayEnd
        const findDay = await claimOrder.find({dayEnd:dayEnd}).sort({createAt:-1})
            if(findDay.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        let arrayPicture = []
        let bulk = []
        for(const item of findDay){
            let data = [
                    item.sender.picture_iden || "",
                    item.sender.picture_bookbank || "",
                    item.picture_product,
                    item.picture_label,
                    item.picture_broken,
                    item.picture_weight,
                    item.picture_value,
                    item.video
            ].flat(Infinity)
            .filter(value => value !== "" && value.length > 0); // กรองค่าว่างออก
            arrayPicture.push(data)

            let bulkWrite = {
                updateOne:{
                    filter:{_id:item._id},
                    update:{
                        $set:{
                            "sender.picture_iden": "",
                            "sender.picture_bookbank": "",
                            "picture_product": [],
                            "picture_label": [],
                            "picture_broken": [],
                            "picture_weight": [],
                            "picture_value": [],
                            "video": []
                        }
                    }
                }
            }
            bulk.push(bulkWrite)
        }

        let newArray = arrayPicture.filter(subArray => subArray.length > 0);
        let combinedArray = newArray.reduce((acc, curr) => acc.concat(curr), []);
        // console.log(combinedArray)
        let data = []
        for(const file of combinedArray){
            let result = await deleteFile(file)
            data.push(result)
        }
        let bulkWrite
        if(data.length != 0){
            bulkWrite = await claimOrder.bulkWrite(bulk)
        }
        
        return res
                .status(200)
                .send({status:true, 
                    data:data,
                    bulk:bulkWrite
                })
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.compress = async(req, res)=>{
    try{
        const files = req.files;
        const type = req.body.type;
        const compressedFiles = [];

        // สร้างโฟลเดอร์สำหรับไฟล์ที่บีบอัดถ้ายังไม่มี
        if (!fs.existsSync('compressed')) {
            fs.mkdirSync('compressed');
        }
    
        // ฟังก์ชันที่ใช้ในการบีบอัดและจัดการไฟล์แต่ละไฟล์
        async function processFile(index) {
            if (index >= files.length) {
                 // เมื่อประมวลผลไฟล์ทั้งหมดเสร็จแล้ว ส่ง response กลับไป
                const filenames = compressedFiles.map(filePath => path.basename(filePath));
                
                res.status(200).json({
                     status: true,
                     files: filenames
                });
 
                // ลบไฟล์ที่บีบอัดทั้งหมดหลังจากส่ง response
                // compressedFiles.forEach(filePath => fs.unlinkSync(filePath));
 
                return;
            }

            const file = files[index];
            if (!file || !file.path) {
                res.status(400).send(`File at index ${index} is invalid or missing 'path' property.`);
                return;
            }

            const inputFilePath = file.path;
            const outputFilePath = path.join('compressed', file.filename + (type === 'image' ? '.jpg' : '.mp4'));

            
            try {
                await new Promise((resolve, reject) => {
                    checkAndCompressFile(type, inputFilePath, outputFilePath, 0, (err, finalPath) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // console.log('Final path:', finalPath);
                        compressedFiles.push(finalPath);
                        resolve();
                    });
                });

                if (type === 'video' || type === 'image') {
                    await deleteFileWithShell(inputFilePath);
                }

                processFile(index + 1);
            } catch (err) {
                console.error('Error processing file:', err);
                res.status(500).send('Error processing file');
            };
        }
        // เริ่มประมวลผลไฟล์แรก
        await processFile(0);
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.uploadPicTwo = async (req, res)=>{
    try{
        const compressedFolderPath = path.join(__dirname, '..', '..', 'compressed');
        const uploadFolderPath = path.join(__dirname, '..', '..', 'uploads');
        console.log(uploadFolderPath)
        const filesToProcess = req.body.files;
        const id = req.params.id
        const type = req.body.type
        const location = process.env.GOOGLE_DRIVE_CLAIM
        let result = []
        let resultLink = []
            try {
                for (const fileName of filesToProcess) {
                    const filePath = path.join(compressedFolderPath, fileName);

                    // ตรวจสอบว่าไฟล์ที่ต้องการดึงมีอยู่จริงหรือไม่
                    if (fs.existsSync(filePath)) {
                        // console.log("filePath:",filePath)
                        const src = await uploadFileCreate(filePath, res, location);
                            result.push(src);
                            resultLink.push(src.responseDataId)
                        // ลบไฟล์ที่บีบอัดทั้งหมดหลังจากส่ง response
                        fs.unlinkSync(filePath)

                    } else {
                        console.error(`File not found: ${filePath}`);
                    }
                }
            } catch (error) {
                console.error( error);
                return res
                        .status(400)
                        .send({status:false, message:error})
            }
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
                console.log(resultLink)
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
        return res
                .status(200)
                .send({status:true,data:resultLink})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.delFile = async(req, res)=>{
    try{
        const files = req.body.files
            if(files.length == 0){
                return res
                        .status(200)
                        .send({status:false, data:[]})
            }
        const compressedFolderPath = path.join(__dirname, '..', '..', 'compressed');
        for(const file of files){
            const filePath = path.join(compressedFolderPath, file);
            await deleteFileWithShell(filePath);
        }
        return res
                .status(200)
                .send({status:true, message:"ลบข้อมูลสำเร็จ"})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
//ลบไฟล์ที่ต้องการ
async function deleteFileWithShell(filePath) {
    const command = process.platform === 'win32' ? `del /f "${filePath}"` : `rm -f "${filePath}"`;
    try {
        await execAsync(command);
        console.log(`Successfully deleted file using shell command: ${filePath}`);
    } catch (err) {
        console.error(`Failed to delete file using shell command: ${filePath}`, err);
    }
}

// ตั้งเวลาให้รันฟังก์ชันทุกวันเวลา 10:00 (เวลาประเทศไทย)
cron.schedule('0 10 * * *', async () => {
    const now = dayjs().tz("Asia/Bangkok");
    const dayEnd = now.subtract(1, 'day').format('YYYY-MM-DD');
    console.log(dayEnd)
    const req = { body: { dayEnd: dayEnd } }; // สร้าง request mock object
    const res = {
        status: (code) => ({
            send: (response) => console.log('Response:', response)
        })
    }; // สร้าง response mock object

    await exports.delPicture(req, res);
    console.log('delPicture function executed at 10:00 AM Bangkok time');
}, {
    scheduled: true,
    timezone: "Asia/Bangkok"
});