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
        if(req.body.statusOne !== "false"){
            const fixStatus = await Partner.findOneAndUpdate({_id:id},{status_partner:"รออนุมัติ"},{new:true})
            console.log(fixStatus.status_partner)
        }
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
    }  catch (err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

getContractByID = async (req,res)=>{
    try{
        const partnerId = req.params.id
        const find = await statusContract.findOne({partnerID:partnerId})
        if (find){
            return res
                    .status(200)
                    .send({status:true, data:find})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มี Partner ID นี้"})
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
    
}
module.exports = { twoContract, getContractByID };