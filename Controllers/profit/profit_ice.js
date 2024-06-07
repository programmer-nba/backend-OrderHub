const { profitIce } = require("../../Models/profit/profit.ice")
const { profitTemplate } = require("../../Models/profit/profit.template")

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
        const orderer = req.body.orderer
        const express = req.body.express
        const shop_number = req.body.shop_number
        const day_start = req.body.day_start
        const day_end = req.body.day_end
        let findMe = []
        if(!day_start && !day_end){
            if(orderer){
                if(!express && !shop_number){
                    findMe = await profitIce.find({Orderer:orderer})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(1)"})
                        }
                }else if(express && shop_number){
                    findMe = await profitIce.find({Orderer:orderer, express:express, shop_number:shop_number})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(2)"})
                        }
                }else if(express){
                    findMe = await profitIce.find({Orderer:orderer, express:express})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(3)"})
                        }
                }else if(shop_number){
                    findMe = await profitIce.find({Orderer:orderer, shop_number:shop_number})
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(4)"})
                        }
                }
            }else if(shop_number){
                if(!express){
                    findMe = await profitIce.find({shop_number:shop_number})
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(5)"})
                    }
                }else if(express){
                    findMe = await profitIce.find({shop_number:shop_number, express:express})
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(6)"})
                    }
                }
            }else if(express){
                findMe = await profitIce.find({express:express})
                if(findMe.length == 0){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(7)"})
                }
            }
        }else if(day_start && day_end){
            if(orderer){
                if(!express && !shop_number){
                    findMe = await profitIce.find({
                        Orderer:orderer,
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(8)"})
                        }
                }else if(express && shop_number){
                    findMe = await profitIce.find({
                        Orderer:orderer, 
                        express:express, 
                        shop_number:shop_number, 
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(11)"})
                        }
                }else if(express){
                    findMe = await profitIce.find({
                        Orderer:orderer, 
                        express:express, 
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(9)"})
                        }
                }else if(shop_number){
                    findMe = await profitIce.find({
                        Orderer:orderer, 
                        shop_number:shop_number, 
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                        if(findMe.length == 0){
                            return res
                                    .status(404)
                                    .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(10)"})
                        }
                }
            }else if(shop_number){
                if(!express){
                    findMe = await profitIce.find({
                        shop_number:shop_number, 
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(12)"})
                    }
                }else if(express){
                    findMe = await profitIce.find({
                        shop_number:shop_number, 
                        express:express, 
                        day:{ 
                                $gte: day_start, 
                                $lte: day_end 
                            }
                        })
                    if(findMe.length == 0){
                        return res
                                .status(404)
                                .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(13)"})
                    }
                }
            }else if(express){
                findMe = await profitIce.find({
                    express:express, 
                    day:{ 
                            $gte: day_start, 
                            $lte: day_end 
                        }
                    })
                if(findMe.length == 0){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(14)"})
                }
            }else{
                findMe = await profitIce.find({
                    day:{ 
                            $gte: day_start, 
                            $lte: day_end 
                        }
                    })
                if(findMe.length == 0){
                    return res
                            .status(404)
                            .send({status:false, message:"ไม่มีข้อมูลนี้ในระบบ(15)"})
                }
            }
        }else{
            return res  
                    .status(200)
                    .send({status:false, data:[]})
        }
        return res
                .status(200)
                .send({status:true, data:findMe})
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
        const findMe = await profitIce.find({type:"กำไรจากต้นทุน"})
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

getWithdrawal = async (req, res)=>{
    try{
        const getAll = await profitTemplate.find({status:"ขออนุมัติถอนเงิน"})
            if(!getAll){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่มีข้อมูลในระบบ"})
            }
        return res
                .status(200)
                .send({status:true, data:getAll})
    }catch(err){
        console.log("มีบางอย่างผิดพลาด")
        return res  
                .status(500)
                .send({status:false, message:err})
    }
}

module.exports = { getAll, getSumAdmin, getSumCod, getSumCost, getWithdrawal }