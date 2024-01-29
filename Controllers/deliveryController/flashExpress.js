const axios = require('axios')
const querystring = require('querystring');
const crypto = require('crypto')
const dayjs = require('dayjs')

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY/MM/DD HH:mm:ss')

const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
const milliseconds = String(dayjsObject.valueOf()); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที
//ใช้ method valueOf ของ dayjs ใช้เพื่อดึงค่า timestamp ของวัตถุนั้นในรูปของจำนวนเต็ม (milliseconds) ที่แสดงถึงเวลาของวัตถุนั้นๆ ตั้งแต่ Epoch (January 1, 1970, 00:00:00 UTC) ไปจนถึงวันที่และเวลาปัจจุบัน.
//console.log(milliseconds)
const apiUrl = process.env.TRAINING_URL
const mchId = process.env.MCH_ID
const key = process.env.SECRET_KEY
const body = 'ORDER_HUB'
const nonceStr = milliseconds
const stringA = `body=${body}&mchId=${mchId}&nonceStr=${nonceStr}`
//const stringA = `mchId=${mchId}&nonceStr=${nonceStr}`
//const stringSignTemp = stringA+`&key=${key}`

const asciiSortedSignature = [
    //`body=${body}`,
    `mchId=${mchId}`,
    `nonceStr=${nonceStr}`,
  ].sort().join('&');

const stringSignTemp = asciiSortedSignature +`&key=${key}`

//console.log('ASCII Sorted Signature:', stringSignTemp);

const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

const sign = hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
//console.log(sign);

getData = async(req, res)=> { //เรียกดูคลังสินค้า
    try{
        console.log(apiUrl)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/warehouses`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("get_ware_houses",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(error){
        console.error(error)
    }
}

createOrder = async(req, res)=>{ //สร้างออเดอร์(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            sign: sign,
            outTradeNo: `#${nonceStr}#`,
            srcName: 'หรรมรวม',//src ชื่อผู้ส่ง
            srcPhone: '0630101454', //เบอร์ผู้ส่ง
            srcProvinceName: 'อุบลราชธานี',
            srcCityName: 'เมืองอุบลราชธานี',
            srcDistrictName: 'ในเมือง',
            srcPostalCode: '34000',
            srcDetailAddress: '68/5-6 ม.1 บ้านท่าบ่อ create order test address',
            dstName: 'น้ำพริกแม่อำพร',//dst ชื่อผู้รับ
            dstPhone: '0970209976', //เบอร์ผู้รับ
            dstHomePhone: '0970220220',
            dstProvinceName: 'เชียงใหม่',
            dstCityName: 'สันทราย',
            dstDistrictName: 'สันพระเนตร',
            dstPostalCode: '50210',
            dstDetailAddress: '127 หมู่ 3 ต.หนองแหย่ง อ.สันทราย จ.เชียงใหม่ create order test address',
            articleCategory: 1,
            expressCategory: 1,
            weight: 1000,
            insured: 1,
            insureDeclareValue: 10000,
            opdInsureEnabled: 1,
            codEnabled: 1,
            codAmount: 10000,
            subParcelQuantity: 2,
            subParcel:[
                {
                    "outTradeNo": "021903210794089",
                    "weight": 21,
                    "width": 21,
                    "length": 21,
                    "height": 12,
                    "remark": "remark1"
                },{
                    "outTradeNo": "02190321047438",
                    "weight": 21,
                    "width": 21,
                    "length": 21,
                    "height": 21,
                    "remark": "remark2"
                  }
            ],
            remark: 'ขึ้นบันได'
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v3/orders`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.status === 200){
            return console.log("Create Order",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

newSub = async(req, res)=>{ //สร้างบัญชีย่อย(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            accountName: "GGEZ",
            name: "mahunnop Kapkhao",
            mobile: "084574544",
            email: "ccdsfad@gmail.com",
            showAmountEnabled: 1
            // เพิ่ม key-value pairs ตามต้องการ
          };
        
        const response = await axios.post(`${apiUrl}/open/v1/new_sub_account`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("new_sub_account",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

flashMaster = async(req, res)=>{ //เรียกดู flash master
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body, //ขาดส่วน body ไม่ได้ไม่งั้น server flash จะ reject
            sign: sign
            // เพิ่ม key-value pairs ตามต้องการ
          };
        
        const response = await axios.post(`${apiUrl}/gw/fda/open/standard/address_core/url/query`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("Flash_master_address",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

order_modify = async(req, res)=>{ //แก้ไขข้อมูลออเดอร์ (ใช้ไม่ได้)
    try{
        console.log(mchId, nonceStr, sign)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            pno: 'TH47144P18',
            outTradeNo: `#${nonceStr}#`,
            expressCategory: 1,
            srcName: 'หอมรวม',//src ชื่อผู้ส่ง
            srcPhone: '0630101454', //เบอร์ผู้ส่ง
            srcProvinceName: 'อุบลราชธานี',
            srcCityName: 'เมืองอุบลราชธานี',
            srcDistrictName: 'ในเมือง',
            srcPostalCode: '34000',
            srcDetailAddress: '68/5-6 ม.1 บ้านท่าบ่อ create order test address',
            dstName: 'น้ำพริกแม่อำพร',//dst ชื่อผู้รับ
            dstPhone: '0970209976', //เบอร์ผู้รับ
            dstHomePhone: '0970220220',
            dstProvinceName: 'เชียงใหม่',
            dstCityName: 'สันทราย',
            dstDistrictName: 'สันพระเนตร',
            dstPostalCode: '50210',
            dstDetailAddress: '127 หมู่ 3 ต.หนองแหย่ง อ.สันทราย จ.เชียงใหม่ create order test address',
            articleCategory: 1,
            weight: 1000,
            insured: 1,
            insureDeclareValue: 10000,
            opdInsureEnabled: 1,
            codEnabled: 1,
            codAmount: 10000,
            subParcelQuantity: 2,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/orders/modify`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("Create Order",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

statusOrder = async(req, res)=>{ //ตรวจสอบสถานะพัสดุ
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            sign: sign
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const pno = 'TH0112BX4K4A'
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/routes`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        const item = response.data.data
        if(response.status === 200){
            return console.log("status_order",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

statusOrderPack = async(req, res)=>{ //ตรวจสอบสถานะพัสดุแบบชุด(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            pnos: 'TH0112BX4K4A'
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/orders/routesBatch`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("status_order_pack",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

checkPOD = async(req, res)=>{ //ตรวจสอบข้อมูล POD
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            //body: body,
            sign: sign,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const pno = 'TH0112BX4K4A'
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/deliveredInfo`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("checkPOD",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

print100x180 = async(req, res)=>{ //ปริ้นใบปะหน้า(ขนาด 100*180 มม.)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const pno = 'TH0112BX4K4A'
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/pre_print`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("print100x180",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

print100x75 = async(req, res)=>{ //ปริ้นใบปะหน้า(ขนาด 100*75 มม.)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            // เพิ่ม key-value pairs ตามต้องการ
          };
        const pno = 'TH01011C27'
        const response = await axios.post(`${apiUrl}/open/v1/orders/${pno}/small/pre_print`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("print100x75",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

merchant_tracking = async(req, res)=>{ //ออเดอร์โดย merchant tracking number(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            mchPno: 'MP123456111',
            outTradeNo: '1526461166805',
            warehouseNo: 'AA0005_001',
            srcName: 'test srcName1111',
            srcPhone: '111111111',
            srcProvinceName: 'อุบลราชธานี',
            srcCityName: 'เมืองอุบลราชธานี',
            srcPostalCode: '34000',
            srcDetailAddress: '68/5-6 ม.1 บ้านท่าบ่อ99111',
            dstName: 'น้ำพริกแม่อำพร',
            dstPhone: '091111111',
            dstHomePhone: '092222222',
            dstProvinceName: 'เชียงใหม่',
            dstCityName: 'สันทราย',
            dstPostalCode: '50210',
            dstDetailAddress: '127 หมู่ 3 ต.หนองแหย่ง อ.สันทราย จ.เชียงใหม่',
            returnName: 'น้ำพริกแม่อำพร',
            returnPhone: '093333333',
            returnProvinceName: 'อุบลราชธานี',
            returnCityName: 'เมืองอุบลราชธานี',
            returnPostalCode: '34000',
            returnDetailAddress: '68/5-6 ม.1 บ้านท่าบ่อ99111',
            articleCategory: 1,
            expressCategory: 1,
            weight: 1000,
            codEnabled: 1,
            codAmount: 2000,
            remark: '-',
            opdInsureEnabled: 1
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v3/ordersByMchPno`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("merchant_tracking",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

estimate_rate = async(req, res)=>{ //เช็คค่าจัดส่งพัสดุ(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            srcProvinceName: 'อุบลราชธานี',
            srcCityName: 'เมืองอุบลราชธานี',
            srcDistrictName: 'ในเมือง',
            srcPostalCode: '34000',
            dstProvinceName: 'เชียงใหม่',
            dstCityName: 'สันทราย',
            dstDistrictName: 'สันพระเนตร',
            dstPostalCode: '50210',
            weight: 1000,
            width: 40,
            length: 40,
            height: 40,
            expressCategory: 2,
            insureDeclareValue: 100,
            insured: 1,
            opdInsureEnabled: 1,
            pricingTable: 1,
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/orders/estimate_rate`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("estimate_rate(เช็คค่าจัดส่งพัสดุ)",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

nontifications = async(req, res)=>{ //เรียกดูงานรับในวัน(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            date: '2018-09-27'
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/notifications`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("nontifications(เรียกดูงานรับในวัน)",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

notify = async(req, res)=>{ //เรียกคูเรียร์/พนักงานเข้ารับ(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            date: '2018-09-27',
            srcName: 'หอมรวม  nofity test name',
            srcPhone: '0630101454',
            srcProvinceName: 'อุบลราชธานี',
            srcCityName: 'เมืองอุบลราชธานี',
            srcDistrictName: 'ในเมือง',
            srcPostalCode: '34000',
            srcDetailAddress: '68/5-6 ม.1 บ้านท่าบ่อ nofity test address',
            estimateParcelNumber: 100,
            remark: 'ASAP'
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/open/v1/notify`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("notify(เรียกคูเรียร์/พนักงานเข้ารับ)",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

notify_cancel = async(req, res)=>{ //ยกเลิกงานรับ(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const id = '27776'
        const response = await axios.post(`${apiUrl}/open/v1/notify/${id}/cancel`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("notify_cancel(ยกเลิกงานรับ)",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

webhook_service = async(req, res)=>{ //ตั้งค่า Web hook(ใช้ไม่ได้)
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            serviceCategory: 0,
            url: 'http://www.baidu.com',
            webhookApiCode: 0
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const id = '27776'
        const response = await axios.post(`${apiUrl}/open/v1/setting/web_hook_service`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("Web_hook(ตั้งค่า Web hook )",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

webhook_status = async(req, res)=>{ //ตรวจสอบข้อมูล Web hook 
    try{
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            body: body,
            sign: sign,
            //เพิ่ม key-value pairs ตามต้องการ
          };
        const response = await axios.post(`${apiUrl}/gw/fda/open/standard/webhook/setting/infos`,formData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log("Web_status(ตรวจสอบข้อมูล Web hook)",response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
    }
}

//ใช้ไม่ได้
createOrder(); //ใช้ไม่ได้ code 1002
//newSub(); //ใช้ไม่ได้ code 1002
//statusOrderPack(); //ใช้ไม่ได้ code 1002
//merchant_tracking(); //ใช้ไม่ได้ code 1002
//estimate_rate(); //ใช้ไม่ได้ code 1002
//nontifications(); //ใช้ไม่ได้ code 1002
//notify(); //ใช้ไม่ได้ code 1002
//notify_cancel(); //ใช้ไม่ได้ code 0 'ไม่สามารถทำงานได้'
//webhook_service(); //ใช้ไม่ได้ code 1002
//order_modify(); //ใช้ไม่ได้ code 1002

//ใช้ได้
// getData()
// flashMaster();
// statusOrder();
// checkPOD();
// print100x180();
// print100x75();
// webhook_status() //ตรวจสอบข้อมูล Web hook ของเราเอง (ใช้ได้)

// const timestamp = 1536749552628;
// const date = new Date(timestamp);
// const formattedDate = date.toLocaleString(); // แปลงเป็นวันที่และเวลาที่อ่านได้

// console.log(formattedDate);