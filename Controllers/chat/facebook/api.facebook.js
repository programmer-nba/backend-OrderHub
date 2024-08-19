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
        const dataConversation = await getConversation(id,TOKEN) // getConversation
        return res
                .status(200)
                .send({status:true, conversation:dataConversation})
    }catch(err){
        return res
                .status(500)
                .send({status:false, message:err.message})
    }
}

async function getConversation (id,TOKEN) {
    try{
        let dataErr
        const response = await axios.get(`${FB_URL}/${id}/conversations`, {
            params: {
                access_token: TOKEN,
                limit: 1
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

async function getMessage(id) {
    try{

    }catch(err){
        return {
            status:false, 
            message:err.message
        }
    }
}