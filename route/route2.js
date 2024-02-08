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

//Flash express
router.route('/orderhub/flash/create').post( flash.createOrder )
router.route('/orderhub/flash/status').get( flash.statusOrder )
router.route('/orderhub/flash/getware').get( flash.getWareHouse )
router.route('/orderhub/flash/print180').get( flash.print100x180 )
router.route('/orderhub/flash/print75').get( flash.print100x75 )
router.route('/orderhub/flash/POD').get( flash.statusPOD )
router.route('/orderhub/flash/statusPack').get( flash.statusOrderPack )
router.route('/orderhub/flash/cancel').delete( flash.cancelOrder )
router.route('/orderhub/flash/notify').post( flash.notifyFlash )
router.route('/orderhub/flash/notification').get( flash.nontification )
router.route('/orderhub/flash/estimate/:id').get( flash.estimateRate )

//cost level
router.route('/orderhub/cost/create').post( auth.checkToken, cost.create )
router.route('/orderhub/cost/edit').put( auth.checkToken, cost.editCostPlus )

module.exports = router;