
const { bangkokMetropolitan } = require('../../../Models/postcal_bangkok/postcal.bangkok');
const xlsx = require('xlsx');

createRemote = async(req, res)=>{
    try{
        const workbook = xlsx.readFile('D:/remote_area/Thailand_Zip_Code.xlsx')
        const sheetName = workbook.SheetNames[0]; // สมมติว่าข้อมูลอยู่ใน Sheet แรก
            // console.log(req.body.nop)
            // console.log(sheetName)
        const sheet_data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            // console.log(sheet_data)
        const transformedData = sheet_data.map(row => ({
            Province: row['province'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            District: row['district'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            Sub_district: row['subdistrict'],
            Postcode: row['zipcode'],
            // เพิ่ม fields ต่อไปตามที่คุณมีใน Schema ของคุณ
        }));
            console.log(transformedData)
        const createRemote = await bangkokMetropolitan.create(transformedData)
            if(!createRemote){
                return res
                        .status(400)
                        .send({status:false, message:"ไม่สามารถสร้างราคาพื้นที่ห่างไกลได้"})
            }
        return res
                .status(200)
                .send({status:true, data: createRemote})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res
                .status(500)
                .send({status:false, message:err})
    }
}
module.exports = { createRemote }