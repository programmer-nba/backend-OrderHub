const { statusContract, Validate } = require("../Models/contractPopup");
const jwt = require("jsonwebtoken");
const { Partner } = require("../Models/partner");

twoContract = async (req, res)=>{
    try{
        const {error} = Validate(req.body); //ตรวจสอบความถูกต้องของข้อมูลที่เข้ามา
        if (error){
            return res
                    .status(403)
                    .send({ status: false, message: error.details[0].message });
        }
        const id = req.decoded.userid
        console.log(id)
        const Contract = await statusContract.create({partnerID: id,...req.body})
        if(Contract){
            return res  
                    .status(200)
                    .send({status:true, Data: Contract})
        }else{
            return res  
                    .status(200)
                    .send({status:true, message:"สร้างสถานะไม่สำเร็จ"})
        }
        /*if (req.body.contract == 1){
            if(req.body.status == "false"){
                const oneFalse = await statusContract.create({partnerID: id,...req.body});
                return res
                        .status(400)
                        .send({contract:oneFalse.contract, status:false, message: "สัญญาฉบับที่ 1 ยังไม่มีการยอมรับ",data: oneFalse})
            }else if (req.body.status == "true"){
                const oneTrue = await statusContract.create({partnerID: id,...req.body});
                return res
                        .status(200)
                        .send({contract:oneTrue.contract, status:true, message: "สัญญาฉบับที่ 1 ได้รับการยอมรับแล้ว",data: oneTrue})
            }else {
                return res
                        .status(400)
                        .send({status:false, message: "กรุณากดยอมรับสัญญา"})
            }
        }else if(req.body.contract == 2){
            if(req.body.status == "false"){
                const twoFalse = await statusContract.create({partnerID: id,...req.body});
                return res
                        .status(400)
                        .send({contract:twoFalse.contract, status:false,  message: "สัญญาฉบับที่ 2 ยังไม่มีการยอมรับ",data: twoFalse})
            }else if (req.body.status == "true"){
                const twoTrue = await statusContract.create({partnerID: id,...req.body});
                return res
                        .status(200)
                        .send({contract:twoTrue.contract, status:true, message: "สัญญาฉบับที่ 2 ได้รับการยอมรับแล้ว",data: twoTrue})
            }else {
                return res
                        .status(400)
                        .send({status:false, message: "กรุณากดยอมรับสัญญา"})
            }
        } else {
            return res
                    .status(400)
                    .send({status:false, message: "กรุณาระบุสัญญา 1 หรือ 2"})
        }*/
    }  catch (err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}
module.exports = { twoContract };