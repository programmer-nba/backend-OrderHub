require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require('helmet');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = require('./route/route');
const createRouter2 = require('./route/route2');
const cors = require("cors");
const { compressData, compressIo } = require('./Controllers/claim_order/claim.controller');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const server = http.createServer(app);
const io = socketIo(server,{
  cors: {
    origin: "*", // หรือ "*" ถ้าต้องการอนุญาตทุก origin
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE', 'OPTIONS'],
    // credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'Accept-Encoding']
  },
  path: '/socket.io'
});

app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB)
.then(() => console.log('Connected!'));

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
  // credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'Accept-Encoding', 'Origin', 'X-Requested-With', 'Accept']
}));

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   next();
// });

// เพิ่ม nonce สำหรับ CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`], // ให้รองรับ nonce ที่ถูกต้องและ unsafe-inline, unsafe-eval สำหรับ Axios
    frameAncestors: ["'self'", "https://drive.google.com"]
  }
}))

// ตั้งค่า socket.io
io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('compress', async ({ files, type }) => {
    console.log('Compressing files...');
    await compressIo(socket, files, type); // เรียกใช้ฟังก์ชัน compress
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
app.set('io', io); // กำหนด io ให้กับ Express app ของคุณ

const port = process.env.PORT || 9019;

server.listen(port, () => {
  console.log(`API Running PORT ${port}`);
});

app.use(router);
app.use(createRouter2);
