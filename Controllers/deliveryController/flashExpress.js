const axios = require('axios')
const querystring = require('querystring');
const crypto = require('crypto')
const dayjs = require('dayjs')

//เมื่อใช้ dayjs และ ทำการใช้ format จะทำให้ค่าที่ได้เป็น String อัตโนมันติ
const dayjsTimestamp = dayjs(Date.now());
const dayTime = dayjsTimestamp.format('YYYY/MM/DD HH:mm:ss')
//ใช้ method valueOf ของ dayjs ใช้เพื่อดึงค่า timestamp ของวัตถุนั้นในรูปของจำนวนเต็ม (milliseconds) ที่แสดงถึงเวลาของวัตถุนั้นๆ ตั้งแต่ Epoch (January 1, 1970, 00:00:00 UTC) ไปจนถึงวันที่และเวลาปัจจุบัน.

const dayjsObject = dayjs(dayTime); // สร้าง object dayjs จาก string
const milliseconds = dayjsObject.valueOf(); // แปลงเป็น timestamp ในรูปแบบมิลลิวินาที

console.log(dayTime);
console.log(milliseconds);

const apiUrl = process.env.TRAINING_URL
const mchID = process.env.MCH_ID
const secret_key = process.env.SECRET_KEY
const body = 'YOUO'
const nonce = milliseconds
const stringA = `body=${body}&mchId=${mchID}&nonceStr=${nonce}`
const stringSignTemp = stringA+`&key=${secret_key}`

const hash = crypto.createHash('sha256'); //ใช้สร้างอ็อบเจ็กต์ Hash สำหรับการใช้ SHA-256.
hash.update(stringSignTemp);//ใช้เพิ่มข้อมูลที่ต้องการแฮช.

const sign = hash.digest('hex').toUpperCase();//ให้ค่าแฮชเป็น string ในรูปแบบ hex (16 ฐาน)และเป็นตัวพิมพ์ใหญ่ทั้งหมด.
//console.log(sign);

getData = async(req, res)=> { //เรียกดูคลังสินค้า
    try{
        console.log(apiUrl)
        const formData = {
            mchId: mchID,
            nonceStr: nonce,
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
            return console.log(response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(error){
        console.error(error)
    }
}

createOrder = async(req, res)=>{
    try{
        console.log(mchID, nonce, sign)
        const formData = {
            mchId: mchID,
            nonceStr: nonce,
            sign: sign,
            outTradeNo: `#${nonce}#`,
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
        const response = await axios.post(`${apiUrl}/open/v3/orders`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log(response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

newSub = async(req, res)=>{
    try{
        const formData = {
            mchId: mchID,
            nonceStr: nonce,
            sign: sign,
            accountName: "GGEZ",
            name: "mahunnop Kapkhao",
            mobile: "084574544",
            email: "ccdsfad@gmail.com",
            showAmountEnabled: '1'
            // เพิ่ม key-value pairs ตามต้องการ
          };
        
        const response = await axios.post(`${apiUrl}/open/v1/new_sub_account`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log(response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        console.log(err)
    }
}

kurea = async(req, res)=>{
    try{
        const formData = {
            mchId: mchID,
            nonceStr: nonce,
            sign: sign,
            date: '2018-09-27'
            // เพิ่ม key-value pairs ตามต้องการ
          };
        
        const response = await axios.post(`${apiUrl}/open/v1/notifications`,querystring.stringify(formData),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
        if(response.status === 200){
            return console.log(response.data)
        }else{
            return console.log("ไม่สามารถเรียกข้อมูลได้")
        }
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:"มีบางอย่างผิดพลาด"})
    }
}
getData()
createOrder();
//newSub();
//kurea();
const timestamp = 1536749552628;
const date = new Date(timestamp);
const formattedDate = date.toLocaleString(); // แปลงเป็นวันที่และเวลาที่อ่านได้

console.log(formattedDate);