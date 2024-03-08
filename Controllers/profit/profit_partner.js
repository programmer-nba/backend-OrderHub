const { profitPartner } = require("../../Models/profit/profit.partner");

getAll = async (req, res)=>{
    try{
        const findAll = await profitPartner.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false ,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumForMe = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const findMe = await profitPartner.find({shop_owner:id, status:"พร้อมถอน"})
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        const totalProfit = findMe.reduce((total, document) => total + document.profit, 0);
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    data:findMe,
                    sum:totalProfit
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, getSumForMe }