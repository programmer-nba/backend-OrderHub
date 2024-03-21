const { Admin } = require("../../Models/admin");
const { Partner } = require("../../Models/partner");
const { memberShop } = require("../../Models/shop/member_shop");
const { shopPartner } = require("../../Models/shop/shop_partner");
var bcrypt = require("bcrypt");

create = async (req, res)=>{
    try{
        const user = req.body.username
        const findPartner = await Partner.findOne({username:user})
        if(findPartner){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้ User ID นี้แล้ว"})
        }
        const findAdmin = await Admin.findOne({username:user})
        if(findAdmin){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้ User ID นี้แล้ว"})
        }
        const findMemberShop = await memberShop.findOne({username:user})
        if(findMemberShop){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้ User ID นี้แล้ว"})
        }
        const findIden = await memberShop.findOne({iden_number:req.body.iden_number})
        if(findIden){
            return res
                    .status(400)
                    .send({status:false, message:"มีผู้ใช้บัตรประชาชนนี้แล้ว"})
        }
        const findShop = await shopPartner.findOne({shop_number:req.body.shop_number})
        if(findShop){
            const data = {
                ...req.body,
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
        console.log(req.decoded.id)
        const id = req.decoded.userid
        const findMe = await memberShop.findOne({_id:id})
        if(findMe){
            return res
                    .status(200)
                    .send({status:true, data:findMe})
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

module.exports = { create, getAll, update, getMe, delend, getByID }