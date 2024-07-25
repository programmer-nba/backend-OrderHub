const { kgsearch } = require("googleapis/build/src/apis/kgsearch")
const { priceBase } = require("../../../Models/Delivery/weight/priceBase.express")
const { weightAll } = require("../../../Models/Delivery/weight/weight.all.express")
const { shopPartner } = require("../../../Models/shop/shop_partner")


editWeight = async (req, res)=>{
    try{
        const id = req.params.id
        // console.log(id)
        const express = req.body.express
        const partner_id = req.decoded.userid
        const role = req.decoded.role
        const dataInput = req.body.weight
        
        const findShop = await shopPartner.findOne({_id:id})
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบร้านค้า"})
            }

            if (role != 'admin') {
                if(partner_id != findShop.upline.head_line && partner_id != findShop.upline.down_line){
                    return res.status(400).send({
                        status: false,
                        message: "คุณไม่มีสิทธิ์แก้ไขราคาของร้านค้านี้"
                    });
                }
            }
            // console.log(role)
        const findMe = await weightAll.findOne({shop_id:id, express:express})
            if(!findMe){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาร้านค้าตัวเองไม่เจอ"})
            }else if(findMe.weightMax == 0){
                return res
                        .status(400)
                        .send({status:false, message:"กรุณารอการระบุน้ำหนักที่สามารถใช้งานได้"})
            }

        let weightShop = []

            if(findShop.upline.shop_line != 'ICE'){
                const findWeight = await weightAll.findOne({shop_id:findShop.upline.shop_line, express:express})
                    if(!findWeight){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาตารางน้ำหนักของร้านค้า partner upline ได้"})
                    }
                let add = {
                    weightMax:findMe.weightMax ,
                    weight:findWeight.weight
                }
                // weightShop.push(findMe.weightMax)
                weightShop.push(add)
            }else {
                const findWeightBase = await priceBase.findOne({express:express})
                    if(!findWeightBase){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหาตารางน้ำหนักของร้านค้า partner upline(ICE) ได้"})
                    }
                let add = {
                    weightMax:findMe.weightMax ,
                    weight:findWeightBase.weight
                }
                // weightShop.push(findMe.weightMax)
                weightShop.push(add)
            }

        const findWeightBase = await priceBase.findOne({express:express})
            if(!findWeightBase){
                return res
                        .status(400)
                        .send({status:false, message:"ค้นหาราคามาตรฐานไม่เจอ"})
            }
        // console.log(weightShop[0])
        for (const data of dataInput) {
               
            const p = weightShop[0].weight.find((item) => item.weightEnd == data.weightEnd)
            const base = findWeightBase.weight.find((itme) => itme.weightEnd == data.weightEnd)
            // console.log(p,data)
            if(data.weightEnd <= weightShop[0].weightMax){
                console.log(data.costBangkok_metropolitan, base.salesBangkok_metropolitan)
                if (!Number.isInteger(data.costUpcountry) ||
                    !Number.isInteger(data.costBangkok_metropolitan) ||
                    !Number.isInteger(data.salesBangkok_metropolitan) ||
                    !Number.isInteger(data.salesUpcountry)) {
                    return res.status(400).send({
                        status: false,
                        message: `ช่วงน้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} กรุณาระบุเป็นจำนวนเต็มเท่านั้นห้ามใส่ทศนิยม`
                    });
                }

                if(data.costUpcountry < p.costUpcountry){
                    return res
                            .status(400)
                            .send({status:false, message:`กรุณาอย่าตั้งราคา(ต่างจังหวัด) น้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} ต่ำกว่าต้นทุนที่ได้รับ`})
                }else if(data.costBangkok_metropolitan < p.costBangkok_metropolitan){
                    return res
                            .status(400)
                            .send({status:false, message:`กรุณาอย่าตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} ต่ำกว่าราคาทุนที่ได้รับ`})
                }
                
                // if(role != 'admin'){
                //     if(data.costBangkok_metropolitan > base.salesBangkok_metropolitan){
                //         return res
                //                 .status(400)
                //                 .send({status:false, message:`กรุณาอย่าตั้งราคา(กรุงเทพ/ปริมณฑล) น้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} มากกว่าราคาขายไตรมาสที่ได้รับ`})
                //     }else if(data.costUpcountry > base.salesUpcountry){
                //         return res
                //                 .status(400)
                //                 .send({status:false, message:`กรุณาอย่าตั้งราคา(ต่างจังหวัด) น้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} มากกว่าราคาขายไตรมาสที่ได้รับ`})
                //     }
                // }

                if(p.costUpcountry == 0 || p.costUpcountry == 0){
                    if(data.costUpcountry != 0 || data.costBangkok_metropolitan != 0){
                        return res 
                                .status(400)
                                .send({status:false, message:`น้ำหนัก ${data.weightStart} ถึง ${data.weightEnd} ยังไม่มีการกำหนดราคาจากพาร์ทเนอร์ที่แนะนำท่าน กรุณาอย่าตั้งราคาต้นทุน`})
                        }
                }

            }else if(data.weightEnd > weightShop[0].weightMax) {
                if(data.costUpcountry != 0 || data.costBangkok_metropolitan != 0 || data.salesBangkok_metropolitan != 0 || data.salesUpcountry != 0){
                    return res
                            .status(400)
                            .send({status:false, message:`คุณไม่สามารถตั้งราคา มากกว่า ${weightShop[0].weightMax} กิโลกรัม`})
                }
            }
        }

        // return res
        //         .status(200)
        //         .send({status:true, data:weightShop})

        try {
            const result = await weightAll.bulkWrite(dataInput.map(data => ({
                updateOne: {
                    filter: { shop_id: id, express:express },
                    update: { 
                        $set: {
                            'weight.$[element].costBangkok_metropolitan': data.costBangkok_metropolitan,
                            'weight.$[element].costUpcountry': data.costUpcountry,
                            'weight.$[element].salesBangkok_metropolitan': data.salesBangkok_metropolitan,
                            'weight.$[element].salesUpcountry': data.salesUpcountry
                        }
                    },
                    arrayFilters: [{ 'element.weightEnd': data.weightEnd }],
                }
            })));

            return res
                    .status(200)
                    .send({ status: true, data: result });

        } catch (error) {
            console.error(error);
            return res.status(500).send({ status: false, message: "มีข้อผิดพลาดในการประมวลผลคำขอ" });
        }
    }catch(error){
        console.error(error);
        return res
                .status(500)
                .send({ status: false, message: error });
    }
}

getAll = async(req, res)=>{
    try{
        const findAll = await weightAll.find()
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
        const express = req.body.express
        const findWeight = await weightAll.findOne({shop_id:id_shop, express:express})
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
        const del = await weightAll.findByIdAndDelete({_id:id})
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

editWeightMax = async (req, res)=>{
    try{
        const id = req.params.id
        const express = req.body.express
        const weightMax = req.body.weightMax
        const partner_id = req.decoded.userid
        const role = req.decoded.role
        console.log(role)
        const findShop = await weightAll.findOne({shop_id:id, express: express})
            if(!findShop){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถค้นหาร้านค้าเจอ"})
            }

            if (role != 'admin') {
                if(partner_id != findShop.head_line){
                    // console.log(findShop.head_line)
                    return res.status(400).send({
                        status: false,
                        message: "คุณไม่มีสิทธิ์แก้ไขน้ำหนักของร้านค้านี้"
                    });
                }else if (findShop.shop_line == 'ICE'){
                    if(findShop.weightMax == 0){
                        return res
                                .status(400)
                                .send({status:false, message:"กรุณารอการระบุน้ำหนักที่สามารถใช้งานได้"})
                    }
                }
            }

            if(findShop.shop_line != 'ICE'){
                const findShopLine = await weightAll.findOne({shop_id:findShop.shop_line, express:express})
                    if(!findShopLine){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถหาร้านค้าที่แนะนำท่านเจอ"})
                    }

                if(weightMax > findShopLine.weightMax){
                    // console.log(findShopLine)
                    return res
                            .status(400)
                            .send({status:false, message:`ท่านไม่สามารถกำหนดน้ำหนักเกิน ${findShopLine.weightMax} กิโลกรัม`})
                }else if(findShopLine.weightMax == 0){
                    return res
                            .status(400)
                            .send({status:false, message:`กรุณารอร้านค้าที่แนะนำ กำหนดน้ำหนักที่สามารถใช้ได้ก่อน`})
                }
            }

        const update = await weightAll.findOneAndUpdate(
            {
                shop_id:id, express:express
            },
            {
                weightMax:weightMax
            },
            {new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทน้ำหนักสูงสุดที่สามารถใช้ได้"})
            }
        return res
                .status(200)
                .send({status:false, data:update})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { editWeight, getAll, delend, getWeightShop, editWeightMax }