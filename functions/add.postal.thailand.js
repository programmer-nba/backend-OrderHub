const { postalThailand } = require("../Models/postal.thailand/postal.thai.model");
const xlsx = require('xlsx');

createPostal = async(req, res)=>{
    try{
        const workbook = xlsx.readFile('D:/remote_area/postal_thai.xlsx')
        const sheetName = workbook.SheetNames[0]; // สมมติว่าข้อมูลอยู่ใน Sheet แรก
            // console.log(remoteArea)
        const findPostal = await postalThailand.find()
            if(findPostal.length == 0){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่พบข้อมูลในระบบ"})
            }
        // const sheet_data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        // console.log(sheet_data)
        // const transformedData = sheet_data.map(row => ({
        //     province: row['ProvinceThai'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
        //     state: row['DistrictThaiShort'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
        //     district: row['TambonThaiShort'],
        //     postcode: row['PostCode'],
        //     remark: row['หมายเหตุ'],
        //     // เพิ่ม fields ต่อไปตามที่คุณมีใน Schema ของคุณ
        // }));
        // // console.log(transformedData)
        // const createPostal = await postalThailand.create(transformedData)
        //     if(!createPostal){
        //         return res
        //                 .status(400)
        //                 .send({status:false, message:"ไม่สามารถสร้างราคาพื้นที่ห่างไกลได้"})
        //     }
        return res
                .status(200)
                .send({status:true, data: findPostal})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
module.exports = { createPostal }