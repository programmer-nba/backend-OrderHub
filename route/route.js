const router = require('express').Router();
const main = require('../Controllers/registerPartner');
const login = require('../Controllers/loginController');
const con = require('../Controllers/contractController');
const admin = require('../Controllers/adminController')
const auth = require("../lib/auth");
const slip = require("../Controllers/Top-up/slip.controller");
const authAdmin = require('../lib/authAdmin');
const test = require('../Controllers/Top-up/history_wallet')

//CRUD employees table(Admin Only)
//router.route('/orderhub/post').post(main.Post) //ใช้กำหนด path ที่ต้องการทำให้ไม่ต้องไปประกาศใน File Server แล้ว

//Register
router.route('/orderhub/regis').post(main.createPartner)//ใช้กำหนด path ที่ต้องการทำให้ไม่ต้องไปประกาศใน File Server แล้ว
router.route('/orderhub/admin').post(admin.createAdmin)

//Admin Partner
router.route('/orderhub/post').post(main.createPartner)
router.route('/orderhub/getall').get(main.getAllPartner)
router.route('/orderhub/getid/:id').get(main.getPartnerByID)
router.route('/orderhub/update/:id').put(main.upPartnerByID)
router.route('/orderhub/del/:id').delete(main.deleteById)

//Login
router.route('/orderhub/login').post( login.loginController )

//CALL ME(Partner)
router.route('/orderhub/me').get( auth.checkToken, main.getPartnerByID )

//Contract
router.route('/orderhub/contract').post( auth.checkToken, con.twoContract )
router.route('/orderhub/getcontract/:id').get( con.getContractByID )

//Admin Confirm
router.route('/orderhub/confirm/:id').put( authAdmin.checkToken, admin.confirmContract )
router.route('/orderhub/confirm/topup/:id').put( authAdmin.checkToken, admin.confirmTopup )

//Admin Cancel(blacklist)
router.route('/orderhub/cancel/:id').put( authAdmin.checkToken, admin.cancelContract )

//slip
router.route('/orderhub/topup').post( auth.checkToken, slip.create )
//testCal
router.route('/orderhub/test').post( auth.checkToken, test.testCal )

module.exports = router;