const axios = require('axios')
const  { statusContract } = require("../../Models/contractPopup")

async function getData() {
    try{
        const apiUrl = "https://open-api-tra.flashexpress.com"
        const response = await axios.post(`${apiUrl}/open/v1/warehouses`)
        console.log(response)
    }catch(error){
        console.error(error)
    }
}
getData();