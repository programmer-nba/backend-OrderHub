const { PercentCourier, validate } = require("../../../Models/Delivery/ship_pop/percent");
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
                return res
                        .status(201)
                        .send({status:true, 
                            message: "เพิ่มข้อมูลสำเร็จ", 
                            data: percent,
                            update: update
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
            return res
                    .status(200)
                    .send({
                        status: true, 
                        message: "ลบข้อมูลสำเร็จ",
                        del:percent,
                        delShop: update
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

module.exports = { create, getAll, getById, update, delend }