shippop = async(req, res)=>{
    try{
        
                const role = req.decoded.role
                const formData = req.body
                const price = req.body.price
                const priceOne = req.body.priceOne
                const costHub = req.body.cost_hub
                const cost = req.body.cost
                const shop = req.body.shop_id
        
                const fee_cod = req.body.fee_cod
                const total = req.body.total
        
                const weight = req.body.parcel.weight * 1000
                const id = req.decoded.userid
                const cod_amount = req.body.cod_amount
                const shop_id = req.body.shop_id
                formData.parcel.weight = weight
                const data = [{...formData}] //, courier_code:courierCode
        
                const invoice = await invoiceNumber()
                console.log(invoice)
                const findShop = await shopPartner.findOne({shop_number:shop_id})
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่มีหมายเลขร้านค้าที่ท่านกรอก"})
                }
                //ผู้ส่ง
                const sender = data[0].from; //ผู้ส่ง
                const filterSender = { shop_id: shop_id , tel: sender.tel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
        
                const updatedDocument = await dropOffs.findOne(filterSender);
                    if(!updatedDocument){
                        return res 
                                .status(404)
                                .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
                    }
                
                const value = {
                    api_key: process.env.SHIPPOP_API_KEY,
                    email: "OrderHUB@gmail.com",
                    url: {
                        "success": "http://shippop.com/?success",
                        "fail": "http://shippop.com/?fail"
                    },
                    data: data,
                    force_confirm: 1
                };
                
                const resp = await axios.post(`${process.env.SHIPPOP_URL}/booking/`,value,
                    {
                      headers: {"Accept-Encoding": "gzip,deflate,compress",
                                "Content-Type": "application/json"},
                    }
                  );
                    if (!resp.data.status) {
                        return res
                                .status(400)
                                .send({status: false, message: resp.data.data[0]});
                    }
                const Data = resp.data.data[0]
                const parcel = data[0].parcel
                const new_data = []
                const v = {
                        ...Data,
                        invoice: invoice,
                        ID: id,
                        role: role,
                        purchase_id: String(resp.data.purchase_id),
                        shop_id: req.body.shop_id,
                        cost_hub: costHub,
                        cost: cost,
                        fee_cod: fee_cod,
                        total: total,
                        parcel: parcel,
                        priceOne: priceOne,
                        price: Number(price.toFixed()),
                  };
                 new_data.push(v);
                const booking_parcel = await BookingParcel.create(v);
                    if(!booking_parcel){
                        console.log("ไม่สามารถสร้างข้อมูล booking ได้")
                    }
                //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
                let profitsPartner
                    if(priceOne == 0){ //กรณีไม่ใช่ พาร์ทเนอร์ลูก
                        profitsPartner = price - cost
                    }else{
                        profitsPartner = price - priceOne
                    }
                let profitsPartnerOne 
                    if(priceOne != 0){
                        profitsPartnerOne = priceOne - cost
                    }
                let profitsICE = cost - costHub //SHIPPOP ราคาต้นทุน(costHub) ที่ให้มาไม่มีทศนิยมอย่างแน่นอน ดังนั้นไม่จำเป็นต้องปัดเศษ หรือ ใส่ทศนิยม
                let profit_partner
                let profit_partnerOne
                let profit_ice
                let profit_iceCOD
                let profitSender
                let historyShop
                let findShopForCredit
                let profitPlus
                let profitPlusOne
                if(cod_amount == 0){
                            findShopForCredit = await shopPartner.findOneAndUpdate(
                                {shop_number:shop},
                                { $inc: { credit: -total } },
                                {new:true})
                                if(!findShopForCredit){
                                    return res
                                            .status(400)
                                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                                }
                            console.log(findShopForCredit.credit)
                                
                            const plus = findShopForCredit.credit + total
                            const history = {
                                    ID: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    amount: total,
                                    before: plus,
                                    after: findShopForCredit.credit,
                                    type: booking_parcel.courier_code,
                                    remark: "ขนส่งสินค้า(SHIPPOP)"
                                }
                            
                            // console.log(history)
                            historyShop = await historyWalletShop.create(history)
                                if(!historyShop){
                                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                                }
                            const pf = {
                                    wallet_owner: findShopForCredit.partnerID,
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: profitsPartner,
                                    express: booking_parcel.courier_code,
                                    type: 'โอนเงิน',
                            }
                            profit_partner = await profitPartner.create(pf)
                                if(!profit_partner){
                                    return  res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                                }
                            profitPlus = await Partner.findOneAndUpdate(
                                    {_id:findShopForCredit.partnerID},
                                    { $inc: { profit: +profitsPartner } },
                                    {new:true, projection: { profit: 1 }})
                                    if(!profitPlus){
                                        return res
                                                .status(400)
                                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                    }
                            const pfICE = {
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: profitsICE,
                                    express: booking_parcel.courier_code,
                                    type: 'กำไรจากต้นทุน',
                            }
                            profit_ice = await profitIce.create(pfICE)
                                if(!profit_ice){
                                    return res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                                }
                            if(priceOne != 0){
                                const findUpline = await Partner.findOne({_id:findShopForCredit.partnerID})
                                const headLine = findUpline.upline.head_line
            
                                const pfPartnerOne = {
                                            wallet_owner: headLine,
                                            Orderer: id,
                                            role: role,
                                            shop_number: shop,
                                            orderid: booking_parcel.tracking_code,
                                            profit: profitsPartnerOne,
                                            express: booking_parcel.courier_code,
                                            type: 'Partner downline',
                                        }
                                profit_partnerOne = await profitPartner.create(pfPartnerOne)
                                    if(!profit_partnerOne){
                                        return  res
                                                .status(400)
                                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                                    }
                                profitPlusOne = await Partner.findOneAndUpdate(
                                        {_id:headLine},
                                        { $inc: { profit: +profitsPartnerOne } },
                                        {new:true, projection: { profit: 1 }})
                                        if(!profitPlusOne){
                                            return res
                                                    .status(400)
                                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                        }
                                }
                }else{ 
                        const findShopTwo = await shopPartner.findOneAndUpdate(
                            {shop_number:shop},
                            { $inc: { credit: -total } },
                            {new:true})
                            if(!findShopTwo){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                            }
                        console.log(findShopTwo.credit)
                            
                        const plus = findShopTwo.credit + total
                            const historytwo = {
                                ID: id,
                                role: role,
                                shop_number: shop,
                                orderid: booking_parcel.tracking_code,
                                amount: total,
                                before: plus,
                                after: findShopTwo.credit,
                                type: booking_parcel.courier_code,
                                remark: "ขนส่งสินค้าแบบ COD(SHIPPOP)"
                            }
                            // console.log(history)
                            historyShop = await historyWalletShop.create(historytwo)
                                if(!historyShop){
                                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                                }
                            const pf = {
                                    wallet_owner: findShopTwo.partnerID,
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: profitsPartner,
                                    express: booking_parcel.courier_code,
                                    type: 'COD',
                            }
                            profit_partner = await profitPartner.create(pf)
                                if(!profit_partner){
                                    return  res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                                }
                            profitPlus = await Partner.findOneAndUpdate(
                                    {_id:findShopTwo.partnerID},
                                    { $inc: { profit: +profitsPartner } },
                                    {new:true, projection: { profit: 1 }})
                                    if(!profitPlus){
                                        return res
                                                .status(400)
                                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                    } 
        
                            const pfICE = {
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: profitsICE,
                                    express: booking_parcel.courier_code,
                                    type: 'กำไรจากต้นทุน',
                            }
                            profit_ice = await profitIce.create(pfICE)
                                if(!profit_ice){
                                    return res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                                }
                            const pfIceCOD = {
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: fee_cod,
                                    express: booking_parcel.courier_code,
                                    type: 'COD',
                            }
                            profit_iceCOD = await profitIce.create(pfIceCOD)
                                if(!profit_iceCOD){
                                    return res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                                }
                            const pfIceSender = {
                                    Orderer: id,
                                    role: role,
                                    shop_number: shop,
                                    orderid: booking_parcel.tracking_code,
                                    profit: cod_amount,
                                    express: booking_parcel.courier_code,
                                    type: 'COD(SENDER)',
                                    'bookbank.name': updatedDocument.flash_pay.name,
                                    'bookbank.card_number': updatedDocument.flash_pay.card_number,
                                    'bookbank.aka': updatedDocument.flash_pay.aka,
                                    status:"รอดำเนินการ"
                            }
                            profitSender = await profitIce.create(pfIceSender)
                                if(!profitSender){
                                    return res
                                            .status(400)
                                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                                }
                            if(priceOne != 0){
                                const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                                const headLine = findUpline.upline.head_line
        
                                const pfPartnerOne = {
                                        wallet_owner: headLine,
                                        Orderer: id,
                                        role: role,
                                        shop_number: shop,
                                        orderid: booking_parcel.tracking_code,
                                        profit: profitsPartnerOne,
                                        express: booking_parcel.courier_code,
                                        type: 'Partner downline',
                                    }
                                profit_partnerOne = await profitPartner.create(pfPartnerOne)
                                    if(!profit_partnerOne){
                                        return  res
                                                .status(400)
                                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                                    }
                                profitPlusOne = await Partner.findOneAndUpdate(
                                        {_id:headLine},
                                        { $inc: { profit: +profitsPartnerOne } },
                                        {new:true, projection: { profit: 1 }})
                                        if(!profitPlusOne){
                                            return res
                                                    .status(400)
                                                    .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                                        }
                            }
                }
                return res
                        .status(200)
                        .send({
                            status:true, 
                            order: booking_parcel,
                            history: historyShop,
                            // shop: findShopForCredit
                            profitP: profit_partner,
                            profitPartnerOne: profit_partnerOne,
                            profitIce: profit_ice,
                            profitSender: profitSender,
                            profitIceCOD: profit_iceCOD,
                            profitPlus: profitPlus,
                            profitPlusOne: profitPlusOne
                        })
    }catch(err){
        console.log(err)
    }
}
flash = async(req, res)=>{
    try{
        const apiUrl = process.env.TRAINING_URL
        const id = req.decoded.userid
        const role = req.decoded.role
        const mchId = process.env.MCH_ID
        const cost = req.body.cost
        const weight = req.body.weight * 1000
        const cost_hub = req.body.cost_hub

        const fee_cod = req.body.fee_cod
        const total = req.body.total

        const priceOne = req.body.priceOne
        const codForPrice = req.body.codForPrice
        const price = req.body.price
        const shop = req.body.shop_number
        let cod_amount = Math.ceil(codForPrice)*100 //ทำ cod_amount เป็นหน่วย สตางค์ และปัดเศษขึ้น เพื่อให้ยิง flash ได้(flash ไม่รับ COD AMOUNT เป็น ทศนิยม)
        let cod_integer = cod_amount / 100 //ทำ cod_amount เป็นหน่วย บาท เพื่อบันทึกลง database(จะได้ดูง่าย)

        const invoice = await invoiceNumber()
        // console.log(cod_integer, codForPrice)
        const formData = {
            mchId: mchId,
            nonceStr: nonceStr,
            outTradeNo: `${nonceStr}`,
            codEnabled: 0,
            weight: weight,
            ...req.body
            // เพิ่ม key-value pairs ตามต้องการ
          };
        if(codForPrice != 0){
            formData.codEnabled = 1
            formData.codAmount = cod_amount;
            // console.log(cod_amount)
        }

        //ผู้ส่ง
        const senderTel = req.body.srcPhone; //ผู้ส่ง
        const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า

        const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        
        const newData = await generateSign(formData)
        const formDataOnly = newData.formData
            // console.log(formDataOnly)
        const response = await axios.post(`${apiUrl}/open/v3/orders`,querystring.stringify(formDataOnly),{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
        if(response.data.code !== 1){
            return res
                    .status(400)
                    .send({status:false, data:response.data})
        }

        const new_data = {
            from: {
              srcName: req.body.srcName, 
              srcPhone: req.body.srcPhone,
              srcProvinceName: req.body.srcProvinceName,
              srcCityName: req.body.srcCityName,
              srcDistrictName: req.body.srcDistrictName,
              srcPostalCode: req.body.srcPostalCode,
              srcDetailAddress: req.body.srcDetailAddress
            },
            to: {
              dstName: req.body.dstName, 
              dstPhone: req.body.dstPhone,
              dstHomePhone: req.body.dstHomePhone,
              dstProvinceName: req.body.dstProvinceName,
              dstCityName: req.body.dstCityName,
              dstDistrictName: req.body.dstDistrictName,
              dstPostalCode: req.body.dstPostalCode,
              dstDetailAddress: req.body.dstDetailAddress
            },
            parcel: {
              weight: req.body.weight, 
              width: req.body.width,
              length: req.body.length,
              height: req.body.height,
              expressCategory: req.body.expressCategory,
              articleCategory: req.body.articleCategory,
            },
            return: {
              returnName: req.body.returnName, 
              returnPhone: req.body.returnPhone,
              returnProvinceName: req.body.returnProvinceName,
              returnCityName: req.body.returnCityName,
              returnPostalCode: req.body.returnPostalCode,
              returnDetailAddress: req.body.returnDetailAddress,
            },
            response: {
              ...response.data.data,
              invoice: invoice
            },
            ID: id,
            shop_number: shop,
            role: role,
            cost_hub: cost_hub,
            cost: cost,
            priceOne: priceOne,
            price: price,
            codAmount: codForPrice,
            total: total,
            fee_cod: fee_cod
          };

        //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
        let profitsPartner
            if(priceOne == 0){ //กรณีไม่ใช่ พาร์ทเนอร์ลูก
                profitsPartner = price - cost
            }else{
                profitsPartner = price - priceOne
            }
        let profitsPartnerOne 
            if(priceOne != 0){
                profitsPartnerOne = priceOne - cost
            }

        let profitsICE = cost - cost_hub
        profitsICE = parseFloat(profitsICE.toFixed(2)); //FLASH ราคาต้นทุน(cost_hub) ที่ FLASH ให้มามีทศนิยม ดังนั้นจึงจำเป็นต้อง ใส่ทศนิยม
        let profit_partnerOne
        let profit_partner
        let profit_ice
        let profit_iceCOD
        if(codForPrice == 0){
            const findShop = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -total } },
                {new:true})
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            // console.log(findShop.credit)
            const create = await flashOrder.create(new_data)
                if(!create){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                }
            const plus = findShop.credit + total
            const history = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    amount: total,
                    before: plus,
                    after: findShop.credit,
                    type: 'FLE(ICE)',
                    remark: "ขนส่งสินค้า(FLASH)"
                }
            const historyShop = await historyWalletShop.create(history)
                if(!historyShop){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsPartner,
                    express: 'FLE(ICE)',
                    type: 'โอนเงิน',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }
            const profitPlus = await Partner.findOneAndUpdate(
                    {_id:findShop.partnerID},
                    { $inc: { profit: +profitsPartner } },
                    {new:true, projection: { profit: 1 }})
                    if(!profitPlus){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                    }
            const pfICE = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsICE,
                    express: 'FLE(ICE)',
                    type: 'กำไรจากต้นทุน',
            }
            profit_ice = await profitIce.create(pfICE)
                if(!profit_ice){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                }

            let profitPlusOne
            if(priceOne != 0){
                const findUpline = await Partner.findOne({_id:findShop.partnerID})
                const headLine = findUpline.upline.head_line

                const pfPartnerOne = {
                                wallet_owner: headLine,
                                Orderer: id,
                                role: role,
                                shop_number: shop,
                                orderid: create.response.pno,
                                profit: profitsPartnerOne,
                                express: 'FLE(ICE)',
                                type: 'Partner downline',
                        }
                profit_partnerOne = await profitPartner.create(pfPartnerOne)
                        if(!profit_partnerOne){
                            return  res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                        }
                profitPlusOne = await Partner.findOneAndUpdate(
                            {_id:headLine},
                            { $inc: { profit: +profitsPartnerOne } },
                            {new:true, projection: { profit: 1 }})
                            if(!profitPlusOne){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                            }
            
            }
            return res
                    .status(200)
                    .send({
                        status:true, message:"เชื่อมต่อสำเร็จ", 
                        data: create,
                        // shop: findShop,
                        history: historyShop,
                        profitP: profit_partner,
                        profitPartnerOne: profit_partnerOne,
                        profitIce: profit_ice,
                        profitPlus: profitPlus,
                        profitPlusOne: profitPlusOne
                    })

        }else if(codForPrice != 0){
            new_data.codAmount = cod_integer;
            console.log(cod_integer)

            const create = await flashOrder.create(new_data)
                if(!create){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถสร้างข้อมูลได้"})
                }
            const findShopTwo = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -total } },
                {new:true})
                if(!findShopTwo){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShopTwo.credit)
                    
            const plus = findShopTwo.credit + total
            const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    amount: total,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'FLE(ICE)',
                    remark: "ขนส่งสินค้าแบบ COD(FLASH)"
            }
            // console.log(history)
            const historyShop2 = await historyWalletShop.create(historytwo)
                if(!historyShop2){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShopTwo.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsPartner,
                    express: 'FLE(ICE)',
                    type: 'COD',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }

            const profitPlus = await Partner.findOneAndUpdate(
                    {_id:findShopTwo.partnerID},
                    { $inc: { profit: +profitsPartner } },
                    {new:true, projection: { profit: 1 }})
                    if(!profitPlus){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                    }

            const pfICE = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: profitsICE,
                    express: 'FLE(ICE)',
                    type: 'กำไรจากต้นทุน',
            }
            profit_ice = await profitIce.create(pfICE)
                if(!profit_ice){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                }
            const pfIceCOD = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: fee_cod,
                    express: 'FLE(ICE)',
                    type: 'COD',
            }
            profit_iceCOD = await profitIce.create(pfIceCOD)
                if(!profit_iceCOD){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                }
            let profitPlusOne
            if(priceOne != 0){
                    const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                    const headLine = findUpline.upline.head_line

                    const pfPartnerOne = {
                            wallet_owner: headLine,
                            Orderer: id,
                            role: role,
                            shop_number: shop,
                            orderid: create.response.pno,
                            profit: profitsPartnerOne,
                            express: 'FLE(ICE)',
                            type: 'Partner downline',
                        }
                    profit_partnerOne = await profitPartner.create(pfPartnerOne)
                        if(!profit_partnerOne){
                            return  res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                        }

                    profitPlusOne = await Partner.findOneAndUpdate(
                            {_id:headLine},
                            { $inc: { profit: +profitsPartnerOne } },
                            {new:true, projection: { profit: 1 }})
                            if(!profitPlusOne){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                            }
                }
            const pfIceSender = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: create.response.pno,
                    profit: codForPrice,
                    express: 'FLE(ICE)',
                    type: 'COD(SENDER)',
                    'bookbank.name': updatedDocument.flash_pay.name,
                    'bookbank.card_number': updatedDocument.flash_pay.card_number,
                    'bookbank.aka': updatedDocument.flash_pay.aka,
                }
            const profitSender = await profitIce.create(pfIceSender)
                    if(!profitSender){
                        return res
                                .status(400)
                                .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                    }
            return res
                    .status(200)
                    .send({
                        status:true, message:"เชื่อมต่อสำเร็จ", 
                        data: create,
                        history: historyShop2,
                        profitPartner: profit_partner,
                        profitPartnerOne: profit_partnerOne,
                        profitIce: profit_ice,
                        profitSender: profitSender,
                        profitIceCOD: profit_iceCOD,
                        profitPlus: profitPlus,
                        profitPlusOne: profitPlusOne
                    })
        }
    }catch(err){
        console.log(err)
    }
}
JNT = async(req, res)=>{
    try{
        const id = req.decoded.userid
        const role = req.decoded.role
        const data = req.body
        const cod_amount = req.body.cod_amount
        const price = req.body.price
        const cost = req.body.cost
        const cost_hub = req.body.cost_hub

        const fee_cod = req.body.fee_cod
        const total = req.body.total

        const priceOne = req.body.priceOne
        const shop = req.body.shop_number
        const weight = data.parcel.weight //หน่วยเป็น kg อยู่แล้วไม่ต้องแก้ไข
        const txlogisticid = await invoiceNumber(dayjsTimestamp); //เข้า function gen หมายเลขรายการ
            console.log('invoice : '+txlogisticid);
        const invoice = await invoiceJNT()
        const fromData = {
            "logistics_interface" :{
                "actiontype": "add",
                "customerid": customer_id,
                "txlogisticid": txlogisticid,
                "ordertype": "1",
                "servicetype": "6",
                "deliverytype": "1",
                "sender":{
                    "name": data.from.name,
                    "postcode": data.from.postcode,
                    "mobile": data.from.tel, //required 
                    "city": data.from.province,
                    "area": data.from.state,
                    "address": data.from.address + " ตำบล " + data.from.district
                },
                "receiver":{
                    "name": data.to.name,
                    "postcode": data.to.postcode,
                    "mobile": data.to.tel, //required 
                    "city": data.to.province,
                    "area": data.to.state,
                    "address": data.to.address + " ตำบล " + data.to.district
                },
                "createordertime": dayTime,
                "sendstarttime": dayTime,
                "sendendtime": dayTime,
                "paytype": "1",
                "weight": weight,
                "length": data.parcel.length,
                "width": data.parcel.width,
                "height": data.parcel.height,
                "isinsured": "0",
                // "offerfee": "2000"
            },
            "msg_type": "ORDERCREATE",
            "eccompanyid": ecom_id,
        }
        if(cod_amount != 0){
            fromData.logistics_interface.itemsvalue = cod_amount
            console.log(cod_amount)
        }
         //ผู้ส่ง
         const senderTel = data.from.tel;
         console.log(senderTel)
         const filterSender = { shop_id: shop , tel: senderTel, status: 'ผู้ส่ง' }; //เงื่อนไขที่ใช้กรองว่ามีใน database หรือเปล่า
 
         const updatedDocument = await dropOffs.findOne(filterSender);
            if(!updatedDocument){
                return res 
                        .status(404)
                        .send({status:false, message:"ไม่สามารถค้นหาเอกสารผู้ส่งได้"})
            }
        // console.log(updatedDocument)
        const newData = await generateJT(fromData)
            // console.log(newData)
        const response = await axios.post(`${apiUrl}/order/create`,newData,{
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
        })
            if(!response){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถส่งคำร้องขอไปยัง J&T ได้"})
            }else if(response.data.responseitems[0].reason == "S10"){
                return res
                        .status(404)
                        .send({status:false, message:"หมายเลขรหัสการสั่งซื้อเกิดการซ้ำกัน กรุณากดสร้างสินค้าอีกครั้ง"})
            }else if(response.data.responseitems[0].reason == "B0101"){
                return res
                        .status(404)
                        .send({status:false, message:"กรุณาใส่หมายเลขโทรศัพท์ให้ถูกต้อง(10 หลัก)"})
            }
        const new_data = response.data.responseitems[0]
        const createOrder = await jntOrder.create(
            {
                ID:id,
                shop_number:shop,
                role:role,
                from:{
                    ...data.from
                },
                to:{
                    ...data.to
                },
                parcel:{
                    ...data.parcel
                },
                invoice: invoice,
                status:'booking',
                cod_amount:cod_amount,
                fee_cod: fee_cod,
                total: total,
                price: price,
                ...new_data
            })
            if(!createOrder){
                return res
                        .status(404)
                        .send({status:false, message:"ไม่สามารถสร้างออเดอร์ได้"})
            }
        //priceOne คือราคาที่พาร์ทเนอร์คนแรกได้ เพราะงั้น ถ้ามี priceOne แสดงว่าคนสั่ง order มี upline ของตนเอง
        let profitsPartner
            if(priceOne == 0){ //กรณีไม่ใช่ พาร์ทเนอร์ลูก
                profitsPartner = price - cost
            }else{
                profitsPartner = price - priceOne
            }
        let profitsPartnerOne 
            if(priceOne != 0){
                profitsPartnerOne = priceOne - cost
            }
        let profitsICE = cost - cost_hub
        let profit_partner
        let profit_partnerOne
        let profit_ice
        let profit_iceCOD
        let profitSender
        let historyShop
        let findShop
        let profitPlus
        let profitPlusOne
        if(cod_amount == 0){
            findShop = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -total } },
                {new:true})
                if(!findShop){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShop.credit)
                
            const plus = findShop.credit + total
            const history = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    amount: total,
                    before: plus,
                    after: findShop.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้า(J&T)"
                }
            // console.log(history)
            historyShop = await historyWalletShop.create(history)
                if(!historyShop){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShop.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: profitsPartner,
                    express: 'J&T',
                    type: 'โอนเงิน',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }

            profitPlus = await Partner.findOneAndUpdate(
                    {_id:findShop.partnerID},
                    { $inc: { profit: +profitsPartner } },
                    {new:true, projection: { profit: 1 }})
                    if(!profitPlus){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                    }

            const pfICE = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: profitsICE,
                    express: 'J&T',
                    type: 'กำไรจากต้นทุน',
            }
            profit_ice = await profitIce.create(pfICE)
                if(!profit_ice){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                }

            if(priceOne != 0){
                    const findUpline = await Partner.findOne({_id:findShop.partnerID})
                    const headLine = findUpline.upline.head_line

                    const pfPartnerOne = {
                                wallet_owner: headLine,
                                Orderer: id,
                                role: role,
                                shop_number: shop,
                                orderid: new_data.txlogisticid,
                                profit: profitsPartnerOne,
                                express: 'J&T',
                                type: 'Partner downline',
                            }
                    profit_partnerOne = await profitPartner.create(pfPartnerOne)
                        if(!profit_partnerOne){
                            return  res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                        }
                    profitPlusOne = await Partner.findOneAndUpdate(
                            {_id:headLine},
                            { $inc: { profit: +profitsPartnerOne } },
                            {new:true, projection: { profit: 1 }})
                            if(!profitPlusOne){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                            }
                    }
        }else{
            const findShopTwo = await shopPartner.findOneAndUpdate(
                {shop_number:shop},
                { $inc: { credit: -total } },
                {new:true})
                if(!findShopTwo){
                    return res
                            .status(400)
                            .send({status:false, message:"ไม่สามารถค้นหาร้านเจอ"})
                }
            console.log(findShopTwo.credit)
    
            const plus = findShopTwo.credit + total
            const historytwo = {
                    ID: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    amount: total,
                    before: plus,
                    after: findShopTwo.credit,
                    type: 'J&T',
                    remark: "ขนส่งสินค้าแบบ COD(J&T)"
            }
            // console.log(history)
            historyShop = await historyWalletShop.create(historytwo)
                if(!historyShop){
                    console.log("ไม่สามารถสร้างประวัติการเงินของร้านค้าได้")
                }

            const pf = {
                    wallet_owner: findShopTwo.partnerID,
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: profitsPartner,
                    express: 'J&T',
                    type: 'COD',
            }
            profit_partner = await profitPartner.create(pf)
                if(!profit_partner){
                    return  res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner ได้"})
                }
            profitPlus = await Partner.findOneAndUpdate(
                    {_id:findShopTwo.partnerID},
                    { $inc: { profit: +profitsPartner } },
                    {new:true, projection: { profit: 1 }})
                    if(!profitPlus){
                        return res
                                .status(400)
                                .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                    } 
            const pfICE = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: profitsICE,
                    express: 'J&T',
                    type: 'กำไรจากต้นทุน',
            }
            profit_ice = await profitIce.create(pfICE)
                if(!profit_ice){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของคุณไอซ์ได้"})
                }
            const pfIceCOD = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: fee_cod,
                    express: 'J&T',
                    type: 'COD',
            }
            profit_iceCOD = await profitIce.create(pfIceCOD)
                if(!profit_iceCOD){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                }

            const pfIceSender = {
                    Orderer: id,
                    role: role,
                    shop_number: shop,
                    orderid: new_data.txlogisticid,
                    profit: cod_amount,
                    express: 'J&T',
                    type: 'COD(SENDER)',
                    'bookbank.name': updatedDocument.flash_pay.name,
                    'bookbank.card_number': updatedDocument.flash_pay.card_number,
                    'bookbank.aka': updatedDocument.flash_pay.aka,
            }
            profitSender = await profitIce.create(pfIceSender)
                if(!profitSender){
                    return res
                            .status(400)
                            .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการ COD ของคุณไอซ์ได้"})
                }
            if(priceOne != 0){
                    const findUpline = await Partner.findOne({_id:findShopTwo.partnerID})
                    const headLine = findUpline.upline.head_line

                    const pfPartnerOne = {
                            wallet_owner: headLine,
                            Orderer: id,
                            role: role,
                            shop_number: shop,
                            orderid: new_data.txlogisticid,
                            profit: profitsPartnerOne,
                            express: 'J&T',
                            type: 'Partner downline',
                        }
                    profit_partnerOne = await profitPartner.create(pfPartnerOne)
                        if(!profit_partnerOne){
                            return  res
                                    .status(400)
                                    .send({status:false, message: "ไม่สามารถสร้างประวัติผลประกอบการของ Partner Upline ได้"})
                        }
                    profitPlusOne = await Partner.findOneAndUpdate(
                            {_id:headLine},
                            { $inc: { profit: +profitsPartnerOne } },
                            {new:true, projection: { profit: 1 }})
                            if(!profitPlusOne){
                                return res
                                        .status(400)
                                        .send({status:false, message:"ไม่สามารถค้นหา Partner เจอ"})
                            }
                }
        }
        
        return res
                .status(200)
                .send({
                    status:true, 
                    order: response.data,
                    history: historyShop,
                    // shop: findShop,
                    profitP: profit_partner,
                    profitPartnerOne: profit_partnerOne,
                    profitIce: profit_ice,
                    profitSender: profitSender,
                    profitIceCOD: profit_iceCOD,
                    profitPlus: profitPlus,
                    profitPlusOne: profitPlusOne
                })
    }catch(err){
        console.log(err)
    }
}
