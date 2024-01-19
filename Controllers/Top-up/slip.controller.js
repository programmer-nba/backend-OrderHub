const {TopupWallet, Validate_topup_wallet} = require('../../Models/topUp/topupList')
const {Partner} = require('../../Models/partner')
const dayjs = require('dayjs')
const multer = require("multer");
const fs = require("fs");
const { google } = require("googleapis");
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
});

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-");
    },
});

create = async (req, res)=>{
    try{
        let upload = multer({storage:storage}).single("slip_img");

        upload(req, res, async function(err){
            if(!req.file){
                const { error } = Validate_topup_wallet(req.body);
                if(error){
                    return res
                            .status(400)
                            .send({ message: error.details[0].message})
                }else if (err instanceof multer.MulterError){
                    return res
                            .send(err)
                }else if (err){
                    return res
                            .send(err)
                }else {
                    uploadFileCreate(req,res)
                }
            }
        })
        const uploadFileCreate = async(req, res)=>{
            const filePath = req.file.path;
            let fileMeteData = {
                name: req.file.originalname,
                parent:[process.env.GOOGLE_DRIVE_IMAGE_PRODUCT]
            }
            let media = {
                body: fs.createReadStream(filePath)
            }
            try {
                const response = await drive.files.create({
                    resource: fileMeteData,
                    media: media,
                });
                generatePublicUrl(response.data.id);
                console.log(req.body)
                const {error} = Validate_topup_wallet(req.body);
                const invoice = await invoiceNumber(req.body.timestamp)
                console.log('Invoice:'+invoice);
                if(error){
                    return res
                            .status(400)
                            .send({ message: error.details[0].message });
                }
                const data = {
                    ...req.body,
                    company : "OrderHub",
                    payment_type : "slip",
                    invoice : invoice,
                    detail : {
                        slip_img : response.data.id,
                    }
                }
                const topup = await TopupWallet.create(data);

                    res.status(201).send({ message: "สร้างรายงานใหม่เเล้ว", status: true, data: topup});

            }catch(err){
                return res
                        .status(500)
                        .send({ message: "Internal Server Error", status: false });
            }
        }
    }catch(err){
        return res
                .status(500)
                .send({ message: "มีบางอย่างผิดพลาด", status: false });
    }
}

async function generatePublicUrl(res) {
    try {
      const fileId = res;
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
      const result = await drive.files.get({
        fileId: fileId,
        fields: "webViewLink, webContentLink",
      });
      // console.log(result.data);
    } catch (error) {
      console.log(error.message);
    }
  }

//ค้นหาและสร้างเลข invoice
async function invoiceNumber(date) {
    const order = await TopupWallet.find();
    let invoice_number = null;
    if (order.length !== 0) {
      let data = "";
      let num = 0;
      let check = null;
      do {
        num = num + 1;
        data = `${dayjs(date).format("YYYYMM")}`.padEnd(13, "0") + num;
        check = await TopupWallet.find({invoice: data});
        console.log(check);
        if (check.length === 0) {
          invoice_number =
            `${dayjs(date).format("YYYYMM")}`.padEnd(13, "0") + num;
        }
      } while (check.length !== 0);
    } else {
      invoice_number = `${dayjs(date).format("YYYYMM")}`.padEnd(13, "0") + "1";
    }
    console.log(invoice_number);
    return invoice_number;
}
module.exports = { create }