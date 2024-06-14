const { Admin } = require("../../Models/admin");
const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { shopPartner } = require("../../Models/shop/shop_partner");
var bcrypt = require("bcrypt");

create = async (req, res)=>{
    try{
        const user = req.body.username;
        const idenNumber = req.body.iden_number;
        
        const findUser = await Promise.all([
            Partner.findOne({username: user}),
            Admin.findOne({username: user}),
            memberShop.findOne({
                $or: [
                    {username: user},
                    {iden_number: idenNumber}
                ]
            })
        ]);

        if (findUser.some(user => user)) {
            return res
                .status(400)
                .send({status: false, message: "มีผู้ใช้ User ID นี้แล้ว หรือมีผู้ใช้บัตรประชาชนนี้แล้ว"});
        }

        const findShop = await shopPartner.findById(id)
        if(findShop){
            const data = {
                ...req.body,
                shop_id:findShop._id,
                shop_number:findShop.shop_number,
                id_ownerShop:findShop.partnerID,
                shop_name:findShop.shop_name
            }
            const create = await memberShop.create(data)
            return res
                    .status(200)
                    .send({status:false, data:create})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่พบรหัสร้านค้าของท่าน"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getAll = async (req, res)=>{
    try{
        const getAll = await memberShop.find()
        if(getAll){
            return res
                    .status(200)
                    .send({status:true, data:getAll})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

update = async (req, res)=>{
    try{
        const upID = req.params.id; //รับไอดีที่ต้องการอัพเดท
        if(!req.body.password){ //กรณีที่ไม่ได้ยิง password
          memberShop.findByIdAndUpdate(upID,req.body, {new:true}).then((data) =>{
            if (!data) {
              res
                .status(400)
                .send({status:false, message: "ไม่สามารถแก้ไขผู้ใช้งานได้"})
            }else {
              res
                .status(200)
                .send({status:true, message: "อัพเดทข้อมูลแล้ว",data: data})
            }
          })
          .catch((err)=>{
                res
                    .status(500)
                    .send({status: false, message: "มีบางอย่างผิดพลาด"})
        })
        } else { //กรณีที่ได้ยิง password
            const salt = await bcrypt.genSalt(Number(process.env.SALT));
            const hashPassword = await bcrypt.hash(req.body.password, salt);
            const updateMember = await memberShop.findByIdAndUpdate(upID, {...req.body,password: hashPassword}, {new:true}); //หา id ที่ต้องการจากนั้นทำการอัพเดท
        if(updateMember){
            return res
                    .status(200)
                    .send({status: true, data: updateMember})
        } else {
            return res
                    .status(400)
                    .send({ status: false, message: " อัพเดทข้อมูลไม่สำเร็จ" });
        }
      }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getMe = async (req, res)=>{
    try{
        // console.log(req.decoded.id)
        const id = req.decoded.userid
        const findMe = await memberShop.findOne({_id:id})
        if(findMe){
            const findShop = await shopPartner.findById(findMe.shop_id)
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่พบร้านค้า"})
                }
            return res
                    .status(200)
                    .send({status:true, data:findMe, shop:findShop})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่มีไอดีอยู่ในระบบ"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

delend = async (req, res)=>{
    try{
        const id = req.params.id
        const del = await memberShop.findByIdAndDelete(id)
        if(del){
            return res
                    .status(200)
                    .send({status:true, delete:del})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่พบไอดีที่ท่านต้องการลบ"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

getByID = async (req,res)=>{
    try{
        const getid = req.params.id
        console.log(getid)
        const findId = await memberShop.findById(getid)
        if(findId){
            return res 
                    .status(200)
                    .send({ status: true, data: findId})
        }else{
            return res
                    .status(400)
                    .send({ status: false, message: "ดึงข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

getMemberPartner = async (req, res)=>{
    try{
        const getAllResult = await memberShop.find().lean();
        const getPartnerResult = await Partner.find().lean();

        if (getAllResult && getPartnerResult) {
            let data = []
            data = data.concat(getPartnerResult, getAllResult)
            return res.status(200).send({ status: true, data: data });
        } else {
            return res.status(404).send({ status: false, message: "ไม่มีข้อมูลในระบบ" });
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
    }
}

getMemberAndPartner = async (req, res)=>{
    try{
        const shop_number = req.body.shop_number
        let result = []
        const getAllResult = await memberShop.find({shop_number:shop_number},{_id:1,firstname:1,lastname:1,role:1}).exec()
            if(getAllResult.length == 0){
                const getShop = await shopPartner.findOne({shop_number:shop_number},{partnerID:1,firstname:1,lastname:1}).exec()
                    if(!getShop){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่พบร้านค้าที่ต้องการ"})
                    }
                const partnerData = [{
                        _id: getShop.partnerID,
                        firstname: getShop.firstname,
                        lastname: getShop.lastname,
                        role: "partner"
                }];
                return res
                        .status(200)
                        .send({status:true, data:partnerData})
            }
        const getPartnerResult = await shopPartner.findOne({shop_number:shop_number},{partnerID:1,firstname:1,lastname:1}).exec()
            if(!getPartnerResult){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลพาร์ทเนอร์"})
            }
        
        // แปลง partnerID เป็น _id
        const partnerData = {
            _id: getPartnerResult.partnerID,
            firstname: getPartnerResult.firstname,
            lastname: getPartnerResult.lastname,
            role: "partner"
        };
        // รวมผลลัพธ์จาก getAllResult และ getPartnerResult
        result = result.concat(partnerData, getAllResult);

        return res
            .status(200)
            .send({ status: true, data: result });// รวมผลลัพธ์จาก getAllResult และ getPartnerResult
  
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}
module.exports = { create, getAll, update, getMe, delend, getByID, getMemberPartner,getMemberAndPartner }