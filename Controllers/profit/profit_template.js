const { bankRecord } = require("../../Models/bank/bank.record");
const { Partner } = require("../../Models/partner");
const { profitPartner } = require("../../Models/profit/profit.partner");
const { shopPartner } = require("../../Models/shop/shop_partner");
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { profitTemplate } = require("../../Models/profit/profit.template");
const { uploadFileCreate, deleteFile } = require("../../functions/uploadfileTest");
const xlsx = require('xlsx');
const multer = require("multer");
const nodemailer = require('nodemailer');
const fs = require('fs');

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

const upload = multer({ dest: 'uploads/' });

const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY-MM-DD HH:mm:ss')

// Function to read and encode image file to base64
const encodeImageToBase64 = (imagePath) => {
    const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });
    return `data:image/jpeg;base64,${imageData}`;
};

const deleteUploadedExcel = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting uploaded Excel file:', err);
        } else {
            console.log('Uploaded Excel file deleted successfully');
        }
    });
};

uploadFileExcel = upload.single('file')

sendEmail = async (req, res)=>{
    try{
        let imagePath = './unnamed.jpg'
        const excelFile = req.file;
        const date = req.body.date
        const USERID = process.env.ID_GMAIL
        const PASSWORD = process.env.PASS_GMAIL
            if (!excelFile) {
                return res.status(400).send('กรุณาอัพโหลดไฟล์ Excel');
            }
        // อ่านไฟล์ Excel
        const workbook = xlsx.readFile(excelFile.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // ดึงข้อมูล Email
        const emailData = worksheet[`H2`].v
       
        // ดึงข้อมูลจากคอลัมน์ F ตั้งแต่แถวที่ 2 เป็นต้นไป
        let totalAmount = 0;
        for (let i = 2; ; i++) {
            const cellAddress = `F${i}`;
            const cell = worksheet[cellAddress];
            if (!cell) break;
            const cellValue = cell.v;
            totalAmount += cellValue;
        }
        try {
    
            // Create nodemailer transporter
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: USERID,
                    pass: PASSWORD
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // สร้าง Message-ID ที่ไม่ซ้ำกัน
            let messageId = `${Date.now()}@thevolumebiz.com`;

            // Email options
            let mailOptions = {
                from: USERID,
                to: emailData,
                subject: `COD REMITTANCE | Order Hub ${date}`,
                html: `<img src="cid:imageCid" alt="รูปภาพ" width="300" height="200">
                <p>สรุปยอดพัสดุ COD ของท่าน ที่นำจ่ายพัสดุเรียบร้อยแล้ว ในวันที่ ${date}</p>
                <p>รวมเป็นยอดเงินจำนวน ${totalAmount.toLocaleString()}.- บาท</p>
                <p>ทางบริษัทฯ จะโอนเงินเข้าบัญชีของท่านภายในวันทำการถัดไป</p>
                <p>ตรวจสอบรายละเอียดเพิ่มเติม หรือศูนย์บริการลูกค้า Call Center โทร. 098-162-6161</p>
                <p>ขอบพระคุณที่ใช้บริการ</p>
                <p>ขอแสดงความนับถือ</p>
                <p>Order Hub</p>`,
                attachments: [
                    {
                        filename: excelFile.originalname,
                        path: excelFile.path
                    },{
                        filename: 'unnamed.jpg',
                        path: imagePath,
                        cid: 'imageCid' // same cid value as in the html img src
                    }
                ],
                headers: {
                    'Message-ID': messageId,
                    'In-Reply-To': '',
                    'References': ''
                }
            };
    
            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send(error);
                }
                console.log('Email sent:', info.response);

                deleteUploadedExcel(excelFile.path);

                res.status(200).send('Email sent successfully');
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error processing files');
        }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
getAll = async (req, res)=>{
    try{
        const findAll = await profitPartner.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false ,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumForMe = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findMe = await profitPartner.find({wallet_owner:id, status:"เงินเข้า"})
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    data:findMe,
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getProfitPartner = async (req, res)=>{
    try{
        const wallet_owner = req.body.wallet_owner
        const orderer = req.body.orderer
        const shop_number = req.body.shop_number
        const express = req.body.express
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        let findMe = []
        if(!day_start && !day_end){
            if(wallet_owner){
                if(!orderer){
                    if(!express && !shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(1.1)"})
                            }
                    }else if(express && shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            shop_number:shop_number
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(1.2)"})
                            }
                    }else if(express){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(1.3)"})
                            }
                    }else if(shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            shop_number:shop_number
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(1.4)"})
                            }
                    }
                }else if(orderer){
                    if(!express && !shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            Orderer:orderer
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(2.1)"})
                            }
                    }else if(express && shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            shop_number:shop_number, 
                            Orderer:orderer
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(2.2)"})
                            }
                    }else if(express){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            Orderer:orderer
                        })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(2.3)"})
                            }
                    }else if(shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            shop_number:shop_number, 
                            Orderer:orderer
                            })
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(2.4)"})
                            }
                    }
                }
            }else if(orderer){
                if(!express && !shop_number){
                    findMe = await profitPartner.find({Orderer:orderer})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(5)"})
                        }
                }else if(express && shop_number){
                    findMe = await profitPartner.find({Orderer:orderer, express:express, shop_number:shop_number})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(6)"})
                        }
                }else if(express){
                    findMe = await profitPartner.find({Orderer:orderer, express:express})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(7)"})
                        }
                }else if(shop_number){
                    findMe = await profitPartner.find({Orderer:orderer, shop_number:shop_number})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(8)"})
                        }
                }
            }else if(shop_number){
                if(!express){
                    findMe = await profitPartner.find({shop_number:shop_number})
                    if(findMe.length == 0){
                        return res
                                .status(200)
                                .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(9)"})
                    }
                }else if(express){
                    findMe = await profitPartner.find({shop_number:shop_number, express:express})
                    if(findMe.length == 0){
                        return res
                                .status(200)
                                .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(10)"})
                    }
                }
            }else if(express){
                findMe = await profitPartner.find({express:express})
                if(findMe.length == 0){
                    return res
                            .status(200)
                            .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(11)"})
                }
            }
        }else if(day_start && day_end){
            if(wallet_owner){
                if(!orderer){
                    if(!express && !shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(12.1)"})
                            }
                    }else if(express && shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            shop_number:shop_number, 
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(12.2)"})
                            }
                    }else if(express){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(12.3)"})
                            }
                    }else if(shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            shop_number:shop_number, 
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(12.4)"})
                            }
                    }
                }else if(orderer){
                    if(!express && !shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            Orderer:orderer,
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(13.1)"})
                            }
                    }else if(express && shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            shop_number:shop_number, 
                            Orderer:orderer,
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(13.2)"})
                            }
                    }else if(express){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            express:express, 
                            Orderer:orderer,
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(13.3)"})
                            }
                    }else if(shop_number){
                        findMe = await profitPartner.find({
                            wallet_owner:wallet_owner, 
                            shop_number:shop_number, 
                            Orderer:orderer,
                            day:{
                                $gte:day_start, 
                                $lte:day_end
                            }})
                            if(findMe.length == 0){
                                return res
                                        .status(200)
                                        .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(13.4)"})
                            }
                    }
                }
            }else if(orderer){
                if(!express && !shop_number){
                    findMe = await profitPartner.find({
                        Orderer:orderer, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(16)"})
                        }
                }else if(express && shop_number){
                    findMe = await profitPartner.find({
                        Orderer:orderer, 
                        express:express, 
                        shop_number:shop_number, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(17)"})
                        }
                }else if(express){
                    findMe = await profitPartner.find({
                        Orderer:orderer, 
                        express:express, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(18)"})
                        }
                }else if(shop_number){
                    findMe = await profitPartner.find({
                        Orderer:orderer, 
                        shop_number:shop_number, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }})
                        if(findMe.length == 0){
                            return res
                                    .status(200)
                                    .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(19)"})
                        }
                }
            }else if(shop_number){
                if(!express){
                    findMe = await profitPartner.find({
                        shop_number:shop_number, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                    if(findMe.length == 0){
                        return res
                                .status(200)
                                .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(20)"})
                    }
                }else if(express){
                    findMe = await profitPartner.find({
                        shop_number:shop_number, 
                        express:express, 
                        day:{
                            $gte:day_start, 
                            $lte:day_end
                        }
                    })
                    if(findMe.length == 0){
                        return res
                                .status(200)
                                .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(21)"})
                    }
                }
                
            }else if(express){
                findMe = await profitPartner.find({
                    express:express, 
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }})
                if(findMe.length == 0){
                    return res
                            .status(200)
                            .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(22)"})
                }
            }else{
                findMe = await profitPartner.find({
                    day:{
                        $gte:day_start, 
                        $lte:day_end
                    }
                })
                if(findMe.length == 0){
                    return res
                            .status(200)
                            .send({status:false, data:[], message:"ไม่มีข้อมูลนี้ในระบบ(23)"})
                }
            }
        }else{
            return res
                    .status(200)
                    .send({status:false, data:[]})
        }
        return res
                .status(200)
                .send({status:true, data:findMe})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

Withdrawal = async (req, res)=>{
    try{
        const idBank = req.params.id
        const id = req.decoded.userid
        const amount = req.body.amount
            if (!amount || isNaN(amount) || amount < 0) { //เช็คว่าค่า amount ที่ user กรอกเข้ามา มีค่า ลบ หรือไม่ เช่น -200
                return res
                        .status(400)
                        .send({ status: false, message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" });
            }else if (!/^(\d+(\.\d{1,2})?)$/.test(amount.toString())){ //เช็คทศนิยมไม่เกิน 2 ตำแหน่ง
                return res
                        .status(400)
                        .send({ status: false, message: "กรุณาระบุจำนวนเงินที่มีทศนิยมไม่เกิน 2 ตำแหน่ง" });
            }

        let flashPay
        const findPartner = await Partner.findOne({_id:id})
            if (!findPartner) {
                return res
                        .status(404)
                        .send({ status: false, message: "ไม่มีพาร์ทเนอร์ที่ท่านตามหา" });
            }else if(findPartner.credits == 0){
                return res
                        .status(400)
                        .send({status: false, message:"ท่านไม่สามารถถอนเงินได้"})
            }else if(findPartner.credits < amount){
                return res
                        .status(400)
                        .send({status: false, message:"จำนวนเงินที่ท่านกรอกมากกว่า credits ของท่าน"})
            } else {
                    const result = await bankRecord.findOne({ ID: id }); // หาเอกสารที่มี ID เท่ากับ id

                    if (result) {
                        flashPay = result.flash_pay.find(item => item._id.toString() === idBank); // ค้นหา flash_pay ที่มี _id เท่ากับ idBank
                        if (flashPay) {
                            console.log(flashPay); // แสดงข้อมูลทั้งหมดใน Object ที่ตรงกับเงื่อนไข
                        } else {
                            console.log('ไม่พบ flash_pay ที่มี _id เท่ากับ idBank');
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่พบธนาคารที่ท่านระบุ"})
                        }
                    } else {
                        console.log('ไม่พบเอกสารที่มี ID เท่ากับ id');
                        return res
                                    .status(404)
                                    .send({status:false, message:"ไม่พบข้อมูลธนาคารของท่าน(กรุณาสร้างบัญชี Book bank ของท่าน)"})
                    }
                    const orderid = await invoiceNumber(dayjsTimestamp)
                    console.log(orderid)
                    let v = {
                            orderid: orderid,
                            'template.partner_number': findPartner.partnerNumber,
                            'template.account_name':flashPay.name,
                            'template.account_number':flashPay.card_number,
                            'template.bank':flashPay.aka,
                            'template.amount':amount,
                            'template.phone_number': findPartner.tel ,
                            'template.email':findPartner.email,
                            type: 'ถอนเงิน'
                    }
                    const createTemplate = await profitTemplate.create(v)
                        if(!createTemplate){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างรายการถอนเงินได้"})
                        }

                    const difProfitPartner = await Partner.findOneAndUpdate(
                        {_id:id},
                        { $inc: { credits: -amount } },
                        {new:true, projection: { credits: 1 }})
                        if(!difProfitPartner){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถลบเงินพาร์ทเนอร์ได้"})
                        }
                    let record = {
                            wallet_owner:id,
                            Orderer:id,
                            role:'partner',
                            shop_number: "-",
                            orderid: orderid,
                            profit: amount,
                            express: "-",
                            type:'ถอนเงิน',
                            status:'รอดำเนินการ'
                    }
                    const profitRecord = await profitPartner.create(record)
                        if(!profitRecord){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถบันทึกการถอนเงินได้"})
                        }
                return res
                        .status(200)
                        .send({
                                status:true,
                                // data: flashPay,
                                profit: createTemplate,
                                diffProfit: difProfitPartner,
                                record: profitRecord
                        })
            }

    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getCod = async(req, res)=>{
    try{
        const status = req.body.status
        let findCod
        if(status){
            findCod = await profitTemplate.find({status:status})
                if(findCod.length == 0){
                    return res
                            .status(200)
                            .send({status:false ,data:[]})
                }
        }else{
            findCod = await profitTemplate.find()
                if(!findCod){
                    return res
                            .status(200)
                            .send({status:false ,data:[]})
                }
        }
    return res
            .status(200)
            .send({status:true, data:findCod})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

changStatus = async (req, res)=>{
    try{
        const orderids = req.body.orderid
        const status = req.body.status
        const code = await invoiceNumber(dayTime)

        // ตรวจสอบว่าทุก orderid มี status เป็น "เซ็นรับแล้ว" หรือไม่
        // const allSign = await Promise.all(orderids.map(async item => {
        //     const order = await profitTemplate.findOne({ orderid: item });
        //     // console.log(order)
        //     return order && order.status == "เซ็นรับแล้ว";
        // }));
        // console.log(allSign)
        // const allSigned = allSign.every(status => status);

        // if (allSigned) {
            let orderBulk = orderids.map(item=>({
                updateOne:{
                    filter:{ orderid : item },
                    update: { 
                        $set: {
                            status:status,
                            code:code
                        }
                }
            }}))
            const bulkOrder = await profitTemplate.bulkWrite(orderBulk)
            return res
                    .status(200)
                    .send({status:true, 
                        data:bulkOrder,
                        code:code
                    })
        // }else{
        //     return res
        //             .status(400)
        //             .send({status:false, message:"ออเดอร์ของท่านยังไม่ได้รับการเซ็นรับ"})
        // }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

calCod = async(req, res)=>{ //เช็คจำนวนผู้เซ็นรับแล้ว กับ excel ของ J&T ที่คุณไอซ์ได้รับมา
    try{
        const data = [] //ใส่ รหัส order ของ J&T ทั้งหมดใน excel ที่เป็นรหัสร้านเรา โดยเอามาจากการแปลงเป็น JSON จากเว็ป https://jsoneditoronline.org/#right=local.reqiza&left=local.xocoru
        let findThere = [];
            console.log(data.length);
            try {
                const newData = await Promise.all(data.map(async item => {
                    try {
                        const findByOrderid = await profitTemplate.findOne({ orderid: item });
                        if (!findByOrderid) {
                            console.log(item);
                            return item;
                        } else {
                            // console.log(findByOrderid);
                            findThere.push(findByOrderid);
                        }
                    } catch (error) {
                        // Handle error here
                        console.error("Error occurred:", error);
                        throw error;
                    }
                }));
            
                // รอให้ Promise.all() เสร็จสิ้นและทำการประมวลผลข้อมูลต่อไป
                console.log(findThere.length);
                return res.status(200).send({ status: false, data: findThere });
            } catch (error) {
                // Handle error here
                console.error("Error occurred:", error);
                return res.status(500).send({ error: "Internal Server Error" });
            }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getSignDay = async(req, res)=>{
    try{
        const day = req.body.day
        const status = req.body.status
        const findTemplate = await profitTemplate.find({status:status, day_sign:day})
            if(findTemplate.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:`ไม่พบข้อมูลการเซ็นรับในที่ ${day}`})
            }
        const totalAmount = findTemplate.reduce((accumulator, currentItem) =>{
            // ตรวจสอบว่า currentItem.template.amount มีค่าหรือไม่
            if (currentItem.template && currentItem.template.amount) {
                // ถ้ามีให้เพิ่มค่า amount เข้ากับ accumulator
                return accumulator + currentItem.template.amount;
            } else {
                // ถ้าไม่มีให้คืนค่าเดิมของ accumulator
                return accumulator;
            }
        }, 0)
        return res
                .status(200)
                .send({
                    status:true, 
                    length:findTemplate.length,
                    total: totalAmount,
                    data:findTemplate})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getDayPay = async(req, res)=>{
    try{
        const day = req.body.day
        const partner_id = req.body.partner_id
        const express = req.body.express
        if(express){
            if(partner_id){
                const data = await profitTemplate.find({
                    owner_id: partner_id,
                    day_sign: { $regex: new RegExp('^' + day) },
                    express:express
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }else{
                const data = await profitTemplate.find({ 
                        day_sign: { $regex: new RegExp('^' + day) },
                        express:express
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }
        }else if(express == "SHIPPOP"){
            if(partner_id){
                const data = await profitTemplate.find({
                    owner_id: partner_id,
                    day_sign: { $regex: new RegExp('^' + day) },
                    express:{ $regex:"SHIPPOP" }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }else{
                const data = await profitTemplate.find({ 
                        day_sign: { $regex: new RegExp('^' + day) },
                        express:{ $regex:"SHIPPOP" }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }
        }else{
            return res
                    .status(200)
                    .send({status:true, message:[]})
        }
        
    }catch(err){
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

getDayPayActive = async(req, res)=>{
    try{
        const day = req.body.day
        const partner_id = req.body.partner_id
        const express = req.body.express
        if(express == "J&T"){
            if(partner_id){
                const data = await profitTemplate.find({
                    owner_id: partner_id,
                    day_sign: { $regex: new RegExp('^' + day) },
                    express:"J&T",
                    day_pick: {
                        $not: {
                            $gte: "2024-10-03 00:00:00",
                            $lte: "2024-10-08 23:59:59"
                        }
                    }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }else{
                const data = await profitTemplate.find({ 
                        day_sign: { $regex: new RegExp('^' + day) },
                        express:"J&T"
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }
        }else if(express == "SHIPPOP"){
            if(partner_id){
                const data = await profitTemplate.find({
                    owner_id: partner_id,
                    day_sign: { $regex: new RegExp('^' + day) },
                    express:{ $regex:"SHIPPOP" }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }else{
                const data = await profitTemplate.find({ 
                        day_sign: { $regex: new RegExp('^' + day) },
                        express:{ $regex:"SHIPPOP" }
                })
                    if(data.length == 0){
                        return res
                                .status(200)
                                .send({status:true, message:[]})
                    }
                return res
                        .status(200)
                        .send({status:true, data: data})
            }
        }else{
            return res
                    .status(200)
                    .send({status:true, message:[]})
        }
        
    }catch(err){
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

updateCancelCod = async(req, res)=>{
    try{
        const orderId = req.body.orderId
        let count = orderId.map(item => ({
            updateOne: {
                filter: { orderid: item },
                update: { 
                    $set: {
                        status:"ระงับการโอน"
                    }
                }
            }
        }))

        const chunks = chunkArray(count, 10);
        let pushArr = []
        for (const chunk of chunks) {
            // ทำ bulkWrite สำหรับแต่ละ chunk และรอจนทำเสร็จ
            let ggez = await profitTemplate.bulkWrite(chunk);
            pushArr.push(ggez)
        }

        return res
                .status(200)
                .send({status:true,message:"อัพเดทระงับการโอนเรียบร้อย",data:pushArr})

    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

// ฟังก์ชันสำหรับแบ่ง array ออกเป็นกลุ่ม (chunk)
function chunkArray(array, size){
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function invoiceNumber(date) {
    data = `${dayjs(date).format("YYYYMMDD")}`
    let random = Math.floor(Math.random() * 1000000)
    const combinedData = `COD`+data + random;
    const findInvoice = await profitTemplate.find({code:combinedData})

    while (findInvoice && findInvoice.length > 0) {
        // สุ่ม random ใหม่
        random = Math.floor(Math.random() * 1000000);
        combinedData = `COD`+data + random;

        // เช็คใหม่
        findInvoice = await profitTemplate.find({code: combinedData});
    }

    // console.log(combinedData);
    return combinedData;
}

module.exports = { getAll, getSignDay, calCod, getSumForMe, Withdrawal, changStatus, getCod, calCod, getDayPay, sendEmail, uploadFileExcel, getProfitPartner, updateCancelCod }