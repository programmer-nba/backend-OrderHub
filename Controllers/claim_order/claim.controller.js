const { claimOrder } = require("../../Models/claim_order/claim.models");
const { uploadFileCreate } = require("../../functions/uploadfileTest");
const multer = require("multer");

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
  });

exports.create = async (req, res) => {
    try {
        const id = req.decoded.userid
        const create = await claimOrder.create({ partner_id:id, ...req.body })
        if (!create) {
            return res
                .status(400)
                .send({ status: false, message: "ไม่สามารถสร้างข้อมูลได้" })
        }
        return res
            .status(200)
            .send({ status: true, data: create })
    } catch (err) {
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getAll = async(req, res) => {
    try{
        const findAll = await claimOrder.find()
            if(findAll.length == 0){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getById = async(req, res)=>{
    try{
        const id = req.params.id
        const find = await claimOrder.findById(id)
            if(!find){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่พบข้อมูล"})
            }
        return res
                .status(200)
                .send({status:true, data:find})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.update = async(req, res)=>{
    try{
        const id = req.params.id
        const update = await claimOrder.findByIdAndUpdate(id, req.body, {new:true})
            if(!update){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถอัพเดทได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"อัพเดทข้อมูลสําเร็จ", data:update})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.delete = async(req, res)=>{
    try{
        const id = req.params.id
        const deleteData = await claimOrder.findByIdAndDelete(id)
            if(!deleteData){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถลบข้อมูลได้"})
            }
        return res
                .status(200)
                .send({status:true, message:"ลบข้อมูลสําเร็จ"})
    }catch(err){
        console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.uploadPicture = async (req,res)=>{
    try {
        const location = process.env.GOOGLE_DRIVE_CLAIM
        let upload = multer({ storage: storage })
        const fields = [
            {name: 'picture', maxCount: 5}
        ]
        const uploadMiddleware = upload.fields(fields);
        uploadMiddleware(req, res, async function (err) {
            const reqFiles = [];
            const result = [];
            if (!req.files) {
            return res.status(400).send({ message: 'No files were uploaded.' });
            }
            const url = req.protocol + "://" + req.get("host");
            for (const fieldName in req.files) {
                const files = req.files[fieldName];
                for (var i = 0; i < files.length; i++) {
                    const src = await uploadFileCreate(files[i], res, { i, reqFiles }, location);
                    result.push(src);
                }
            }
            console.log(result[0])
            const id = req.params.id;
            const member = await shopPartner.findByIdAndUpdate(id, {
                picture: result[0],
            },{new:true});
            if (!member) {
                return res.status(500).send({
                message: "ไม่สามารถเพิ่มรูปภาพได้",
                status: false,
                });
            }else{
                return res.status(200).send({
                message: "เพิ่มรูปภาพสำเร็จ",
                status: true,
                data: member
                });
            }
        });
      
    } catch (error) {
        return res
                .status(500)
                .send({ status: false, error: error.message });
    }
}