require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.checkToken = async(req, res, next)=>{
    try{
        let token = req.headers["auth-token"]; 
        if (token){
            token = token.replace(/^Bearer\s+/, "");
            jwt.verify(token, process.env.JWTPRIVATEKEY, (err, decoded)=>{
                if (err){
                    return res
                        .status(400)
                        .json({
                            status:false,
                            success: false,
                            message: "หมดเวลาใช้งาน(TOKEN EXPIRED)", //Token หมดอายุ
                            logout: true,
                            description: "Request Timeout"
                    })
                }
                req.decoded = decoded
                // console.log(decoded)//log decoded ออกมาได้แสดงว่าใช้ได้
                if(decoded.role !== "admin"){
                    return res
                        .status(400)
                        .json({
                            status:false,
                            success: false,
                            message: "ไม่มีสิทธิใช้งานฟังก์ชั่นนี้",
                            logout: true,
                            description: "Unauthorized",
                        });
                }
                next();
            })
        } else { 
            return res
                .status(400)
                .json({
                    status:false,
                    success: false,
                    message: "กรุณากรอก TOKEN(Token not provided Token)", //Token ไม่ถูกต้อง
                    logout: false,
                    description: "Unauthorized"
                })
        }
    } catch(err){
        console.log(err)
        return res
            .status(500)
            .send({status:false, message: "TOKEN หมดอายุ(500)"})
    }
}
//module.exports =  checkToken 