const { priceWeight } = require("../../../Models/Delivery/J&T/priceWeight");

createWeight = async(req, res)=>{
    try{
        const weight_s = req.body.weight_s
        const weight_e = req.body.weight_e
        const price = req.body.price
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}