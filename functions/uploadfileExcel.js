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

async function uploadFileCreate(file, res, { i, reqFiles }) {
  const filePath = file.path;

  let fileMetaData = {
    name: file.originalname,
    parents: [process.env.GOOGLE_DRIVE_EXCEL],
  };
  let media = {
    body: fs.createReadStream(filePath),
  };
  try {
    // Ensure token is refreshed if necessary
    await ensureAuthenticated();

    const response = await drive.files.create({
      resource: fileMetaData,
      media: media,
    });

    let genCode = await generatePublicUrl(response.data.id);
    reqFiles.push(response.data.id);
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
  const res = await drive.files
    .delete({
      // Deprecated. If an item is not in a shared drive and its last parent is deleted but the item itself is not, the item will be placed under its owner's root.
      enforceSingleParent: true,
      // The ID of the file.
      fileId: fileId,
      // Whether the requesting application supports both My Drives and shared drives.
      supportsAllDrives: false,
      // Deprecated use supportsAllDrives instead.
      supportsTeamDrives: false,
    })
    .catch((error) => {
      return false;
    });

  // console.log(res);
  return res.data;
}

module.exports = { uploadFileCreate, deleteFile };