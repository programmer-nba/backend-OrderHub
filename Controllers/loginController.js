const bcrypt = require('bcrypt')
var jwt = require("jsonwebtoken");
const { Partner } = require("../Models/partner");
const { Admin } = require('../Models/admin');
const { memberShop } = require('../Models/shop/member_shop');

loginController = async(req,res) =>{
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        Partner.findOne({username:UserID}).then(async (Partner)=>{
            if(Partner){
                if(Partner.status_partner == "blacklist"){
                    return res
                            .status(400)
                            .send({status:false, message:"Partner blacklist!"})
                }
                let cmp = await bcrypt.compare(Password, Partner.password).then((match)=>{
                    console.log(match)
                    if(match){
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            userid: Partner._id,
                            firstname: Partner.firstname,
                            email: Partner.email,
                            role: Partner.role,
                            status: Partner.status_partner
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '90 years'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    partners_id: Partner._id,
                                    firstname: Partner.firstname,
                                    lastname: Partner.lastname,
                                    role: Partner.role,
                                    status: Partner.status_partner
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
        Admin.findOne({username:UserID}).then(async (Admin)=>{
            if(Admin){
                let cmp = await bcrypt.compare(Password, Admin.password).then((match)=>{
                    console.log(match)
                    if(match){
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            id: Admin._id,
                            username: Admin.username,
                            firstname: Admin.firstname,
                            lastname: Admin.lastname,
                            role: Admin.role
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '90 years'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    id: Admin._id,
                                    username: Admin.username,
                                    firstname: Admin.firstname,
                                    lastname: Admin.lastname,
                                    role: Admin.role
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
        memberShop.findOne({username:UserID}).then(async (memberShop)=>{
            if(memberShop){
                let cmp = await bcrypt.compare(Password, memberShop.password).then((match)=>{
                    console.log(match)
                    if(match){
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            id: memberShop._id,
                            memberNumber: memberShop.member_number,
                            username: memberShop.username,
                            shop_number: memberShop.shop_number,
                            role: memberShop.role
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '90 years'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    id: memberShop._id,
                                    memberNumber: memberShop.member_number,
                                    username: memberShop.username,
                                    shop_number: memberShop.shop_number,
                                    role: memberShop.role
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

module.exports = { loginController };
