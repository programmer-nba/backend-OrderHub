const { codExpress } = require("../../../Models/COD/cod.model");
const { codPercent } = require("../../../Models/COD/cod.shop.model");
const { PercentCourier, validate } = require("../../../Models/Delivery/ship_pop/percent");
const { priceBase } = require("../../../Models/Delivery/weight/priceBase.express");
const { weightAll } = require("../../../Models/Delivery/weight/weight.all.express");
const { shopPartner } = require("../../../Models/shop/shop_partner");


create = async(req, res)=>{
    try{
        const {error} = validate(req.body);
        if(error){
            return  res
                    .status(400)
                    .send({message : error.details[0].message, status : false});
        }
        const check_courier = await PercentCourier.findOne({courier_code:req.body.courier_code});
        if(check_courier){
            return res
                    .status(400)
                    .send({message: "รหัสคูเรียนี้มีในระบบแล้ว"})
        }
        const percent = await PercentCourier.create(req.body);
            if(percent){
                const update = await shopPartner.updateMany(
                    {
                        $push:{
                            express: percent
                        }
                    })
                const updatePriceBase = await priceBase.create({
                    express:req.body.express,
                    courier_code: req.body.courier_code,
                    courier_name: req.body.courier_name
                })
                    if(!updatePriceBase){
                        return res  
                                .status(400)
                                .send({status:false, message:"สร้างข้อมูลราคาพื้นฐานไม่ได้"})
                    }
                const createCod = await codExpress.create({
                        express : req.body.express,
                        percent : 0,
                        on_off : false
                    })
                    if(!createCod){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถสร้าง COD Base ได้"})
                    }
                const updateCod = await codPercent.updateMany(
                    {
                        $push:{
                            express: { 
                                express : percent.express,
                                percent : 0,
                                on_off : false
                            }
                        }
                    })
                    if(!updateCod){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถอัพเดทได้"})
                    }
                const findShop = await shopPartner.find()
                    if(findShop.length == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่มีข้อมูลร้านค้า"})
                    }
                const findShopWeight = await weightAll.find()
                    if(findShopWeight == 0){
                        return res  
                                .status(400)
                                .send({status:false, message:"ไม่มีร้านค้าที่ท่านต้องการหา"})
                    }

                //ในแต่ละ object เราใช้ Object Destructuring เพื่อดึง _id ออกและใช้ Spread Operator (...rest) เพื่อรวม key ที่เหลืออยู่ใน object ทั้งหมดเข้าไปในตัวแปร rest
                const newWeightData = updatePriceBase.weight.map(({ _id, ...rest }) => rest);

                const weightMap = new Map();
                for (const weight of findShopWeight) {
                    weightMap.set(`${weight.shop_id}-${weight.express}`, weight);
                }

                let new_data = []
                for(const shop of findShop){
                        if(shop.status == "รอแอดมินอนุมัติ"){
                            continue;
                        }
                        // let found = false;

                        // const find = findShopWeight.find((item) => item.shop_id == shop._id && item.express == percent.express)
                        // if(find){
                        //     found = true;
                        // }
                        // for (const weight of findShopWeight) {
                        //     if (weight.shop_id == shop._id && weight.express == percent.express) {
                        //         found = true;
                        //         break;
                        //     }
                        // }

                        // if(!found){
                        //     let v = {
                        //         shop_id:shop._id,
                        //         owner_id:shop.partnerID,
                        //         head_line:shop.upline.head_line,
                        //         shop_line:shop.upline.shop_line,
                        //         express: percent.express,
                        //         level:shop.upline.level,
                        //         weight: newWeightData
                        //     }
                        //     const createWeight = await weightAll.create(v)
                        //         if(!createWeight){
                        //             return res
                        //                     .status(400)
                        //                     .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                        //         }
                        //     new_data.push(createWeight)
                        // }
                        const key = `${shop._id}-${percent.express}`;
                        if (!weightMap.has(key)) {
                            let v = {
                                shop_id: shop._id,
                                owner_id: shop.partnerID,
                                head_line: shop.upline.head_line,
                                shop_line: shop.upline.shop_line,
                                express: percent.express,
                                level: shop.upline.level,
                                weight: newWeightData
                            };
                            const createWeight = await weightAll.create(v);
                            if (!createWeight) {
                                return res.status(400).send({ status: false, message: "ไม่สามารถสร้างข้อมูลได้" });
                            }
                            new_data.push(createWeight);
                        }
                }
                const lengthData = new_data.length;
                return res
                        .status(201)
                        .send({status:true, 
                            message: "เพิ่มข้อมูลสำเร็จ", 
                            data: percent,
                            update: update,
                            pricebase: updatePriceBase,
                            updateCod: updateCod,
                            new: lengthData
                        });
            }else{
                return res
                        .status(401)
                        .send({message : "เพิ่มข้อมูลไม่สำเร็จ กรุณาทำรายอีกครั้ง"})
            }
    }catch(err){
        console.log(err);
        return res
                .status(500)
                .send({message : err._message});
    }
}

getAll = async(req,res) => {
    try{
        const percent = await PercentCourier.find();
        if(percent){
            return res
                    .status(200)
                    .send({status: true, data: percent});
        }else{
            return res
                    .status(400)
                    .send({status: false, message : "ดึงข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res
                .status(500)
                .send({message: err._message})
    }
}

getById = async(req, res)=>{
    try{
        const id = req.params.id;
        const percent = await PercentCourier.findById(id);
        if(percent){
            return res
                    .status(200)
                    .send({status: true, data: percent});
        }else{
            return res
                    .status(400)
                    .send({status:true, message: "ดึงข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res
                .status(500)
                .send({message : err._message});
    }
}

update = async(req, res)=>{
    try{
        const id = req.params.id;
        const percent  = await PercentCourier.findByIdAndUpdate(id,
            {
                costBangkok_metropolitan: req.body.costBangkok_metropolitan,
                costUpcountry: req.body.costUpcountry
            },{new:true});
        if(percent){
            return res
                    .status(200)
                    .send({status: true, data:percent})
        }else{
            return res
                    .status(400)
                    .send({status: false, message : "แก้ไขข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res
                .status(500)
                .send({message: err._message})
    }
}

delend = async(req, res)=>{
    try{
        const id = req.params.id;
        const percent = await PercentCourier.findByIdAndDelete(id);
        if(percent){
            const update = await shopPartner.updateMany(
                { "express.express": percent.express }, // ตรวจสอบว่ามีค่า "NOP" ในอาร์เรย์ express หรือไม่
                { $pull: { "express": { "express": percent.express } } // ลบข้อมูลในอาร์เรย์ที่มีค่า "NOP")
            }) 
            const delCod = await codPercent.updateMany(
                {},
                {
                    $pull: { "express": { "express": percent.express }}
                })
                if(!delCod){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถลบ COD ขนส่งได้"})
                }
            const delCodExpress = await codExpress.findOneAndDelete(
                {
                    express:percent.express
                })
                if(!delCodExpress){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถลบ COD Base ได้"})
                }
            const delWeight = await priceBase.findOneAndDelete(
                {
                    express: percent.express
                })
                if(!delWeight){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถลบราคามาตรฐานได้"})
                }

            const delWeightAll = await weightAll.deleteMany({express:percent.express})
                if(!delWeightAll){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามาลบขนส่ง(all)ได้"})
                }

            return res
                    .status(200)
                    .send({
                        status: true, 
                        message: "ลบข้อมูลสำเร็จ",
                        del:percent,
                        delShop: update,
                        delCOD: delCod,
                        delWeightBase: delWeight,
                        delWeightAll: delWeightAll
                    })
        }else{
            return res
                    .status(400)
                    .send({status: false, message : "ลบข้อมูลไม่สำเร็จ"})
        }
    }catch(err){
        console.log(err);
        return res
                .status(500)
                .send({message: err._message});
    }
}

checkPass = async(req, res)=>{
    try{
        const pass = req.body.password
        if(pass == process.env.PS_ADD_EXPRESS){
            return res
                    .status(200)
                    .send({status: true})
        }else{
            return res
                    .status(400)
                    .send({status: false, message: "รหัสผ่านไม่ถูกต้อง"})
        }
    }catch(err){
        return res
                .status(500)
                .send({status: false, message: err.message})
    }
}

module.exports = { create, getAll, getById, update, delend, checkPass }