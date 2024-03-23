const { costPlus } = require("../../Models/costPlus");

create = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const Data = {
            partnerID: id,
            cost_level:[
                {
                    level:req.body.level,
                    cost_plus: req.body.cost_plus
                }
            ]
        }
        const findPartner = await costPlus.findOne({partnerID:id})
        if(findPartner){
            return res
                    .status(400)
                    .send({status:false, message:"มีบัญชีในระบบแล้ว"})
        }

        const createData = await costPlus.create(Data)
        if(createData){
            return res
                    .status(200)
                    .send({status:true, data:createData})
        }else{
            return res
                    .status(400)
                    .send({status:false, message:"ไม่สามารถสร้างได้"})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}

editCostPlus = async (req, res)=>{
    try{
        const partnerNumber = req.decoded.number
        const cost_plus = req.body.cost_plus
        const fixCost = await costPlus.findOneAndUpdate(
            { partner_number:partnerNumber, 'cost_level.level': '1' },
            { $set: { 'cost_level.$.cost_plus': cost_plus } },
            { new: true }
        );
        if(!fixCost){
            return res
                    .status(400)
                    .send({status:true, message:"ท่านไม่สามารถแก้ไขส่วนต่างได้เพราะท่านเป็นสมาชิกของ Partner ท่านอื่น"})
        }else{
            return res
                    .status(200)
                    .send({status:true, data:fixCost})
        }
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

getUplineById = async (req, res)=>{
    try{
        const id = req.params.id
        const findPartner = await costPlus.findOne({_id:id})
            if(!findPartner){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาพาร์ทเนอร์เจอ"})
            }
        return res
                .status(200)
                .send({status:true, data:findPartner})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

module.exports = { create, editCostPlus, getUplineById }