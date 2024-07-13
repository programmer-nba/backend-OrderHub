const { google } = require("googleapis");
const fs = require("fs");
const express = require('express');
require('dotenv').config(); // Ensure you load your environment variables

const app = express();

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

async function uploadFileCreate(file, res, location) {
  const filePath = file.path
  
   // Check if filePath is valid
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  // Create a readable stream from the file path
  let fileStream;
  try {
    fileStream = fs.createReadStream(filePath);
  } catch (err) {
    throw new Error(`Failed to create read stream: ${err.message}`);
  }
  let fileMetaData = {
    name: file.originalname,
    parents: [location],
  };
  let media = {
    body: fileStream
  };
  try {
    // Ensure token is refreshed if necessary
    await ensureAuthenticated();

    const response = await drive.files.create({
      resource: fileMetaData,
      media: media,
    });

    let genCode = await generatePublicUrl(response.data.id);
    // reqFiles.push(response.data.id);
    console.log(response.data.id);
    return { genCode, responseDataId: response.data.id };
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}

async function uploadFileCreate2(file, res, location) {
  const filePath = file
  
   // Check if filePath is valid
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  // Create a readable stream from the file path
  let fileStream;
  try {
    fileStream = fs.createReadStream(filePath);
  } catch (err) {
    throw new Error(`Failed to create read stream: ${err.message}`);
  }
  let fileMetaData = {
    name: file.originalname,
    parents: [location],
  };
  let media = {
    body: fileStream
  };
  try {
    // Ensure token is refreshed if necessary
    await ensureAuthenticated();

    const response = await drive.files.create({
      resource: fileMetaData,
      media: media,
    });

    let genCode = await generatePublicUrl(response.data.id);
    // reqFiles.push(response.data.id);
    console.log(response.data.id);
    return { genCode, responseDataId: response.data.id };
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}

async function generatePublicUrl(res) {
  console.log("generatePublicUrl");
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
    console.log(result.data);
    return result.data
  } catch (error) {
    console.log(error.message);
  }
}

async function ensureAuthenticated() {
  try {
    const tokenInfo = await oauth2Client.getAccessToken();
    // Check if the token is expired
    if (!tokenInfo.token) {
      // If expired, refresh the token
      const newTokens = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(newTokens.credentials);
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
}

app.get('/orderhub/refresh/auth/token', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });
  res.redirect(url);
});

// Callback route to exchange authorization code for tokens
app.get('/orderhub/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
    // Save the refresh token securely
    console.log('Refresh Token:', tokens.refresh_token);
    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error);
    res.send('Authentication failed.');
  }
});
/**
 * Permanently delete a file, skipping the trash.
 *
 * @param {String} fileId ID of the file to delete.
 */
async function deleteFile(fileId) { 
  try {
    const res = await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true, // สนับสนุนทั้ง My Drives และ shared drives
    });
    // console.log(res)
    return `delete '${fileId}' successfully`;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`File not found: ${fileId}, considering as deleted.`);
      return { message: `File not found: ${fileId}, considering as deleted.` };
    } else {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

module.exports = { uploadFileCreate, uploadFileCreate2, deleteFile };