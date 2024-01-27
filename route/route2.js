const router = require('express').Router();
const shop = require('../Controllers/shop_partner/shopController')
const auth = require("../lib/auth");

//SHOP
router.route('/orderhub/shop/post').post(auth.checkToken, shop.create)//ใช้กำหนด path
router.route('/orderhub/shop/update/:id').put(auth.checkToken, shop.updateShop)//ใช้กำหนด path
router.route('/orderhub/shop/del/:id').delete(auth.checkToken, shop.delend)//ใช้กำหนด path
router.route('/orderhub/shop/getAll').get( shop.getAll )
router.route('/orderhub/shop/getMe').get(auth.checkToken, shop.getShopPartner )
module.exports = router;