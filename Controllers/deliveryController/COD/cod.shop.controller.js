const { codExpress } = require("../../../Models/COD/cod.model");
const { codPercent } = require("../../../Models/COD/cod.shop.model");
const { shopPartner } = require("../../../Models/shop/shop_partner");

createCod = async(req, res)=>{//create ทุกร้านค้าที่ยังไม่ได้สร้างข้อมูล cod_percent ของตนเองใน collection cod_percents โดยเทียบกับ _id ของแต่ละ shop
    try{
        const createShop = await shopPartner.find()
            if(createShop.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูลร้านค้า"})
            }
        const percent = await codPercent.find()
            if(percent.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล COD ร้านค้า"})
            }
        const codBase = await codExpress.find()
            if(codBase.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล Express COD"})
            }
        const createAll = []
        for(const shop of createShop){
            const p = percent.find((item) => item.shop_id == shop._id)
                if(!p){
                    let v = {
                        shop_id:shop._id,
                        owner_id:shop.partnerID,
                        head_line:shop.upline.head_line,
                        shop_line:shop.upline.shop_line,
                        level:shop.upline.level,
                        express:[]
                    }
                    for (const element of codBase) {
                        v.express.push({
                            express: element.express,
                            percent: element.percent
                        });
                    }
                    const createCod = await codPercent.create(v)
                        if(!createCod){
                            return res
                                    .status(400)
                                    .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                        }
                    createAll.push(createCod)
                }
        }
        return res
                .status(200)
                .send({status:true, data: createAll})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

updateCod = async(req, res)=>{
    try{
        console.log(req.body)
        const id = req.params.id
        const express_id = req.body.express_id
        // const express = req.body.express
        const percent = req.body.percent
        const role = req.decoded.role
        const partner_id = req.decoded.userid
        console.log(role, partner_id)
        const findShop = await codPercent.findOne({shop_id:id})
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่มีร้านค้าที่ท่านต้องการ"})
            }
            if (role != 'admin') {
                if(partner_id != findShop.head_line){
                    return res.status(400).send({
                        status: false,
                        message: "คุณไม่มีสิทธิ์แก้ไขราคาของร้านค้านี้"
                    });
                }
            }
        // console.log(findShop)
        if(findShop.shop_line != 'ICE'){
            const p = findShop.express.find((item)=> item._id.toString() == express_id.toString())
            // console.log(p)
            const findCod = await codPercent.findOne({shop_id:findShop.shop_line})
                if(!findCod){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่พบร้านค้าพ่อข่ายที่ท่านต้องการหา"})
                }
            const findC = findCod.express.find((item)=> item.express == p.express)
            // console.log(findC)
            console.log(findCod)
                if(findC.percent == 0){
                    return res
                            .status(400)
                            .send({status:false, message:`กรุณารอพาร์ทเนอร์ที่แนะนำท่านกรอก %COD ที่ต้องการก่อน`})
                }else if(findC.percent > percent){
                    return res
                            .status(400)
                            .send({status:false, message:"กรุณาอย่าตั้ง %COD ต่ำกว่าพาร์ทเนอร์ที่แนะนำท่าน"})
                }
        }
        
        const update = await codPercent.findOneAndUpdate(
            {
                shop_id:id
            },
            {
                // "express.$[element].express":express,
                "express.$[element].percent":percent
            },
            {
                arrayFilters:[{ 'element._id': express_id }],
                new:true,
            }
        )
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทได้"})
            }
        return res
                .status(200)
                .send({status:true, data:update})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

getShopById = async (req, res)=>{
    try{
        const id = req.params.id
        const findShop = await codPercent.findOne({shop_id:id})
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูลร้านค้า COD"})
            }
        return res
                .status(200)
                .send({status:true, data:findShop})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delById = async(req, res)=>{
    try{
        const id = req.params.id
        const delShop = await codPercent.findByIdAndDelete(id)
            if(!delShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบร้านค้าในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:delShop})
    }catch(err){
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = {createCod, updateCod, getShopById, delById}