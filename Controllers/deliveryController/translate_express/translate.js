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
            ["is working on【入库交接】scan", "พัสดุคงคลัง"],
            ["is working on【Storage】scan", "พัสดุคงคลัง"],
            ["sprinter", "ผู้จัดส่งพัสดุ"],
            ["is sending", "กำลังจัดส่ง"]
        ];
    
        let translatedDesc = desc;
        for (const [key, value] of translations) {
            translatedDesc = translatedDesc.replace(new RegExp(key, 'g'), value);
        }
        
        return translatedDesc;
    }catch(err){
        console.log(err);
    }
}

const translationsMap = new Map([
    ['RECEIVED', [
        ["Your parcel has been picked up by the", "เจ้าหน้าที่สาขา"],
        ["courier", "รับพัสดุเรียบร้อย"]
    ]],
    ['RECEIVE_WAREHOUSE_SCAN', [
        ["Your parcel has arrived at", "รับพัสดุเข้าสาขา"]
    ]],
    ['SHIPMENT_WAREHOUSE_SCAN', [
        ["Your parcel is being transported from", "ส่งต่อพัสดุจากสาขา"],
        ["to", "ไปยังสาขา"]
    ]],
    ['ARRIVAL_WAREHOUSE_SCAN', [
        ["Your parcel has arrived at", "พัสดุถึงสาขา"]
    ]],
    ['DELIVERY_TICKET_CREATION_SCAN', [
        ["Your parcel is being delivered by Flash Express", "พัสดุของท่านอยู่ระหว่างการนำส่งโดย Flash express"]
    ]],
    ['DETAIN_WAREHOUSE', [
        ["Your parcel has arrived at", "พัสดุถูกจัดเก็บที่สาขา"],
        ["and has not been delivered yet.Due to", "เนื่องจาก"],
        ["Unable to contact", "ไม่สามารถติดต่อผู้รับได้"],
        ["Retain for delivery the next day due to remote area", "เก็บไว้ส่งวันถัดไปเนื่องจากเป็นพื้นที่ห่างไกล"],
        ["Receiver rescheduled","ผู้รับเลื่อนเวลารับพัสดุ"],
        ["Consignee rejected the parcel","ผู้รับสินค้าปฏิเสธพัสดุ"],
        ["the shipment has not been delivered yet, we will deliver it again as soon as possible", "เจ้าหน้าที่กำลังเร่งดำเนินการจัดส่งอีกครั้ง"],
        ["and has not been delivered yet.we will deliver it as soon as possible", "เจ้าหน้าที่กำลังเร่งดำเนินการจัดส่งอีกครั้ง"]
    ]],
    ['DELIVERY_CONFIRM', [
        ["Your parcel has been delivered and signed by", "นำส่งสำเร็จ เซ็นรับโดย"],
        ["Thank you for using Flash Express service", "ขอบคุณที่ใช้บริการ Flash Express"]
    ]],
    ['DIFFICULTY_HANDOVER', [
        ["Your parcel is already in", "พัสดุถูกจัดเก็บที่สาขา"],
        ["Due to", "เนื่องจาก"],
        ["Unable to contact", "ไม่สามารถติดต่อผู้รับได้"],
        ["Receiver rescheduled","ผู้รับเลื่อนเวลารับพัสดุ"],
        ["Consignee rejected the parcel","ผู้รับสินค้าปฏิเสธพัสดุ"],
        ["Retain for delivery the next day due to remote area", "เก็บไว้ส่งวันถัดไปเนื่องจากเป็นพื้นที่ห่างไกล"],
        ["the parcel was processed as a problem parcel. Flash staff will handle the parcel problem for you as soon as possible. Please be patient", "เจ้าหน้าที่กำลังเร่งดำเนินการตรวจสอบ"],
        ["your parcel was not delivered successfully", "พัสดุของท่านจึงนำส่งไม่สำเร็จ"]
    ]],
    ['CONTINUE_TRANSPORT', [
        ["Your parcel is being delivered again by the Flash Express courier", "พัสดุของท่านกำลังถูกจัดส่งอีกครั้ง"]
    ]],
    ['DIFFICULTY_RE_TRANSIT', [
        ["shipment transporting from", "ส่งคืนพัสดุจากสาขา"],
        ["to", "ไปยังสาขา"]
    ]],
    ['CANCEL_PARCEL', [
        ["Due to", "เนื่องจาก"],
        ["your parcel has been withdrawn", "พัสดุจึงถูกเรียกคืน"]
    ]],
    ['HURRY_PARCEL', [
        ["The order has been reminded, and the relevant staff are processing it urgently", "มีการกดเร่งติดตามพัสดุแล้ว"]
    ]],
    ['CHANGE_PARCEL_INFO', [
        ["Your parcel information has been modified", "ข้อมูลพัสดุมีการเปลี่ยนแปลง"]
    ]],
    ['CHANGE_PARCEL_CLOSE', [
        ["Delivery terminated by exception, Order closed", "ปิดบิลแล้ว"]
    ]],
    ['CHANGE_PARCEL_SIGNED', [
        ["Shipment Signed Successfully. Thanks for choosing Flash Express", "เซ็นรับพัสดุเรียบร้อย ขอบคุณที่ใช้บริการ Flash Express"]
    ]],
    ['CHANGE_PARCEL_CANCEL', [
        ["Due to", "เนื่องจาก"],
        ["your parcel has been withdrawn", "พัสดุจึงถูกเรียกคืน"]
    ]],
    ['CHANGE_PARCEL_IN_TRANSIT', [
        ["Your parcel has continued to be shipped", "พัสดุกำลังถูกจัดส่งอีกครั้ง"]
    ]],
    ['REVISION_TIME', [
        ["You have changed delivery time", "ลูกค้าเลื่อนการรับพัสดุเป็น"]
    ]],
    ['CUSTOMER_CHANGE_PARCEL_INFO', [
        ["You have modified parcel information", "คุณได้ทำการแก้ไขข้อมูลพัสดุแล้ว"]
    ]],
    ['DIFFICULTY_FINISH_INDEMNITY', [
        ["Compensation finished for damaged or missing shipment", "จ่ายค่าชดเชยพัสดุเสียหาย/สูญหายแล้ว"]
    ]],
    ['SYSTEM_AUTO_RETURN', [
        ["system auto return", "ระบบตีกลับอัตโนมัติ"]
    ]]
]);

exports.translateFlash = (desc, routedAction)=>{
    try{
        const translations = translationsMap.get(routedAction) || [];
        let translatedDesc = desc;

        for (const [key, value] of translations) {
            translatedDesc = translatedDesc.replace(new RegExp(key, 'g'), value);
        }

        return translatedDesc;
    }catch(err){
        console.log(err.message);
    }
}

