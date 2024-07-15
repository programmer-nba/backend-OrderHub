require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require('helmet');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var router = require('./route/route')
var createRouter2 = require('./route/route2')
const cors = require("cors");
// const { createProxyMiddleware } = require('http-proxy-middleware');
const { compressIo } = require('./Controllers/claim_order/claim.controller');
const http = require('http'); // ต้องการสำหรับการสร้างเซิร์ฟเวอร์ HTTP
const socketIo = require('socket.io'); // เพิ่ม Socket.IO

const server = http.createServer(app);
const io = socketIo(server);

// console.log(io)
app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB)
.then(() => console.log('Connected!'));

app.use(express.json());
// app.use(cors());
app.use(cors({
  origin: '*', // หรือ '*' ถ้าต้องการอนุญาตทุก origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'Accept-Encoding']
}));

// กำหนด headers สำหรับ CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'self'", "https://drive.google.com"]
  }
}));

// ตั้งค่า socket.io
io.on('connection', (socket) => {
  console.log('A client connected');
  // สร้างเหตุการณ์เมื่อ client ติดต่อเข้ามา
  socket.on('compress', async (files, type) => {
      console.log('Compressing files...');
      await compressIo(socket, files, type); // เรียกใช้ฟังก์ชัน compress
  });
  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });
})
exports.io = io

const port = process.env.PORT || 9019;

server.listen(port, () => {
  console.log(`API Running PORT ${port}`);
});

app.use(router)
app.use(createRouter2)