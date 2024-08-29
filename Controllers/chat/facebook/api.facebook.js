const axios = require('axios');
const FB_URL = process.env.FB_URL
const FB_TOKEN = process.env.FB_TOKEN

exports.getMe = async(req, res)=>{
    try{
        let TOKEN
        let dataErr
        if(!req.body.token){
            TOKEN = FB_TOKEN
        }else{
            TOKEN = req.body.token
        }
        // console.log(TOKEN)
        const response = await axios.get(`${FB_URL}/me`, {
            params: {
                access_token: TOKEN,
                fields: 'id,name,email,picture'
            }
        }).catch(error => {
            dataErr = error.response.data
            // console.log(dataErr);
        });
        if(dataErr){
            return res
                    .status(400)
                    .send({
                        status:false,
                        code: dataErr.error.code,
                        err: dataErr.error.message, 
                        message:"Authentication token หมดอายุ"
                    })
        }
        return res
                .status(200)
                .send({status:true, data:response.data})    
    }catch(err){
        // console.log(err)
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getMyPage = async(req, res)=>{
    try{
        let TOKEN
        let dataErr
        if(!req.body.token){
            TOKEN = FB_TOKEN
        }else{
            TOKEN = req.body.token
        }
        const response = await axios.get(`${FB_URL}/me/accounts`, {
            params: {
                access_token: TOKEN
            }
        }).catch(error => {
            dataErr = error.response.data
            console.log(dataErr);
        });
        if(dataErr){
            return res
                    .status(400)
                    .send({
                        status:false,
                        code: dataErr.error.code,
                        err: dataErr.error.message, 
                        message:"Authentication token หมดอายุ"
                    })
        }
        const dataArray = response.data.data
        let dataAll = []
        for(const data of dataArray){
            const picture = await axios.get(`${FB_URL}/${data.id}/picture`, {
                params: {
                    access_token: TOKEN,
                    redirect : false
                }
            }).catch(error => {
                let dataErr = error.response.data
                console.log(`ERR ค้นหารูป เพจ:${data.name}`,dataErr);
            });
            // console.log(picture.data)
            let v = {
                token_page : data.access_token,
                category : data.category,
                id : data.id,
                name : data.name,
                picture : picture.data.data.url
            }
            dataAll.push(v)
        }
        return res
                .status(200)
                .send({status:true, data:dataAll}) 
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getMessageAfter = async(req, res)=>{
    try{
        const id = req.params.id
        const after = req.body.after
        const limit = req.body.limit
        let TOKEN = req.body.token_page
        
        let dataConversation = [{
            id: id,
        }]
        // console.log(dataMessage)
        const conversation = await getMessage(dataConversation,TOKEN, limit, after)
        
        return res
                .status(200)
                .send({status:true, message:conversation})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getMessagePage = async(req, res)=>{
    try{
        const id = req.params.id
        const after = req.body.after
        const limit = req.body.limit
        const limit_message = req.body.limit_message
        let TOKEN = req.body.token_page
        // console.log(id)
        const dataConversation = await getConversation(id,TOKEN, limit, after) // getConversation
        const dataMessage = await getMessage(dataConversation.data,TOKEN, limit_message) 
        return res
                .status(200)
                .send({status:true, 
                    conversation:dataConversation,
                    message:dataMessage
                })
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

exports.getMessageDecode = async(req, res)=>{
    try{
        let TOKEN = req.body.token_page
        const message = req.body.message
        const dataMessage = message.map(item => {
            return {
                id: item.id,
                data: item.data
            }
        })
        // console.log(dataMessage)
        const decode = await getDecodeMessage(dataMessage,TOKEN)
        return res
                .status(200)
                .send({status:true, decode:decode})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

async function getConversation (id,TOKEN,limit,after) {
    try{
        let dataErr
        let pams = {
                params: {
                    access_token: TOKEN,
                    limit: limit
                }
        }
        if(after != undefined || after != ''){
            pams.params.after = after
        }
        // console.log(pams)
        const response = await axios.get(`${FB_URL}/${id}/conversations`, pams).catch(error => {
            dataErr = error.response.data
            // console.log(dataErr);
        });
        if(dataErr){
            return {
                    status:false,
                    code: dataErr.error.code,
                    err: dataErr.error.message,
                    data: "conversations", 
                    message:"Authentication token หมดอายุ"
                }
        }
        let dataConversation = response.data
        return dataConversation
    }catch(err){
        return {
            status:false, 
            data:"conversations", 
            message:err.message
        }
    }
}

async function getMessage(dataConversation,TOKEN,limit_message,after) {
    try {
        let dataErr;
        let pams = {
            params: {
                access_token: TOKEN,
                limit: limit_message
            }
        };
        if (after) {
            pams.params.after = after;
        }
        // console.log(dataConversation)
        // สร้าง array ของ promises สำหรับการดึงข้อมูลจาก Facebook API
        const promises = dataConversation.map(async (data) => {
            try {
                let message = await axios.get(`${FB_URL}/${data.id}/messages`, pams);
                return {
                    id: data.id,
                    ...message.data
                };
            } catch (error) {
                dataErr = error.response.data;
                return null; // ส่งกลับ null ถ้าเกิดข้อผิดพลาด
            }
        });

        // ใช้ Promise.all เพื่อรอให้ทุก promise ทำงานเสร็จ
        let messageData = await Promise.all(promises);

        // กรองผลลัพธ์ที่เป็น null ออก
        messageData = messageData.filter(item => item !== null);

        if (dataErr) {
            return {
                status: false,
                code: dataErr.error.code,
                err: dataErr.error.message,
                data: "message api",
                message: "Authentication token หมดอายุ"
            };
        }

        return messageData;
    } catch (err) {
        return {
            status: false,
            data: "message api",
            message: err.message
        };
    }
}

async function getDecodeMessage(dataMessage, TOKEN) {
    try {
        let dataErr;
        let messageData = [];
        console.log(dataMessage)
        for (const dataM of dataMessage) {
            let messageDecode = [];
            let dataMe = dataM.data;
            // console.log(dataMe);
            for (const data of dataMe) {
                try {
                    const response = await axios.get(`${FB_URL}/${data.id}`, {
                        params: {
                            access_token: TOKEN,
                            fields: 'to,from,message'
                        }
                    });
                    if (response && response.data) {
                        messageDecode.push(response.data);
                    }
                } catch (error) {
                    dataErr = error.response ? error.response.data : error.message;
                    console.error('Error fetching data:', dataErr);
                    break; // หยุดการวนลูปถ้ามีข้อผิดพลาด
                }
            }
            let v ={
                id: dataM.id,
                data: messageDecode
            }
            messageData.push(v)
        }
        if (dataErr) {
            return {
                status: false,
                code: dataErr.error ? dataErr.error.code : 'Unknown',
                err: dataErr.error ? dataErr.error.message : dataErr,
                data: "decode message api", 
                message: "Authentication token หมดอายุหรือมีข้อผิดพลาดอื่นๆ"
            };
        }
        return messageData;
    } catch (err) {
        console.error('Error in getDecodeMessage:', err);
        return {
            status: false, 
            data: "decode message api", 
            message: err.message
        };
    }
}