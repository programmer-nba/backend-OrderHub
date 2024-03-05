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

//SHOP ADMIN
router.route('/orderhub/shopAdmin/getOne/:id').get( authAdmin.checkToken, shop.getShopOne ) //ดึงข้อมูลร้านค้าเดียวที่สนใจ
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
router.route('/orderhub/flash/status').get( flash.statusOrder )
router.route('/orderhub/flash/getware').get( flash.getWareHouse )
router.route('/orderhub/flash/print180').get( flash.print100x180 )
router.route('/orderhub/flash/print75').get( flash.print100x75 )
router.route('/orderhub/flash/POD').get( flash.statusPOD )
router.route('/orderhub/flash/statusPack').get( flash.statusOrderPack )
router.route('/orderhub/flash/cancel').delete( auth.checkToken, flash.cancelOrder )
router.route('/orderhub/flash/notify').post( flash.notifyFlash )
router.route('/orderhub/flash/notification').get( flash.nontification )
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
router.route('/orderhub/shippop/cancel/:id').delete( auth.checkToken, ship.cancelOrder )
router.route('/orderhub/shippop/tracking/:id').get( ship.tracking )
router.route('/orderhub/shippop/confirm/:purchase_id').post( auth.checkToken, ship.confirmOrder )
router.route('/orderhub/shippop/callpick/:courier_tracking_code').post( ship.callPickup )
router.route('/orderhub/shippop/tracking_purchase/:purchase_id').get( ship.trackingPurchase )
router.route('/orderhub/shippop/lebelHtml').post( ship.labelHtml )
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
router.route('/orderhub/JT/tracking').get( JT.trackingOrder )
router.route('/orderhub/JT/cancel').delete( auth.checkToken, JT.cancelOrder )
router.route('/orderhub/JT/label').post( JT.label )
router.route('/orderhub/JT/price').post( JT.priceList )
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
//กำหนดราคา/น้ำหนัก best express
const bestWeight = require('../Controllers/deliveryController/BEST_EXPRESS/priceWeightBest')
router.route('/orderhub/weightBest/post').post( bestWeight.createWeight )
router.route('/orderhub/weightBest/edit/:id').put( bestWeight.editWeight )
router.route('/orderhub/weightBest/getAll').get( bestWeight.getAll )
router.route('/orderhub/weightBest/del/:id').delete( bestWeight.delend )


module.exports = router;