require("dotenv").config();

exports.translateJT = (desc)=>{
    try{
        const translations = [
            ["has picked up the parcel", "ได้ทำการรับพัสดุเรียบร้อยแล้ว"],
            ["from", "จาก"],
            ["send parcel to", "ส่งพัสดุไปที่"],
            ["Parcel is successfully delivered to destination", "พัสดุถึงศูนย์คัดแยกสินค้า"],
            ["Parcel has been received, receiver name", "พัสดุถูกจัดส่งสำเร็จ"],
            ["The parcel is Returning by", "พัสดุถูกส่งคืนโดย"],
            ["The returned parcel has been successfully signed", "พัสดุที่ส่งกลับมาได้ถูกเซ็นรับเรียบร้อยแล้ว"],
            ["is working on【入库交接】scan", "กําลังดำเนินการในการส่งพัสดุ"],
        ];
    
        let translatedDesc = desc;
        for (const [key, value] of translations) {
            translatedDesc = translatedDesc.replace(new RegExp(key, 'g'), value);
        }
        
        return translatedDesc;
    }catch(err){
        console.log(err.message);
    }
}
