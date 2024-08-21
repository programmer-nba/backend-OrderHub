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

exports.getMessagePage = async(req, res)=>{
    try{
        const id = req.params.id
        
        let TOKEN = req.body.token_page
        // console.log(id)
        const dataConversation = await getConversation(id,TOKEN, 2) // getConversation
        const dataMessage = await getMessage(dataConversation.data,TOKEN, 10) 
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

async function getConversation (id,TOKEN,limit) {
    try{
        let dataErr
        const response = await axios.get(`${FB_URL}/${id}/conversations`, {
            params: {
                access_token: TOKEN,
                limit: limit
            }
        }).catch(error => {
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

async function getMessage(dataConversation,TOKEN,limit) {
    try{
        let dataErr
        if(limit == undefined || limit == 0){
            limit = 10
        }
        let messageData = []
        for(const data of dataConversation){
            let message = await axios.get(`${FB_URL}/${data.id}/messages`, {
                params: {
                    access_token: TOKEN,
                    limit: limit
                }
            }).catch(error => {
                dataErr = error.response.data
                // console.log(dataErr);
            });
            messageData.push(message.data)
        }
        
        if(dataErr){
            return {
                    status:false,
                    code: dataErr.error.code,
                    err: dataErr.error.message,
                    data: "message api", 
                    message:"Authentication token หมดอายุ"
                }
        }
        return messageData
    }catch(err){
        return {
            status:false, 
            data:"message api", 
            message:err.message
        }
    }
}

async function getDecodeMessage(dataMessage, TOKEN) {
    try {
        let dataErr;
        let messageData = [];
        
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
            messageData.push(messageDecode);
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