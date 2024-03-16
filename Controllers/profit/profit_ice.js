const { profitIce } = require("../../Models/profit/profit.ice")

getAll = async (req, res)=>{
    try{
        const findAll = await profitIce.find()
            if(!findAll){
                return res
                        .status(404)
                        .send({status:false ,message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:findAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumAdmin = async (req, res)=>{
    try{
        const findMe = await profitIce.find()
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        const totalProfit = findMe.reduce((total, document) => {
            if (document.type !== "COD(SENDER)") {
                // console.log(total)
                return total + document.profit;
            } else {
                return total;
            }
        }, 0);
        const totalProfitWithDecimal = totalProfit.toFixed(2);
        console.log(totalProfit)
        const totalProfitAsNumber = parseFloat(totalProfitWithDecimal);
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    data:findMe,
                    sum: totalProfitAsNumber
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumCod = async (req, res)=>{
    try{
        const findMe = await profitIce.find({type:"COD"})
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        const totalProfit = findMe.reduce((total, document) => total + document.profit, 0);
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    // data:findMe,
                    sumCOD: totalProfit
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

getSumCost = async (req, res)=>{
    try{
        const findMe = await profitIce.find({type:"เปอร์เซ็นจากต้นทุน"})
            if(!findMe){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ"})
            }
        const totalProfit = findMe.reduce((total, document) => total + document.profit, 0);
        // console.log(totalProfit)
        return res
                .status(200)
                .send({
                    status:true, 
                    // data:findMe,
                    sumCost: totalProfit
                })
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res 
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, getSumAdmin, getSumCod, getSumCost }