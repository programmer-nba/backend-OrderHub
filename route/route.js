const router = require('express').Router();
const main = require('../Controllers/registerPartner');
const login = require('../Controllers/loginController');
//const auth = require("../lib/auth");
//const authAdmin = require("../lib/authAdmin");

//CRUD employees table(Admin Only)
//router.route('/orderhub/post').post(main.Post) //ใช้กำหนด path ที่ต้องการทำให้ไม่ต้องไปประกาศใน File Server แล้ว

//Register
router.route('/orderhub/regis').post(main.createPartner)

//Login
router.route('/orderhub/login').post( login.loginController )


module.exports = router;