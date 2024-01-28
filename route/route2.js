const router = require('express').Router();
const shop = require('../Controllers/shop_partner/shopController')
const auth = require("../lib/auth");
const authAdmin = require('../lib/authAdmin');
const member_shop = require('../Controllers/shop_partner/memberShop')
//SHOP
router.route('/orderhub/shop/post').post(auth.checkToken, shop.create)//ใช้กำหนด path
router.route('/orderhub/shop/update/:id').put(auth.checkToken, shop.updateShop)//ใช้กำหนด path
router.route('/orderhub/shop/del/:id').delete(auth.checkToken, shop.delend)//ใช้กำหนด path
router.route('/orderhub/shop/getMe').get(auth.checkToken, shop.getShopPartner )


//SHOP ADMIN
router.route('/orderhub/shopAdmin/getOne/:id').get( authAdmin.checkToken, shop.getShopOne ) //ดึงข้อมูลร้านค้าเดียวที่สนใจ
router.route('/orderhub/shopAdmin/getAll').get( authAdmin.checkToken, shop.getAll ) //ดึงข้อมูลร้านค้าทั้งหมดของทุกคน
router.route('/orderhub/shopAdmin/getPartner/:id').get( authAdmin.checkToken, shop.getShopPartnerByAdmin ) //ดึงข้อมูลร้านค้าทั้งหมดของทุกคน

//MEMBER SHOP
router.route('/orderhub/member/create').post( member_shop.create ) //ดึงข้อมูลร้านค้าเดียวที่สนใจ
module.exports = router;