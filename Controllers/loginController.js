const bcrypt = require('bcrypt')
var jwt = require("jsonwebtoken");
const { Partner } = require("../Models/partner");
const { Admin } = require('../Models/admin');
const { memberShop } = require('../Models/shop/member_shop');
const { logSystem } = require('../Models/logs');
const { encrypt, decrypt } = require('../functions/encodeCrypto')

loginController = async(req,res) =>{
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        let ip_address = req.body.ip_address
        let latitude = req.body.latitude
        let longtitude = req.body.longtitude
        if(!ip_address || !latitude || !longtitude){
            ip_address = "0.0.0.0";
            latitude = "0.0.0.0";
            longtitude = "0.0.0.0";
        }
        
        let IP = await encrypt(ip_address)
        let LT = await encrypt(latitude)
        let LG = await encrypt(longtitude)

        Partner.findOne({username:UserID}).then(async (Partner)=>{
            if(Partner){
                if(Partner.status_partner == "blacklist"){
                    return res
                            .status(400)
                            .send({status:false, message:"Partner blacklist!"})
                }
                let cmp = await bcrypt.compare(Password, Partner.password).then(async (match)=>{
                    console.log(match)
                    if(match){
                        const data = {
                            ip_address: ip_address,
                            id: Partner._id,
                            role: Partner.role,
                            type:"login",
                            description: "เข้าสู่ระบบ",
                            latitude: latitude,
                            longtitude: longtitude
                        }
                        const create = await logSystem.create(data)
                            if(!create){        
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
                            }
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            userid: Partner._id,
                            firstname: Partner.firstname,
                            lastname: Partner.lastname,
                            number: Partner.partnerNumber,
                            email: Partner.email,
                            role: Partner.role,
                            status: Partner.status_partner,
                            ip_address: IP,
                            latitude: LT,
                            longtitude: LG
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '10h'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    partners_id: Partner._id,
                                    number: Partner.partnerNumber,
                                    role: Partner.role,
                                    status: Partner.status_partner,
                                    log: create
                                })
                    }else{
                        return res
                                .status(400)
                                .send({status:false,
                                message:"รหัสผิดพลาด",})
                    }
                })
            } else {
                await checkAdmin(req,res);
            }
        })
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

async function checkAdmin(req, res){
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        let ip_address = req.body.ip_address
        let latitude = req.body.latitude
        let longtitude = req.body.longtitude
        if(!ip_address || !latitude || !longtitude){
            ip_address = "0.0.0.0";
            latitude = "0.0.0.0";
            longtitude = "0.0.0.0";
        }
        
        let IP = await encrypt(ip_address)
        let LT = await encrypt(latitude)
        let LG = await encrypt(longtitude)
        Admin.findOne({username:UserID}).then(async (Admin)=>{
            if(Admin){
                let cmp = await bcrypt.compare(Password, Admin.password).then(async (match)=>{
                    console.log(match)
                    if(match){
                        const data = {
                            ip_address: ip_address,
                            id: Admin._id,
                            role: Admin.role,
                            type:"login",
                            description: "เข้าสู่ระบบ",
                            latitude: latitude,
                            longtitude: longtitude
                        }
                        const create = await logSystem.create(data)
                            if(!create){        
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
                            }
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            userid: Admin._id,
                            username: Admin.username,
                            firstname: Admin.firstname,
                            lastname: Admin.lastname,
                            role: Admin.role,
                            ip_address: IP,
                            latitude: LT,
                            longtitude: LG
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '10h' })
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    id: Admin._id,
                                    username: Admin.username,
                                    firstname: Admin.firstname,
                                    lastname: Admin.lastname,
                                    role: Admin.role,
                                    log: create
                                })
                    }else{
                        return res
                                .status(400)
                                .send({status:false,
                                message:"รหัสผิดพลาด",})
                    }
                })
            } else {
                await checkShopMember(req,res);
            }
        })
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

async function checkShopMember(req, res){
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        let ip_address = req.body.ip_address
        let latitude = req.body.latitude
        let longtitude = req.body.longtitude
        if(!ip_address || !latitude || !longtitude){
            ip_address = "0.0.0.0";
            latitude = "0.0.0.0";
            longtitude = "0.0.0.0";
        }
        
        let IP = await encrypt(ip_address)
        let LT = await encrypt(latitude)
        let LG = await encrypt(longtitude)
        memberShop.findOne({username:UserID}).then(async (memberShop)=>{
            if(memberShop){
                let cmp = await bcrypt.compare(Password, memberShop.password).then(async(match)=>{
                    console.log(match)
                    if(match){
                        const data = {
                            ip_address: ip_address,
                            id: memberShop._id,
                            role: memberShop.role,
                            type:"login",
                            description: "เข้าสู่ระบบ",
                            latitude: latitude,
                            longtitude: longtitude
                        }
                        const create = await logSystem.create(data)
                            if(!create){        
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
                            }
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            userid: memberShop._id,
                            id_ownerShop: memberShop.id_ownerShop,
                            username: memberShop.username,
                            number: memberShop.member_number,
                            firstname: memberShop.firstname,
                            lastname: memberShop.lastname,
                            shop_number: memberShop.shop_number,
                            role: memberShop.role,
                            ip_address: IP,
                            latitude: LT,
                            longtitude: LG
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '10h'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    id: memberShop._id,
                                    id_ownerShop: memberShop.id_ownerShop,
                                    memberNumber: memberShop.member_number,
                                    username: memberShop.username,
                                    shop_number: memberShop.shop_number,
                                    role: memberShop.role,
                                    log: create
                                })
                    }else{
                        return res
                                .status(400)
                                .send({status:false,
                                message:"รหัสผิดพลาด",})
                    }
                })
            } else {
                return res
                        .status(400)
                        .send({status:false,
                        message:"ไม่มีบัญชีที่ท่านใช้",})
            }
        })
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

loginToPartner = async (req, res)=>{
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        const passCheck = process.env.PW_PARTNER
        let ip_address = req.body.ip_address
        let latitude = req.body.latitude
        let longtitude = req.body.longtitude
        if(!ip_address || !latitude || !longtitude){
            ip_address = "0.0.0.0";
            latitude = "0.0.0.0";
            longtitude = "0.0.0.0";
        }
        
        let IP = await encrypt(ip_address)
        let LT = await encrypt(latitude)
        let LG = await encrypt(longtitude)

        if(Password != passCheck){
            return res
                    .status(400)
                    .send({
                        status:false,
                        message:"รหัสผิดพลาด",
                    })
        }

        const partner = await Partner.findOne({username:UserID})
        if(partner){
                const data = {
                    ip_address: ip_address,
                    id: partner._id,
                    role: partner.role,
                    type:"login(admin)",
                    description: "แอดมินเข้าสู่ระบบของพาร์ทเนอร์",
                    latitude: latitude,
                    longtitude: longtitude
                }
                const create = await logSystem.create(data)
                    if(!create){        
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
                    }
                const secretKey = process.env.JWTPRIVATEKEY
                const payload = {
                    userid: partner._id,
                    firstname: `${partner.firstname}(admin)`,
                    lastname: `${partner.lastname}(admin)`,
                    number: partner.partnerNumber,
                    email: partner.email,
                    role: partner.role,
                    status: partner.status_partner,
                    ip_address: IP,
                    latitude: LT,
                    longtitude: LG
                }
                const token = jwt.sign(payload, secretKey, { expiresIn: '10h'})
                return res
                        .status(200)
                        .send({status:true,
                            message:"เข้าสู่ระบบสำเร็จ",
                            token: token,
                            partners_id: partner._id,
                            number: partner.partnerNumber,
                            role: partner.role,
                            status: partner.status_partner,
                            log: create
                        })
        }else{
            return res
                    .status(404)
                    .send({
                        status:false,
                        message:"ไม่มีบัญชีที่ท่านใช้"
                    })
        }

    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

loginToGwms = async (req, res)=>{
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        const passCheck = process.env.PW_PARTNER
        let ip_address = req.body.ip_address
        let latitude = req.body.latitude
        let longtitude = req.body.longtitude
        if(!ip_address || !latitude || !longtitude){
            ip_address = "0.0.0.0";
            latitude = "0.0.0.0";
            longtitude = "0.0.0.0";
        }
        
        let IP = await encrypt(ip_address)
        let LT = await encrypt(latitude)
        let LG = await encrypt(longtitude)

        if(Password != passCheck){
            return res
                    .status(400)
                    .send({
                        status:false,
                        message:"รหัสผิดพลาด",
                    })
        }

        const partner = await Partner.findOne({username:UserID})
        if(partner){
                const data = {
                    ip_address: ip_address,
                    id: partner._id,
                    role: partner.role,
                    type:"login(admin)",
                    description: "แอดมินเข้าสู่ระบบของพาร์ทเนอร์",
                    latitude: latitude,
                    longtitude: longtitude
                }
                const create = await logSystem.create(data)
                    if(!create){        
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้าง logs ได้"})
                    }
                const secretKey = process.env.GWMSPRIVATEKEY
                const payload = {
                    userid: partner._id,
                    firstname: `${partner.firstname}`,
                    lastname: `${partner.lastname}`,
                    number: partner.partnerNumber,
                    email: partner.email,
                    role: partner.role,
                    status: partner.status_partner,
                    ip_address: IP,
                    latitude: LT,
                    longtitude: LG
                }
                const token = jwt.sign(payload, secretKey, { expiresIn: '10h'})
                return res
                        .status(200)
                        .send({status:true,
                            message:"เข้าสู่ระบบสำเร็จ",
                            token: token,
                            partners_id: partner._id,
                            number: partner.partnerNumber,
                            role: partner.role,
                            status: partner.status_partner,
                            log: create
                        })
        }else{
            return res
                    .status(404)
                    .send({
                        status:false,
                        message:"ไม่มีบัญชีที่ท่านใช้"
                    })
        }

    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

module.exports = { loginController, loginToPartner, loginToGwms };
