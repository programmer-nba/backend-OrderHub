const { priceWeight } = require("../../../Models/Delivery/J&T/priceWeight");

createWeight = async(req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const weight = req.body.weight
        const price = req.body.price
        const findWeight = await priceWeight.findOne(
            {
                id_shop: id_shop,
                weight: weight
            })
            if(findWeight){
                return res
                        .status(400)
                        .send({status:false, message:"มีน้ำหนักนี้ในระบบแล้ว"})
            }
        const create = await priceWeight.create(
            {   
                id_shop: id_shop,
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

editWeight = async (req, res)=>{
    try{
        const id_weight = req.params.id_weight
        const { weight, price} = req.body
        const edit = await priceWeight.findOneAndUpdate(
            {
                _id: id_weight
            },
            {
                weight:weight,
                price:price
            },
            {new:true})
            if(!edit){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถแก้ไขได้"})
            }
        return res
                .status(200)
                .send({status:true, data:edit})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getAll = async(req, res)=>{
    try{
        const findAll = await priceWeight.find()
            if(!findAll){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาได้"})
            }
        return res 
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getWeightShop = async(req, res)=>{
    try{
        const id_shop = req.params.id_shop
        const findWeight = await priceWeight.find({id_shop:id_shop})
            if(!findWeight){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาน้ำหนักของร้านค้านี้เจอ"})
            }
        return res
                .status(200)
                .send({status:true, data:findWeight})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
delend = async (req, res)=>{
    try{
        const id = req.params.id
        const del = await priceWeight.findByIdAndDelete({_id:id})
            if(!del){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบได้"})
            }
        return res
                .status(200)
                .send({status:true, data:del})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
module.exports = { createWeight, editWeight, getAll, delend, getWeightShop }