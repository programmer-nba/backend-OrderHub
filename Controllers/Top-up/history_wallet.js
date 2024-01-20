const { Partner } = require('../../Models/partner')
const { historyWallet } = require('../../Models/topUp/history_topup')

getAll = async (req, res)=>{
    try{
        const get = historyWallet.find()
        if(get){
            return res  
                    .status(200)
                    .send({status:true,data: get})
        }else{
            return res  
                    .status(400)
                    .send({status:true,message:"ไม่สามารถค้นหาได้"})
        }
    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

testCal = async (req,res)=>{
    try{
        console.log(req.body.amount)
        const getid = req.decoded.userid
        console.log(getid)
          const walletCredit = await Partner.findOne({_id:getid})
            if(walletCredit){
              console.log(walletCredit.credit) //เช็คดู credit Wallet ของ partner คนนั้นว่าเหลือเท่าไหร่
              let result = await credit(req.body.amount,walletCredit.credit)
              console.log(result)
            }else{
              res 
                .status(400)
                .send({status:false, message:"ค้นหา ID ไม่พบ"})
            }

    }catch(err){
        console.error(err);
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด" })
    }
}

async function credit(data, creditPartner){
    let inputNumber = data + creditPartner;
    let formattedNumber = inputNumber.toLocaleString('th-TH')
    return formattedNumber
}

module.exports = {testCal}