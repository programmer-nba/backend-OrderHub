const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// ฟังก์ชันสำหรับบีบอัดวิดีโอ
async function compressVideo(inputFilePath, outputFilePath, callback, attempt) {
  const tempOutputPath = path.join(path.dirname(outputFilePath), `temp_${path.basename(outputFilePath)}`);

  ffmpeg(inputFilePath)
      .outputOptions([
          '-vcodec libx264',
          '-crf 30',
          '-preset fast',
          '-movflags +faststart',
      ])
      .on('end', async () => {
          console.log('Compression finished');

          try {
              const fileSizeInMegabytes = await checkFileSize(tempOutputPath);
              fs.renameSync(tempOutputPath, outputFilePath);
              callback(null, outputFilePath);

          } catch (err) {
              console.error('Error checking file size:', err);
              callback(err);
          }
      })
      .on('error', (err) => {
          console.error('Error compressing video:', err);
          callback(err);
      })
      .save(tempOutputPath);
}

// ฟังก์ชันสำหรับบีบอัดรูปภาพ
async function compressImage(inputFilePath, outputFilePath, callback, attempt) {
  try {
    // สร้างเส้นทางไฟล์ชั่วคราวที่จะเป็น output ชั่วคราว
    const tempOutputPath = path.join(path.dirname(outputFilePath), `temp_${path.basename(outputFilePath)}`);

    // ใช้ Sharp เพื่อบีบอัดไฟล์ input และบันทึกเป็นไฟล์ temp output
    await sharp(inputFilePath)
      .toFormat('jpg', { quality: 80 })
      .toFile(tempOutputPath);

    console.log('Compression finished');

    // ตรวจสอบขนาดของไฟล์ temp output
    const fileSizeInMegabytes = await checkFileSize(tempOutputPath);
    if (fileSizeInMegabytes <= 0.5 || attempt >= 1) {
      // เปลี่ยนชื่อไฟล์ temp output เป็นชื่อไฟล์ output หลัก
      fs.renameSync(tempOutputPath, outputFilePath);
      callback(null, outputFilePath);
    } else {
      console.log('File size is still above 0.3MB, compressing again...');
      // ถ้าขนาดไฟล์ยังใหญ่กว่า 0.5MB ให้ใช้ไฟล์ temp output เป็น input ใหม่
      fs.renameSync(tempOutputPath); // ลบไฟล์ temp output ทิ้ง
      compressImage(inputFilePath, outputFilePath, callback, attempt + 1);
    }
  } catch (err) {
    console.error('Error compressing image:', err);
    // callback(err);
  }
}

// ฟังก์ชันสำหรับตรวจสอบขนาดของไฟล์
async function checkFileSize(filePath) {
    try {
        const stats = await fs.promises.stat(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
        console.log(`File size: ${fileSizeInMegabytes.toFixed(2)} MB`);
        return fileSizeInMegabytes;
    } catch (err) {
        console.error('Error reading file stats:', err);
        throw err;
    }
}

// ฟังก์ชันสำหรับตรวจสอบและลดขนาดไฟล์ถ้าจำเป็น
async function checkAndCompressFile(type, inputFilePath, outputFilePath, attempt, callback) {
    const stats = fs.statSync(inputFilePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    console.log(fileSizeInMegabytes)
    if (typeof callback !== 'function') {
      throw new TypeError('callback is not a function');
    }
    if(type == 'image'){
 
        await compressImage(inputFilePath, outputFilePath, callback, attempt);

    }else if (type == 'video'){
  
        await compressVideo(inputFilePath, outputFilePath, callback, attempt);
    }
}

module.exports = { compressVideo, compressImage, checkAndCompressFile };