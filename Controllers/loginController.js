const bcrypt = require('bcrypt')
var jwt = require("jsonwebtoken");
const { Partner } = require("../Models/partner");

loginController = async(req,res) =>{
    try{
        const UserID = req.body.username //รับ UserId ที่ User กรอกมา
        const Password = req.body.password //รับ Password ที่ User กรอกมา
        Partner.findOne({username:UserID}).then((Partner)=>{
            if(Partner){
                let cmp = bcrypt.compare(Password, Partner.password).then((match)=>{
                    console.log(match)
                    if(match){
                        const secretKey = process.env.JWTPRIVATEKEY
                        const payload = {
                            user_id: Partner.employee_number,
                            email: Partner.email,
                            role: Partner.role
                        }
                        const token = jwt.sign(payload, secretKey, { expiresIn: '90 years'})
                        return res
                                .status(200)
                                .send({status:true,
                                    message:"เข้าสู่ระบบสำเร็จ",
                                    token: token,
                                    employee_id: Partner._id,
                                    iden_number: Partner.iden_number,
                                    firstname: Partner.firstname,
                                    lastname: Partner.lastname,
                                    role: Partner.role,
                                })
                    }else{
                        return res
                                .status(400)
                                .send({status:false,
                                    message:"รหัสผิดพลาด",})
                    }
                })
            } else {
                res
                .status(400)
                .send({status:false,
                    message: "ไม่มีบัญชีที่ท่านใช้"})
            }
        })
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}
module.exports = { loginController };
