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
            console.log(dataErr);
        });
        if(dataErr){
            return res
                    .status(400)
                    .send({status:false, message:"Authentication token หมดอายุ"})
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
                    .send({status:false, message:"Authentication token หมดอายุ"})
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
                access_token : data.access_token,
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

