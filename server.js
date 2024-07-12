require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require('helmet');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var router = require('./route/route')
var router2 = require('./route/route2')
const cors = require("cors");

app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB)
.then(() => console.log('Connected!'));

app.use(express.json());
// app.use(cors());
app.use(cors({
  origin: '*', // หรือ '*' ถ้าต้องการอนุญาตทุก origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'auth-token', 'Accept-Encoding']
}));

// กำหนด headers สำหรับ CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.sendStatus(200);
  } else {
    console.log('Handling regular request: ' + req.method);
    next();
  }
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'self'", "https://drive.google.com"]
  }
}));

const port = process.env.PORT || 9019;

app.listen(port, () => {
  console.log(`API Running PORT ${port}`);
});
app.use(router)
app.use(router2)