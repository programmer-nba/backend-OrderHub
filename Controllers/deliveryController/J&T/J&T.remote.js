const { jntRemoteArea } = require("../../../Models/remote_area/JNT.area");
const xlsx = require('xlsx');

createRemote = async(req, res)=>{
    try{
        const workbook = xlsx.readFile('D:/remote_area/Remote_Area_and_tourist_List2.xlsx')
        const sheetName = workbook.SheetNames[2]; // สมมติว่าข้อมูลอยู่ใน Sheet แรก
            // console.log(remoteArea)
        const sheet_data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        // console.log(sheet_data)
        const transformedData = sheet_data.map(row => ({
            district_th: row['Tourist Areas (Expires on 31/03/2024)'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            district: row['__EMPTY'], // ปรับให้ตรงกับชื่อ field ใน Schema ของคุณ
            province_th: row['__EMPTY_1'],
            province: row['__EMPTY_2'],
            region_th: row['__EMPTY_3'],
            region: row['__EMPTY_4'],
            postcode: row['__EMPTY_5'],
            type: "touristArea",
            // เพิ่ม fields ต่อไปตามที่คุณมีใน Schema ของคุณ
        }));
        console.log(transformedData)
        const createRemote = await jntRemoteArea.create(transformedData)
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