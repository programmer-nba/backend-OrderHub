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
        const id = req.decoded.userid //decoded มาจาก token 
        const upStatusOne = req.body.statusOne //สัญญาฉบับที่ 1 ที่ยิงเข้ามา
        const upStatusTwo = req.body.statusTwo //สัญญาฉบับที่ 2 ที่ยิงเข้ามา
        console.log(id)
        if(upStatusOne == "true"){ //ตรวจสอบสถานะของสัญญาฉบับที่ 1 ว่ายิงมาเป็น true(ยอมรับ) หรือไม่ ถ้าไม่ใช่ ให้ทำการเปลี่ยนสถานะของพาร์ทเนอร์เป็น "รออนุมัติ"
            const fixStatus = await Partner.findOneAndUpdate( //ทำการอัพเดทข้อมูล Partner 
                {_id:id}, //เลือก _id ของ Partner ที่ตรงกับ id ที่ทำการ decoded มา
                {status_partner:"รออนุมัติ"}, //update field ของ status_partner เป็นรออนุมัติ
                {new:true}) //ใส่ทุกครั้งที่ทำการ อัพเดท
            console.log(fixStatus.status_partner)
        }else if (upStatusOne == "false") { //ตรวจสอบสถานะของสัญญาฉบับที่ 1 ว่ายิงมาเป็น false(ไม่ยอมรับ) หรือไม่
            const fixStatus = await Partner.findOneAndUpdate( //ทำการอัพเดทข้อมูล Partner 
                {_id:id}, //เลือก _id ของ Partner ที่ตรงกับ id ที่ทำการ decoded มา
                {status_partner:"newpartner"}, //update field ของ status_partner เป็น newpartner
                {new:true}) //ใส่ทุกครั้งที่ทำการ อัพเดท
            console.log(fixStatus.status_partner)
        }else{
            return res
                    .status(400)
                    .send({status: false, message:"กรุณากรอกสัญญาฉบับที่ 1 เป็น true or false เท่านั้น"})
        }
        
        const upContractPartner = await Partner.findOneAndUpdate( //ทำการอัพเดทสถานะสัญญา(contract)ของ partner ใน partnerSchema ให้ตรงกับ upStatusOne และ upStatusTwo ที่ยิงมา
            {_id:id}, //เลือก _id ของ Partner ที่ตรงกับ id ที่ทำการ decoded มา
            {contractOne:upStatusOne, contractTwo:upStatusTwo}, //update field ของ contractOne และ contractTwo
            {new:true}
        )
        const findIdPartner = await Partner.findOne({_id:id}) //ค้นหา id ที่ decoded มาว่ามีใน Partner จริงหรือไม่
        if(findIdPartner){ //มีจริงให้เข้า if ตรงนี้
            const findID = await statusContract.findOne({partnerID:id}) //ค้นหา id ใน field partnerID ของ schemaContract ว่ามีตรงกันหรือไม่
            if(!findID){ //ถ้าไม่มี partnerID ให้ create ข้อมูลใน database ใหม่
                const Contract = await statusContract.create({partnerID: id,...req.body})
                if(Contract){
                    return res
                        .status(200)
                        .send({status:true, Data: Contract,upContractPartner})
                }else{
                return res  
                        .status(200)
                        .send({status:true, message:"สร้างสถานะไม่สำเร็จ"})
                } 
            }else if (findID){ //ถ้ามี partnerID ให้ทำการ Put(UPDATE) ข้อมูลที่มีอยู่แล้วแทน
            const updateContract = await statusContract.findOneAndUpdate( 
                {partnerID:id}, //เทียบ id กับ field partnerID ให้ตรงกัน
                {statusOne:upStatusOne, statusTwo:upStatusTwo}, //อัพเดท field ที่ต้องการ
                {new:true})
            if(updateContract){
                return res
                        .status(200)
                        .send({status:true, Data: updateContract,upContractPartner})
            }else{
                return res
                        .status(200)
                        .send({status:true, message:"อัพเดทไม่สำเร็จ"})
            }
        }
    }else {
        return res
                .status(400)
                .send({status:false, message:"ไม่พบรหัสพาร์ทเนอร์ไอดี"})
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