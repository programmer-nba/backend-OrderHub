const { priceWeight } = require("../../../Models/Delivery/J&T/priceWeight");
const { shopPartner } = require("../../../Models/shop/shop_partner");

createWeight = async(req, res)=>{
    try{
        let data = {
            weightStart: 0.01,
            weightEnd:0.50,
        }
        let createShow = []
        while (data.weightEnd != 101){
            const create = await priceWeight.create(data)
                if(!create){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างได้"})
                }
            createShow.push(create)

            if(data.weightStart < 0.5){
                data.weightStart = Math.round((data.weightStart + 0.5) * 100) / 100;
                data.weightEnd = Math.round((data.weightEnd + 0.5) * 100) / 100;
                
            }else if(data.weightEnd == 1){
                data.weightStart = 1.01
                data.weightEnd = 2
            }else{
                data.weightStart = Math.round((data.weightStart + 1) * 100) / 100;
                data.weightEnd = Math.round((data.weightEnd + 1) * 100) / 100;
            }
        }
        return res
                .status(200)
                .send({status:true, data:createShow})
        // const id = req.params.id_shop
        // const data = req.body.data
        // // console.log(data)
        // let result
        // const findWeight = await shopPartner.findOne({_id:id})
        //     if(!findWeight){
        //         return res
        //                 .status(400)
        //                 .send({status:false, message:"ค้นหาร้านไม่เจอ"})
        //     }
        // const createWeight = await shopPartner.findOneAndUpdate(
        //     {_id:id},
        //     {
        //         jnt: data
        //     },
        //     {new:true})
        //     if(createWeight){
        //         let dataTwo = [];
        //         let bulkOps = [];
        //         let jnt = createWeight.jnt;
                
        //         for (let i = 0; i < jnt.length; i++){
        //             let dataObject = {
        //                 weightStart: jnt[i].weightStart,
        //                 weightEnd: jnt[i].weightEnd,
        //                 _id: jnt[i]._id // เพิ่ม _id ให้กับ dataObject
        //             };
        //             dataTwo.push(dataObject);
        //         }
        //         // console.log(dataTwo)
        //         const shopDownlineIds = createWeight.upline.shop_downline;

                
        //         bulkOps = shopDownlineIds.map(shopDownlineId => ({
        //                 updateOne: {
        //                     filter: { _id: shopDownlineId },
        //                     update: { jnt: dataTwo }
        //                 }
        //             }));

        //         // ทำ bulkWrite
        //         const result = await shopPartner.bulkWrite(bulkOps);
        //         return res
        //             .status(200)
        //             .send({ status: true, data: result });
                
        //     }else if(!createWeight){
        //         return res
        //                 .status(400)
        //                 .send({status:false, message:"ไม่สามารถอัพเอทข้อมูลได้"})
        //     }
    
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

editWeight = async (req, res)=>{
    try{
        const id_weight = req.params.id_weight
        const edit = await priceWeight.findOneAndUpdate(
            {
                _id: id_weight
            },
            {
                ...req.body
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
        const findWeight = await priceWeight.find()
        const update = await shopPartner.updateMany({
            $push:{
                jnt:findWeight
            }
        })
        return res
                .status(200)
                .send({status:true, data:update})
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