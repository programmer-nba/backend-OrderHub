const { bestRemoteArea } = require("../../../Models/remote_area/best.area")
const xlsx = require('xlsx');

createRemote = async(req, res)=>{
    try{
        const workbook = xlsx.readFile('D:/remote_area/Q1_Remote_Area_2024.xlsx')
        const sheetName = workbook.SheetNames[0]; // สมมติว่าข้อมูลอยู่ใน Sheet แรก
            // console.log(remoteArea)
        const sheet_data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const transformedData = sheet_data.map(row => ({
            No: row['No.'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            Staiton_code: row['Staiton code'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            Staiton_name: row['Staiton name'],
            Province: row['Province'],
            District: row['District'],
            Sub_district: row['Sub-district'],
            Postcode: row['Post Code'],
            Price: row['Price']
            // เพิ่ม fields ต่อไปตามที่คุณมีใน Schema ของคุณ
        }));
        const createRemote = await bestRemoteArea.create(transformedData)
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