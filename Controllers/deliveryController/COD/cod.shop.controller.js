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
        const id = req.params.id
        const express_id = req.body.express_id
        const express = req.body.express
        const percent = req.body.percent

        const update = await codPercent.findOneAndUpdate(
            {
                shop_id:id
            },
            {
                "express.$[element].express":express,
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