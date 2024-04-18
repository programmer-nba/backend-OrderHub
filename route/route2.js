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
router.route('/orderhub/shop/post/:id_shop').post(auth.checkToken, shop.create)//ใช้กำหนด path
router.route('/orderhub/shop/update/:id').put(auth.checkToken, shop.updateShop)//ใช้กำหนด path
router.route('/orderhub/shop/del/:id').delete(auth.checkToken, shop.delend)//ใช้กำหนด path
router.route('/orderhub/shop/getMe').get(auth.checkToken, shop.getShopPartner )
router.route('/orderhub/shop/getMember/:id').get( shop.findShopMember )//ค้นหาพนักงานของช็อปนั้นๆว่ามีกี่คนและชื่ออะไรบ้าง
router.route('/orderhub/shop/upPicture/:id').post( auth.checkToken, shop.uploadPicture )//อัพโหลดรูปภาพ
router.route('/orderhub/shop/getOne/:id').get( auth.checkToken, shop.getShopOne ) //ดึงข้อมูลร้านค้าเดียวที่สนใจ
router.route('/orderhub/shop/tranfer/shop/:id_shop').put( auth.checkToken, shop.tranfersCreditsToShop ) //ย้ายเงินจาก partner เข้า shop ที่ต้องการ
router.route('/orderhub/shop/tranfer/partner/:id_shop').put( auth.checkToken, shop.tranfersShopToPartner )//ย้ายเงินจาก shop กลับเข้า partner ที่ต้องการ
router.route('/orderhub/shop/update/express/:id_shop').put( auth.checkToken, shop.editExpress )
router.route('/orderhub/shop/update/expressAll/:id_shop').put( auth.checkToken, shop.editExpressAll )
router.route('/orderhub/shop/edit/weight/').put( auth.checkToken, shop.fixNameExpress )
router.route('/orderhub/shop/updateContract').put( authAdmin.checkToken, shop.statusContract )

//SHOP ADMIN
router.route('/orderhub/shopAdmin/getAll').get( auth.checkToken, shop.getAll ) //ดึงข้อมูลร้านค้าทั้งหมดของทุกคน
router.route('/orderhub/shopAdmin/getPartner/:id').get( authAdmin.checkToken, shop.getShopPartnerByAdmin ) //ดึงข้อมูลร้านค้าทั้งหมดของคนๆนั้น
router.route('/orderhub/shopAdmin/confirmShop/:id').put( authAdmin.checkToken, admin.confirmShop ) //อนุมัติร้านค้า
router.route('/orderhub/shopAdmin/cancelShop/:id').put( authAdmin.checkToken, admin.cancelShop ) //ไม่อนุมัติร้านค้า

//MEMBER SHOP
router.route('/orderhub/member/create').post( member_shop.create )
router.route('/orderhub/member/getAll').get( member_shop.getAll )
router.route('/orderhub/member/getMe').get( auth.checkToken, member_shop.getMe )
router.route('/orderhub/member/del/:id').delete( member_shop.delend )
router.route('/orderhub/member/update/:id').put( member_shop.update )
router.route('/orderhub/member/get/:id').get( auth.checkToken, member_shop.getByID )
router.route('/orderhub/member/approve/:id').put( partner.approveMemberShop )
router.route('/orderhub/member/cancel/:id').put( partner.cancelMemberShop )
router.route('/orderhub/member/getPNM').get( member_shop.getMemberPartner )

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
router.route('/orderhub/flash/getById/:pno').get( auth.checkToken, flash.getById )

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
router.route('/orderhub/cost/upline/:id').get( auth.checkToken, cost.getUplineById )

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
router.route('/orderhub/shippop/getArray').get( auth.checkToken, ship.getOrderDay )
router.route('/orderhub/shippop/getTracking/:tracking_code').get( auth.checkToken, ship.getOrderByTracking )
router.route('/orderhub/shippop/pricelist/test').post( auth.checkToken, ship.priceListTest )

//percent
router.route('/orderhub/percent/create').post( authAdmin.checkToken, percent.create )
router.route('/orderhub/percent/getAll').get( authAdmin.checkToken, percent.getAll )
router.route('/orderhub/percent/getid/:id').get( authAdmin.checkToken, percent.getById )
router.route('/orderhub/percent/update/:id').put( authAdmin.checkToken, percent.update )
router.route('/orderhub/percent/del/:id').delete( authAdmin.checkToken, percent.delend )

//flash_pay
router.route('/orderhub/flashpay/qrcreate').post( auth.checkToken, FP.QRCreate )
router.route('/orderhub/flashpay/payment/results').post( auth.checkToken, FP.paymentResults )
router.route('/orderhub/flashpay/payment/transaction').get( auth.checkToken, FP.transactionResult )
router.route('/orderhub/flashpay/payment/notify').post( auth.checkToken, FP.notifyTransaction )
// router.route('/orderhub/flashpay/payment/vertify').post( FP.vertifyNotify )

//shop history (ประวัติการเงินของแต่ละช็อป)
const historyShop = require('../Controllers/shop_partner/shop.history')
router.route('/orderhub/historyShop/getAll').get( historyShop.getAll )
router.route('/orderhub/historyShop/getOne/:shop_number').get( historyShop.getOne )
router.route('/orderhub/historyShop/getId/:id').get( auth.checkToken, historyShop.getById )

//J&T
const genKey = require('../Controllers/deliveryController/J&T/generate.signJ&T')
const JT = require('../Controllers/deliveryController/J&T/J&T.controller')
router.route('/orderhub/JT/create').post( auth.checkToken, JT.createOrder )
router.route('/orderhub/JT/tracking').get( auth.checkToken,JT.trackingOrder )
router.route('/orderhub/JT/cancel').delete( auth.checkToken, JT.cancelOrder )
router.route('/orderhub/JT/label').post( auth.checkToken, JT.label )
router.route('/orderhub/JT/price').post( auth.checkToken, JT.priceList )
router.route('/orderhub/JT/getme').get( auth.checkToken, JT.getMeBooking )
router.route('/orderhub/JT/getById/:txlogisticid').get( auth.checkToken, JT.getById )

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
const priceWeight = require('../Controllers/deliveryController/weight.all/priceWeight.control')
router.route('/orderhub/weight/post/:id_shop').post( authAdmin.checkToken, priceWeight.createWeight )
router.route('/orderhub/weight/edit/:id_weight').put( authAdmin.checkToken, priceWeight.editWeight )
router.route('/orderhub/weight/getAll/').get( authAdmin.checkToken, priceWeight.getAll )
router.route('/orderhub/weight/get/weight').put( auth.checkToken,priceWeight.getWeightShop )
router.route('/orderhub/weight/del/:id').delete( authAdmin.checkToken, priceWeight.delend )

//best express
const best = require('../Controllers/deliveryController/BEST_EXPRESS/best.controller')
router.route('/orderhub/best/post').post( auth.checkToken, best.createOrder )
router.route('/orderhub/best/postPDF').post( auth.checkToken, best.createPDFOrder )
router.route('/orderhub/best/status').get( auth.checkToken, best.statusOrder )
router.route('/orderhub/best/status/push').post( auth.checkToken, best.statusOrderPush )
router.route('/orderhub/best/cancel').delete( auth.checkToken, best.cancelOrder )
router.route('/orderhub/best/priceList').post( auth.checkToken, best.priceList )
router.route('/orderhub/best/getme').get( auth.checkToken, best.getMeBooking )
router.route('/orderhub/best/getById/:txLogisticId').get( auth.checkToken, best.getById )

//best Admin
router.route('/orderhub/best/getAll').get( authAdmin.checkToken, best.getAll )
router.route('/orderhub/best/getOne/:txLogisticId').get( authAdmin.checkToken, best.getById )
router.route('/orderhub/best/del/:txLogisticId').delete( authAdmin.checkToken, best.delend )
router.route('/orderhub/best/getPartner/:id').get( authAdmin.checkToken, best.getPartnerBooking )

//profit partner
const profitPN = require('../Controllers/profit/withdrawal_partner')
router.route('/orderhub/profitPartner/getSumMe').get( auth.checkToken, profitPN.getSumForMe )
router.route('/orderhub/profitPartner/Withdrawal/:id').post( auth.checkToken, profitPN.Withdrawal )
router.route('/orderhub/profitPartner/chang/wait').put( authAdmin.checkToken, profitPN.changStatus )

//profit admin(ICE)
const profitAM = require('../Controllers/profit/profit_ice')
router.route('/orderhub/profitPartner/getAll').get( authAdmin.checkToken, profitPN.getAll )//เรียกดูกำไร Partner ทุกคน
router.route('/orderhub/profitAdmin/getSumAdmin').get( authAdmin.checkToken, profitAM.getSumAdmin )
router.route('/orderhub/profitAdmin/getSumCOD').get( authAdmin.checkToken, profitAM.getSumCod )
router.route('/orderhub/profitAdmin/getSumCost').get( authAdmin.checkToken, profitAM.getSumCost )
router.route('/orderhub/profitAdmin/get/withdrawal').get( authAdmin.checkToken, profitAM.getWithdrawal )

//bank flashPay dropdown
const bank = require('../Controllers/bank/bank.flashP.dropdown')
router.route('/orderhub/bankFP/get/all').get( auth.checkToken, bank.getAll )
router.route('/orderhub/bankFP/create').post( auth.checkToken, bank.createBank )
router.route('/orderhub/bankFP/getAka/:aka').get( auth.checkToken, bank.getByAKA )
router.route('/orderhub/bankFP/del/:id').delete( auth.checkToken, bank.delendByAKA )
router.route('/orderhub/bankFP/edit/:id').put( auth.checkToken, bank.updateBank )

//bank best dropdown
const bankBestDropDown = require('../Controllers/bank/bank.best.dropdown')
router.route('/orderhub/bankBest/get/all').get( auth.checkToken, bankBestDropDown.getAll )
router.route('/orderhub/bankBest/create').post( auth.checkToken, bankBestDropDown.createBank )
router.route('/orderhub/bankBest/getAka/:aka').get( auth.checkToken, bankBestDropDown.getByAKA )
router.route('/orderhub/bankBest/del/:id').delete( auth.checkToken, bankBestDropDown.delendByAKA )
router.route('/orderhub/bankBest/edit/:id').put( auth.checkToken, bankBestDropDown.updateBank )

//bank best record
const bankRecord = require('../Controllers/bank/bank.record')
router.route('/orderhub/bankRecord/best/get/all').get( auth.checkToken, bankRecord.getAll )
router.route('/orderhub/bankRecord/best/create').post( auth.checkToken, bankRecord.createBank )
router.route('/orderhub/bankRecord/best/getId/:id').get( auth.checkToken, bankRecord.getPartnerByID )
router.route('/orderhub/bankRecord/best/del/:id').delete( auth.checkToken, bankRecord.delendByID )
router.route('/orderhub/bankRecord/best/edit/:id').put( auth.checkToken, bankRecord.updateBank )
router.route('/orderhub/bankRecord/best/getMe').get( auth.checkToken, bankRecord.getMeBEST )
//bank flashPay record
router.route('/orderhub/bankRecord/FP/get/all').get( auth.checkToken, bankRecord.getAllFP )
router.route('/orderhub/bankRecord/FP/create').post( auth.checkToken, bankRecord.createBankFP )
router.route('/orderhub/bankRecord/FP/getId/:id').get( auth.checkToken, bankRecord.getPartnerByIDFP )
router.route('/orderhub/bankRecord/FP/del/:id').delete( auth.checkToken, bankRecord.delendByIDFP )
router.route('/orderhub/bankRecord/FP/edit/:id').put( auth.checkToken, bankRecord.updateBankFP )
router.route('/orderhub/bankRecord/FP/getMe').get( auth.checkToken, bankRecord.getMeFP )

const remoteBest = require('../Controllers/deliveryController/BEST_EXPRESS/best.remote')
router.route('/orderhub/remote/best').post( remoteBest.createRemote )

const remoteJnt = require('../Controllers/deliveryController/J&T/J&T.remote')
router.route('/orderhub/remote/jnt').post( remoteJnt.createRemote )

const postcalBangkok = require('../Controllers/deliveryController/bangkok_metropolitan/bangkok')
router.route('/orderhub/postcal/bangkok/metropolitan').post( postcalBangkok.createRemote )

//order all ทุกขนส่งเพื่อทำ Bill
const orderAll = require('../Controllers/deliveryController/order_all/order_all')
router.route('/orderhub/orderall/getAll').get( auth.checkToken, orderAll.getAll )
router.route('/orderhub/orderall/get/user/:shop_number').get( auth.checkToken, orderAll.getByIdUser )
router.route('/orderhub/orderall/get/tracking/:tracking_code').get( auth.checkToken, orderAll.getByTrackingCode )
router.route('/orderhub/orderall/del/:id').delete( auth.checkToken, orderAll.delend )
router.route('/orderhub/orderall/update/bill/status').put( auth.checkToken, orderAll.updateBillStatus )

//insured
const insured = require('../Controllers/deliveryController/Insured/insuredFee')
router.route('/orderhub/insured/getAll').get( authAdmin.checkToken, insured.getAll )
router.route('/orderhub/insured/update/:id').put( authAdmin.checkToken, insured.update )
router.route('/orderhub/insured/create').post( authAdmin.checkToken, insured.create )
router.route('/orderhub/insured/del/:id').delete( authAdmin.checkToken, insured.delend )
router.route('/orderhub/insured/del_value/:id').delete( authAdmin.checkToken, insured.del_value )
router.route('/orderhub/insured/push_value/:id').put( authAdmin.checkToken, insured.push_value )
router.route('/orderhub/insured/get/express/:id').get( authAdmin.checkToken, insured.getExpress )

//ราคาขายหน้าร้าน กรุงเทพ กับ ต่างจังหวัด แบบมาตรฐาน
const base = require('../Controllers/deliveryController/weight.all/price.base')
router.route('/orderhub/price/base/getAll').get( auth.checkToken, base.getAll )
router.route('/orderhub/price/base/express/:id').get( auth.checkToken, base.getByExpress )
router.route('/orderhub/price/base/edit/:id').put( auth.checkToken, base.editPrice )

//กำหนดราคา/น้ำหนัก ทุก SHOP
const weightAll = require('../Controllers/deliveryController/weight.all/weightAll')
router.route('/orderhub/weight/all/edit/:id').put( auth.checkToken, weightAll.editWeight )
router.route('/orderhub/weight/all/getAll').get( auth.checkToken, weightAll.getAll )
router.route('/orderhub/weight/all/get/weight/:id_shop').get( auth.checkToken,weightAll.getWeightShop )
router.route('/orderhub/weight/all/del/:id').delete( auth.checkToken, weightAll.delend )
router.route('/orderhub/weight/all/edit/weightMax/:id').put( auth.checkToken, weightAll.editWeightMax )

module.exports = router;