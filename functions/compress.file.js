const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
// ฟังก์ชันสำหรับบีบอัดวิดีโอ
function compressVideo(inputFilePath, outputFilePath, callback){
    ffmpeg(inputFilePath)
      .outputOptions([
        '-vcodec libx264',
        '-crf 28',
        '-preset fast',
        '-movflags +faststart',
      ])
      .on('end', () => {
        console.log('Compression finished');
        checkFileSize(outputFilePath)
            .then(fileSizeInMegabytes => {
                if (fileSizeInMegabytes <= 50) {
                callback(null, outputFilePath);
                } else {
                console.log('File size is still above 60MB, compressing again...');
                compressVideo(outputFilePath, outputFilePath, callback);
                }
            })
            .catch(err => {
                console.error('Error checking file size:', err);
                callback(err);
            });
      })
      .on('error', (err) => {
        console.error('Error: ' + err.message);
        callback(err);
      })
      .save(outputFilePath);
}

// ฟังก์ชันสำหรับบีบอัดรูปภาพ
async function compressImage(inputFilePath, outputFilePath, callback) {
  try {
      await sharp(inputFilePath)
          .toFormat('jpeg', { quality: 80 })
          .toFile(outputFilePath); // บันทึกเป็นไฟล์ output ที่ต่างจาก input

      console.log('Compression finished');

      // ตรวจสอบขนาดของไฟล์
      const fileSizeInMegabytes = await checkFileSize(outputFilePath);
      if (fileSizeInMegabytes <= 0.3) {
          callback(null, outputFilePath);
      } else {
          console.log('File size is still above 0.3MB, compressing again...');
          // เรียกฟังก์ชัน compressImage ตัวเองอีกครั้ง
          await compressImage(outputFilePath, outputFilePath, callback);
      }
  } catch (err) {
      console.error('Error compressing image:', err);
      callback(err);
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
function checkAndCompressFile(type, inputFilePath, outputFilePath, callback) {
    const stats = fs.statSync(inputFilePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  
    if(type == 'image'){
        if (fileSizeInMegabytes > 0.3) { // ตัวอย่างการตั้งค่าเป็น 1MB
            compressImage(inputFilePath, outputFilePath, callback);
          } else {
            console.log('File size is already below 0.3MB');
            callback(null, inputFilePath); // คืนค่าไฟล์เดิมถ้าไม่ต้องลดขนาด
          }
    }else if (type == 'video'){
        if (fileSizeInMegabytes > 50) { // ตัวอย่างการตั้งค่าเป็น 5MB
            compressVideo(inputFilePath, outputFilePath, callback);
          } else {
            console.log('File size is already below 5MB');
            callback(null, inputFilePath); // คืนค่าไฟล์เดิมถ้าไม่ต้องลดขนาด
          }
    }
}

module.exports = { compressVideo, compressImage, checkAndCompressFile };