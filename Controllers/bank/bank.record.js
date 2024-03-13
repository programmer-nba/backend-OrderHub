const { bankBestDropDown } = require("../../Models/bank/bank.bestDropdown")
const { bankRecord } = require("../../Models/bank/bank.record.best")

//BEST
getAll = async (req, res)=>{
    try{
        const findAll = await bankRecord.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถดูข้อมูลได้"})
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

createBank = async (req, res) => {
    try {
        const aka = req.body.aka;
        const name = req.body.name;
        const shop = req.body.shop_number;
        const id = req.decoded.userid;
        const code = req.body.code
        const card_number = req.body.card_number;

        const findID = await bankRecord.findOne({ ID: id });

        if (!findID) {
            // ใช้ await เพื่อรอให้การสร้างเสร็จสิ้นก่อนทำขั้นตอนถัดไป
            const createID = await bankRecord.create({ ID: id });

            if (!createID) {
                return res
                    .status(400)
                    .send({ status: false, message: "ไม่สามารถสร้างข้อมูลบัญชีธนาคารได้" });
            }
        }

        // ใช้ await เพื่อรอให้การ update เสร็จสิ้นก่อนทำขั้นตอนถัดไป
        const create = await bankRecord.findOneAndUpdate(
            { ID: id },
            {
                $push: {
                    best: {
                        shop: shop,
                        aka: aka,
                        name: name,
                        card_number: card_number,
                        code:code
                    }
                }
            },
            { new: true } // ให้คืนค่า document ที่ถูก update มา
        );

        if (!create) {
            return res
                .status(400)
                .send({ status: false, message: "ไม่สามารถเพิ่มข้อมูล BEST ลงในบัญชีธนาคารได้" });
        }

        return res
            .status(200)
            .send({ status: true, data: create.best });
    } catch (err) {
        console.log("มีบางอย่างผิดพลาด", err);
        return res
            .status(500)
            .send({ status: false, message: "มีบางอย่างผิดพลาด" });
    }
};

getPartnerByID = async (req, res)=>{
    try{
        const id = req.params.id
        const findAka = await bankRecord.findOne({ID:id})
            if(!findAka){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAka.best})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delendByID = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const delId = req.params.id
        console.log(id, delId)
        const result = await bankRecord.updateOne(
            { ID: id }, 
            { $pull: { best: { _id: delId } } }
          );
          
          if (result.nModified === 0) {
            return res
                    .status(404)
                    .send({ status: false, message: "ไม่พบข้อมูลธนาคารที่ท่านต้องการลบ" });
          }

        return res
                .status(200)
                .send({ status: true, message: "ลบข้อมูลธนาคารเรียบร้อย" });
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

updateBank = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const idBank = req.params.id
        const name = req.body.name
        const card_number = req.body.card_number
        const findId = await bankRecord.findOneAndUpdate(
            {ID:id},
            {
                $set: {
                    'best.$[element].name': name,
                    'best.$[element].card_number': card_number
                }
            },
            {
                arrayFilters: [{ 'element._id': idBank }], // ใช้ 'element.aka' เพื่อค้นหาตาม shop
                new: true
            })
            if(!findId){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการอัพเดท"})
            }
        return res
                .status(200)
                .send({status:true, data:findId.best})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

//FlasyPAY
getAllFP = async (req, res)=>{
    try{
        const findAll = await bankRecord.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถดูข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll.flash_pay})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

createBankFP = async (req, res) => {
    try {
        const aka = req.body.aka;
        const name = req.body.name;
        const shop = req.body.shop_number;
        const id = req.decoded.userid;
        const code = req.body.code
        const card_number = req.body.card_number;

        const findID = await bankRecord.findOne({ ID: id });

        if (!findID) {
            // ใช้ await เพื่อรอให้การสร้างเสร็จสิ้นก่อนทำขั้นตอนถัดไป
            const createID = await bankRecord.create({ ID: id });

            if (!createID) {
                return res
                    .status(400)
                    .send({ status: false, message: "ไม่สามารถสร้างข้อมูลบัญชีธนาคารได้" });
            }
        }

        // ใช้ await เพื่อรอให้การ update เสร็จสิ้นก่อนทำขั้นตอนถัดไป
        const create = await bankRecord.findOneAndUpdate(
            { ID: id },
            {
                $push: {
                    best: {
                        shop: shop,
                        aka: aka,
                        name: name,
                        card_number: card_number,
                        code:code
                    }
                }
            },
            { new: true } // ให้คืนค่า document ที่ถูก update มา
        );

        if (!create) {
            return res
                .status(400)
                .send({ status: false, message: "ไม่สามารถเพิ่มข้อมูล BEST ลงในบัญชีธนาคารได้" });
        }

        return res
            .status(200)
            .send({ status: true, data: create.best });
    } catch (err) {
        console.log("มีบางอย่างผิดพลาด", err);
        return res
            .status(500)
            .send({ status: false, message: "มีบางอย่างผิดพลาด" });
    }
};

getPartnerByIDFP = async (req, res)=>{
    try{
        const id = req.params.id
        const findAka = await bankRecord.findOne({ID:id})
            if(!findAka){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAka.best})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

delendByIDFP = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const delId = req.params.id
        console.log(id, delId)
        const result = await bankRecord.updateOne(
            { ID: id }, 
            { $pull: { best: { _id: delId } } }
          );
          
          if (result.nModified === 0) {
            return res
                    .status(404)
                    .send({ status: false, message: "ไม่พบข้อมูลธนาคารที่ท่านต้องการลบ" });
          }

        return res
                .status(200)
                .send({ status: true, message: "ลบข้อมูลธนาคารเรียบร้อย" });
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

updateBankFP = async (req, res)=>{
    try{
        const id = req.decoded.userid
        const idBank = req.params.id
        const name = req.body.name
        const card_number = req.body.card_number
        const findId = await bankRecord.findOneAndUpdate(
            {ID:id},
            {
                $set: {
                    'best.$[element].name': name,
                    'best.$[element].card_number': card_number
                }
            },
            {
                arrayFilters: [{ 'element._id': idBank }], // ใช้ 'element.aka' เพื่อค้นหาตาม shop
                new: true
            })
            if(!findId){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลธนาคารที่ท่านต้องการอัพเดท"})
            }
        return res
                .status(200)
                .send({status:true, data:findId.best})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, createBank, getPartnerByID, delendByID, updateBank,
                    getAllFP, createBankFP, getPartnerByIDFP, delendByIDFP, updateBankFP }