const router = require('express').Router();
const main = require('../Controllers/registerPartner');
const login = require('../Controllers/loginController');
const con = require('../Controllers/contractController');
const admin = require('../Controllers/adminController')
const auth = require("../lib/auth");
const slip = require("../Controllers/Top-up/slip.controller");
const authAdmin = require('../lib/authAdmin');
const his = require('../Controllers/Top-up/history_wallet')
const topup = require('../Controllers/Top-up/topupController')
const drop = require('../Controllers/deliveryController/dropoff_point')

//CRUD employees table(Admin Only)
//router.route('/orderhub/post').post(main.Post) //ใช้กำหนด path ที่ต้องการทำให้ไม่ต้องไปประกาศใน File Server แล้ว

//Register
router.route('/orderhub/regis').post(main.createPartner)//ใช้กำหนด path ที่ต้องการทำให้ไม่ต้องไปประกาศใน File Server แล้ว

//จัดการข้อมูล Admin
router.route('/orderhub/admin').post(authAdmin.checkToken, admin.createAdmin)
router.route('/orderhub/admin/findAll').get(authAdmin.checkToken,admin.findAllAdmin)
router.route('/orderhub/admin/update/:id').put(authAdmin.checkToken,admin.updateAdmin)
router.route('/orderhub/admin/del/:id').delete(authAdmin.checkToken,admin.delAdmin)
router.route('/orderhub/admin/getMe').get(authAdmin.checkToken, admin.getMe)
router.route('/orderhub/admin/uploadPromotion').post(authAdmin.checkToken, admin.uploadPictureAdmin)
router.route('/orderhub/admin/deletePromotion/:id').delete(authAdmin.checkToken, admin.deletePictureAdmin)
router.route('/orderhub/admin/getPromotion').post(auth.checkToken, admin.getPicturePromotion)
router.route('/orderhub/admin/edit/status/promotion/:id').put(authAdmin.checkToken, admin.editStatusPicturePromotion)

//Admin Partner
router.route('/orderhub/post').post(main.createPartner)
router.route('/orderhub/getall').get(auth.checkToken,main.getAllPartner)
router.route('/orderhub/getid/:id').get(auth.checkToken,main.getPartnerByID)
router.route('/orderhub/update/:id').put(auth.checkToken,main.upPartnerByID)
router.route('/orderhub/del/:id').delete(auth.checkToken,main.deleteById)
router.route('/orderhub/getById/:id').get(auth.checkToken, main.getByID)
router.route('/orderhub/check/level').post(auth.checkToken, main.checkLevel)
// router.route('/orderhub/add/sub_role/:id').put(authAdmin.checkToken, main.addSubRole)
// router.route('/orderhub/del/sub_role/:id').delete(authAdmin.checkToken, main.delSubRole)

//Login
router.route('/orderhub/login').post( login.loginController )
router.route('/orderhub/loginTo/partner').post( login.loginToPartner )

//CALL ME(Partner)
router.route('/orderhub/me').get( auth.checkToken, main.getPartnerByID )

//Contract
router.route('/orderhub/contract').post( auth.checkToken, con.twoContract )
router.route('/orderhub/getcontract/:id').get( con.getContractByID )

//Admin confirm/cancel
router.route('/orderhub/confirm/:id').put( authAdmin.checkToken, admin.confirmContract ) //Admin Confirm contract
router.route('/orderhub/confirm/topup/:id').put( authAdmin.checkToken, admin.confirmTopup ) //Admin Confirm topup
router.route('/orderhub/cancel/topup/:id').put( authAdmin.checkToken, admin.cancelTopup ) //Admin Cancel topup
router.route('/orderhub/cancel/:id').put( authAdmin.checkToken, admin.cancelContract ) //Admin Cancel(blacklist)
router.route('/orderhub/admin/tranfer/credit/:id').post( authAdmin.checkToken, admin.tranferCreditToPartner )
router.route('/orderhub/admin/cut/credit').post( authAdmin.checkToken, admin.cutCreditPartner )
router.route('/orderhub/admin/get/partner/:id').get( authAdmin.checkToken, admin.getPartnerCutCredit )
router.route('/orderhub/admin/credits/search').post( authAdmin.checkToken, admin.getHistoryRentCredits )

//slip
router.route('/orderhub/topup').post( auth.checkToken, slip.create )

//history topup (ให้ Admin ดึงข้อมูล)
router.route('/orderhub/history').get( authAdmin.checkToken ,his.getAll )
router.route('/orderhub/history/:id').get( authAdmin.checkToken ,his.findId )

//history topup แสดงประวัติการเติมเงินของตัวเอง(partner)
router.route('/orderhub/his/partner').get( auth.checkToken, his.findIdForUser )
router.route('/orderhub/his/shop/:shop_number').get( auth.checkToken, his.findShop )
router.route('/orderhub/his/amount/all').post( his.findAmountAll )
router.route('/orderhub/his/amount/shop/all').post( his.findShopAmountAll )

//topup แสดงรายการเติมเงินที่แอดมินต้องยืนยัน
router.route('/orderhub/topup/getall').get( authAdmin.checkToken, topup.getAll )

//อัพโหลดรูปภาพยืนยันตัวตน
router.route('/orderhub/picture/:id').put( main.uploadPicture )

//จุดรับส่งสินค้า
router.route('/orderhub/dropAll').get( drop.getAll )
router.route('/orderhub/dropCreate').post( auth.checkToken, drop.create )
router.route('/orderhub/dropUpdate/:id').put( drop.update )
router.route('/orderhub/dropDelete/:id').delete( drop.delend )
router.route('/orderhub/dropReceive/:shop_id').get( auth.checkToken, drop.getReceive )
router.route('/orderhub/dropSender/:shop_id').get( auth.checkToken, drop.getSender )
router.route('/orderhub/drop/edit/bookbank/:id').put( auth.checkToken, drop.editBookbank )
router.route('/orderhub/drop/getOne').post( auth.checkToken, drop.getOneSender )
router.route('/orderhub/dropSender/all').post( auth.checkToken, drop.getSenderAll )
//router.route('/orderhub/flash').post( flash.getData )

//search location
let srcLocation = require('../src location/index')
router.route('/orderhub/spread/address').post( auth.checkToken, srcLocation.split )

let subRole = require('../Controllers/sub-roles/sub.role.controller')
router.route('/orderhub/subrole/create').post( authAdmin.checkToken, subRole.create )
router.route('/orderhub/subrole/get/all').get( authAdmin.checkToken, subRole.getAll )
router.route('/orderhub/subrole/get/:id').get( authAdmin.checkToken, subRole.getById )
router.route('/orderhub/subrole/update/:id').put( authAdmin.checkToken, subRole.update )
router.route('/orderhub/subrole/delete/:id').delete( authAdmin.checkToken, subRole.delend )
router.route('/orderhub/subrole/get/role/partner').post( auth.checkToken, subRole.getByRole )

module.exports = router;