const { priceWeight } = require("../../../Models/Delivery/J&T/priceWeight");

createWeight = async(req, res)=>{
    try{
        const weight = req.body.weight
        const price = req.body.price
        const findWeight = await priceWeight.findOne({weight: weight})
            if(findWeight){
                return res
                        .status(400)
                        .send({status:false, message:"มีน้ำหนักนี้ในระบบแล้ว"})
            }
        const create = await priceWeight.create(
            {
                weight: weight,
                price: price
            }
        )
            if(!create){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data: create})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}


module.exports = { createWeight }