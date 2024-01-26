const router = require('express').Router();
const shop = require('../Controllers/shop_partner/shopController')
const auth = require("../lib/auth");

//SHOP
router.route('/orderhub/shop/post').post(auth.checkToken, shop.create)//ใช้กำหนด path

module.exports = router;