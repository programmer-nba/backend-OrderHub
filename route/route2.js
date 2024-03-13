const router = require('express').Router();
const shop = require('../Controllers/shop_partner/shopController')
const auth = require("../lib/auth");
const authAdmin = require('../lib/authAdmin');
const member_shop = require('../Controllers/shop_partner/memberShop');
const admin = require('../Controllers/adminController')
const dfd = require ('../Controllers/deliveryController/FLASH_EXPRESS/generate.sign')
const flash = require ('../Controllers/deliveryController/FLASH_EXPRESS/Order')
const partner = require('../Controllers/registerPartner');
const cost = require('../Controllers/cost_level/costPlus')
const ship = require('../Controllers/deliveryController/Shippop/ship.controller')
const percent = require('../Controllers/deliveryController/Shippop/percent.controller')
const FPSign = require('../Controllers/flashPay/generate.signFP')
const FP = require('../Controllers/flashPay/flash_pay.controller')

//SHOP
router.route('/orderhub/shop/post').post(auth.checkToken, shop.create)//ใช้กำหนด path
router.route('/orderhub/shop/update/:id').put(auth.checkToken, shop.updateShop)//ใช้กำหนด path
router.route('/orderhub/shop/del/:id').delete(auth.checkToken, shop.delend)//ใช้กำหนด path
router.route('/orderhub/shop/getMe').get(auth.checkToken, shop.getShopPartner )
router.route('/orderhub/shop/getMember/:id').get( shop.findShopMember )//ค้นหาพนักงานของช็อปนั้นๆว่ามีกี่คนและชื่ออะไรบ้าง
router.route('/orderhub/shopAdmin/getOne/:id').get( auth.checkToken, shop.getShopOne ) //ดึงข้อมูลร้านค้าเดียวที่สนใจ

//SHOP ADMIN
router.route('/orderhub/shopAdmin/getAll').get( authAdmin.checkToken, shop.getAll ) //ดึงข้อมูลร้านค้าทั้งหมดของทุกคน
router.route('/orderhub/shopAdmin/getPartner/:id').get( authAdmin.checkToken, shop.getShopPartnerByAdmin ) //ดึงข้อมูลร้านค้าทั้งหมดของคนๆนั้น
router.route('/orderhub/shopAdmin/confirmShop/:id').put( authAdmin.checkToken, admin.confirmShop ) //อนุมัติร้านค้า
router.route('/orderhub/shopAdmin/cancelShop/:id').put( authAdmin.checkToken, admin.cancelShop ) //ไม่อนุมัติร้านค้า

//MEMBER SHOP
router.route('/orderhub/member/create').post( member_shop.create )
router.route('/orderhub/member/getAll').get( member_shop.getAll )
router.route('/orderhub/member/getMe').get( auth.checkToken, member_shop.getMe )
router.route('/orderhub/member/del/:id').delete( member_shop.delend )
router.route('/orderhub/member/update/:id').put( member_shop.update )
router.route('/orderhub/member/approve/:id').put( partner.approveMemberShop )
router.route('/orderhub/member/cancel/:id').put( partner.cancelMemberShop )

//Flash Admin
router.route('/orderhub/flash/getAll').get( authAdmin.checkToken, flash.getAll )
router.route('/orderhub/flash/getOne/:pno').get( authAdmin.checkToken, flash.getById )
router.route('/orderhub/flash/del/:pno').delete( authAdmin.checkToken, flash.delend )
router.route('/orderhub/flash/getPartner/:id').get( authAdmin.checkToken, flash.getPartnerBooking )

//Flash express
router.route('/orderhub/flash/create').post( auth.checkToken, flash.createOrder )
router.route('/orderhub/flash/status').get( auth.checkToken, flash.statusOrder )
router.route('/orderhub/flash/getware').get( auth.checkToken, flash.getWareHouse )
router.route('/orderhub/flash/print180').post( auth.checkToken,flash.print100x180 )
router.route('/orderhub/flash/print75').post( auth.checkToken, flash.print100x75 )
router.route('/orderhub/flash/POD').get( auth.checkToken, flash.statusPOD )
router.route('/orderhub/flash/statusPack').get( auth.checkToken, flash.statusOrderPack )
router.route('/orderhub/flash/cancel').delete( auth.checkToken, flash.cancelOrder )
router.route('/orderhub/flash/notify').post( auth.checkToken, flash.notifyFlash )
router.route('/orderhub/flash/notification').get( auth.checkToken, flash.nontification )
router.route('/orderhub/flash/estimate').post( auth.checkToken, flash.estimateRate )
router.route('/orderhub/flash/getme').get( auth.checkToken, flash.getMeBooking )

//drop down ประเภทสินค้า flash express
const typeProduct = require('../Controllers/deliveryController/FLASH_EXPRESS/type.product')
router.route('/orderhub/flash/typeProduct/post').post( typeProduct.createType )
router.route('/orderhub/flash/typeProduct/get').get( typeProduct.getAll )
router.route('/orderhub/flash/typeProduct/edit/:code').put( typeProduct.edit )
router.route('/orderhub/flash/typeProduct/del/:code').delete( typeProduct.delend )
//drop down ประเภทขนส่ง flash express
const typeExpress = require('../Controllers/deliveryController/FLASH_EXPRESS/type.express')
router.route('/orderhub/flash/typeExpress/post').post( typeExpress.createType )
router.route('/orderhub/flash/typeExpress/get').get( typeExpress.getAll )
router.route('/orderhub/flash/typeExpress/edit/:code').put( typeExpress.edit )
router.route('/orderhub/flash/typeExpress/del/:code').delete( typeExpress.delend )

//cost level
router.route('/orderhub/cost/create').post( auth.checkToken, cost.create )
router.route('/orderhub/cost/edit').put( auth.checkToken, cost.editCostPlus )

//shippop admin
router.route('/orderhub/shippop/getAll').get( authAdmin.checkToken, ship.getAllBooking )
router.route('/orderhub/shippop/getOne/:tracking_code').get( authAdmin.checkToken, ship.getById )
router.route('/orderhub/shippop/del/:tracking_code').delete( authAdmin.checkToken, ship.delend )
router.route('/orderhub/shippop/getPartner/:id').get( authAdmin.checkToken, ship.getPartnerBooking )

//shippop
router.route('/orderhub/shippop/pricelist').post( auth.checkToken, ship.priceList )
router.route('/orderhub/shippop/booking').post( auth.checkToken, ship.booking )
router.route('/orderhub/shippop/cancel/:tracking_code').delete( auth.checkToken, ship.cancelOrder )
router.route('/orderhub/shippop/tracking/:id').get( auth.checkToken, ship.tracking )
router.route('/orderhub/shippop/confirm/:purchase_id').post( auth.checkToken, ship.confirmOrder )
router.route('/orderhub/shippop/callpick/:courier_tracking_code').post( auth.checkToken, ship.callPickup )
router.route('/orderhub/shippop/tracking_purchase/:purchase_id').get( auth.checkToken, ship.trackingPurchase )
router.route('/orderhub/shippop/lebelHtml').post( auth.checkToken, ship.labelHtml )
router.route('/orderhub/shippop/getme').get( auth.checkToken, ship.getMeBooking )

//percent
router.route('/orderhub/percent/create').post( authAdmin.checkToken, percent.create )
router.route('/orderhub/percent/getAll').get( authAdmin.checkToken, percent.getAll )
router.route('/orderhub/percent/getid/:id').get( authAdmin.checkToken, percent.getById )
router.route('/orderhub/percent/update/:id').put( authAdmin.checkToken, percent.update )
router.route('/orderhub/percent/del/:id').delete( authAdmin.checkToken, percent.delend )

//flash_pay
router.route('/orderhub/flashpay/qrcreate').post( auth.checkToken, FP.QRCreate )
router.route('/orderhub/flashpay/payment/results').get( auth.checkToken, FP.paymentResults )
router.route('/orderhub/flashpay/payment/transaction').get( auth.checkToken, FP.transactionResult )
router.route('/orderhub/flashpay/payment/notify').post( auth.checkToken, FP.notifyTransaction )
router.route('/orderhub/flashpay/payment/vertify').post( FP.vertifyNotify )

//shop history (ประวัติการเงินของแต่ละช็อป)
const historyShop = require('../Controllers/shop_partner/shop.history')
router.route('/orderhub/historyShop/getAll').get( historyShop.getAll )
router.route('/orderhub/historyShop/getOne/:shop_number').get( historyShop.getOne )

//J&T
const genKey = require('../Controllers/deliveryController/J&T/generate.signJ&T')
const JT = require('../Controllers/deliveryController/J&T/J&T.controller')
router.route('/orderhub/JT/create').post( auth.checkToken, JT.createOrder )
router.route('/orderhub/JT/tracking').get( auth.checkToken,JT.trackingOrder )
router.route('/orderhub/JT/cancel').delete( auth.checkToken, JT.cancelOrder )
router.route('/orderhub/JT/label').post( auth.checkToken, JT.label )
router.route('/orderhub/JT/price').post( auth.checkToken, JT.priceList )
router.route('/orderhub/JT/getme').get( auth.checkToken, JT.getMeBooking )

//J&T Admin
router.route('/orderhub/JT/getAll').get( authAdmin.checkToken, JT.getAll )
router.route('/orderhub/JT/getOne/:txlogisticid').get( authAdmin.checkToken, JT.getById )
router.route('/orderhub/JT/del/:txlogisticid').delete( authAdmin.checkToken, JT.delend )
router.route('/orderhub/JT/getPartner/:id').get( authAdmin.checkToken, JT.getPartnerBooking )

//COD(คุณไอซ์กำหนด)
const cod = require('../Controllers/deliveryController/COD/cod.controller')
router.route('/orderhub/cod/post').post( cod.createCOD )
router.route('/orderhub/cod/getAll').get( cod.getAll )
router.route('/orderhub/cod/edit/:id').put( cod.editCOD )
router.route('/orderhub/cod/del/:id').delete( cod.delend )

//กำหนักราคา/น้ำหนัก J&T
const priceWeight = require('../Controllers/deliveryController/J&T/priceWeight.control')
router.route('/orderhub/weight/post').post( priceWeight.createWeight )
router.route('/orderhub/weight/edit/:id').put( priceWeight.editWeight )
router.route('/orderhub/weight/getAll').get( priceWeight.getAll )
router.route('/orderhub/weight/del/:id').delete( priceWeight.delend )

//best express
const best = require('../Controllers/deliveryController/BEST_EXPRESS/best.controller')
router.route('/orderhub/best/post').post( auth.checkToken, best.createOrder )
router.route('/orderhub/best/postPDF').post( auth.checkToken, best.createPDFOrder )
router.route('/orderhub/best/status').get( auth.checkToken, best.statusOrder )
router.route('/orderhub/best/status/push').post( auth.checkToken, best.statusOrderPush )
router.route('/orderhub/best/cancel').delete( auth.checkToken, best.cancelOrder )
router.route('/orderhub/best/priceList').post( auth.checkToken, best.priceList )
router.route('/orderhub/best/getme').get( auth.checkToken, best.getMeBooking )
//กำหนดราคา/น้ำหนัก best express
const bestWeight = require('../Controllers/deliveryController/BEST_EXPRESS/priceWeightBest')
router.route('/orderhub/weightBest/post').post( bestWeight.createWeight )
router.route('/orderhub/weightBest/edit/:id').put( bestWeight.editWeight )
router.route('/orderhub/weightBest/getAll').get( bestWeight.getAll )
router.route('/orderhub/weightBest/del/:id').delete( bestWeight.delend )
//best Admin
router.route('/orderhub/best/getAll').get( authAdmin.checkToken, best.getAll )
router.route('/orderhub/best/getOne/:txLogisticId').get( authAdmin.checkToken, best.getById )
router.route('/orderhub/best/del/:txLogisticId').delete( authAdmin.checkToken, best.delend )
router.route('/orderhub/best/getPartner/:id').get( authAdmin.checkToken, best.getPartnerBooking )

//profit partner
const profitPN = require('../Controllers/profit/profit_partner')
router.route('/orderhub/profitPartner/getSumMe').get( auth.checkToken, profitPN.getSumForMe )

//profit admin(ICE)
const profitAM = require('../Controllers/profit/profit_ice')
router.route('/orderhub/profitPartner/getAll').get( authAdmin.checkToken, profitPN.getAll )//เรียกดูกำไร Partner ทุกคน
router.route('/orderhub/profitAdmin/getSumAdmin').get( authAdmin.checkToken, profitAM.getSumAdmin )
router.route('/orderhub/profitAdmin/getSumCOD').get( authAdmin.checkToken, profitAM.getSumCod )
router.route('/orderhub/profitAdmin/getSumCost').get( authAdmin.checkToken, profitAM.getSumCost )

//bank flashPay dropdown
const bank = require('../Controllers/bank/bank.flashP.dropdown')
router.route('/orderhub/bank/get/all').get( authAdmin.checkToken, bank.getAll )
router.route('/orderhub/bank/create').post( authAdmin.checkToken, bank.createBank )
router.route('/orderhub/bank/getAka/:aka').get( authAdmin.checkToken, bank.getByAKA )
router.route('/orderhub/bank/del/:id').delete( authAdmin.checkToken, bank.delendByAKA )
router.route('/orderhub/bank/edit/:id').put( authAdmin.checkToken, bank.updateBank )

//bank best dropdown
const bankBestDropDown = require('../Controllers/bank/bank.best.dropdown')
router.route('/orderhub/bankBest/get/all').get( auth.checkToken, bankBestDropDown.getAll )
router.route('/orderhub/bankBest/create').post( auth.checkToken, bankBestDropDown.createBank )
router.route('/orderhub/bankBest/getAka/:aka').get( auth.checkToken, bankBestDropDown.getByAKA )
router.route('/orderhub/bankBest/del/:id').delete( auth.checkToken, bankBestDropDown.delendByAKA )
router.route('/orderhub/bankBest/edit/:id').put( auth.checkToken, bankBestDropDown.updateBank )

//bank record
const bankRecord = require('../Controllers/bank/bank.record')
router.route('/orderhub/bankRecord/best/get/all').get( auth.checkToken, bankRecord.getAll )
router.route('/orderhub/bankRecord/best/create').post( auth.checkToken, bankRecord.createBank )
router.route('/orderhub/bankRecord/best/getId/:id').get( auth.checkToken, bankRecord.getPartnerByID )
router.route('/orderhub/bankRecord/best/del/:id').delete( auth.checkToken, bankRecord.delendByID )
router.route('/orderhub/bankRecord/best/edit/:id').put( auth.checkToken, bankRecord.updateBank )


module.exports = router;