import fs from 'fs'; 
import { promises as fsPromises } from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

let config = {};
try {
  const configFile = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(configFile);
} catch (e) {
  // ignore
}

const clientId = process.env.YOUTUBE_CLIENT_ID || (config.clientId && config.clientId !== 'YOUR_YOUTUBE_CLIENT_ID' ? config.clientId : null);
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || (config.clientSecret && config.clientSecret !== 'YOUR_YOUTUBE_CLIENT_SECRET' ? config.clientSecret : null);
const redirectUri = process.env.YOUTUBE_REDIRECT_URI || config.redirectUri || 'https://marketmix-youtube-server.onrender.com/auth/youtube/callback';

if (!clientId || !clientSecret) {
  console.error("ERROR: YouTube Client ID or Client Secret is missing. Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in Render Environment variables.");
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Helper to get authenticated client supporting ENV refresh token or tokens.json
const getAuthenticatedClient = async () => {
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
        oauth2Client.setCredentials({
            refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
        });
        return oauth2Client;
    }

    try {
        const tokens = await fsPromises.readFile(TOKEN_PATH, 'utf8');
        oauth2Client.setCredentials(JSON.parse(tokens));
        return oauth2Client;
    } catch (e) {
        throw new Error('No YouTube credentials found. Please authorize via /auth/youtube or set YOUTUBE_REFRESH_TOKEN.');
    }
};

export const getAuthUrl = () => {
  if (!clientId || !clientSecret) {
    throw new Error('YouTube Client ID and Client Secret are not configured in Render environment variables.');
  }
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
};

export const setCredentials = async (code) => {
  if (!clientId || !clientSecret) {
    throw new Error('YouTube Client ID and Client Secret are not configured.');
  }
  const { tokens } = await oauth2Client.getToken(code);
  try {
    await fsPromises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  } catch (e) {
    // ignore if read-only filesystem
  }
  oauth2Client.setCredentials(tokens);
  return tokens;
};

export const getStatus = async () => {
  if (process.env.YOUTUBE_REFRESH_TOKEN) {
    return { connected: true, source: 'environment' };
  }
  try {
    await fsPromises.readFile(TOKEN_PATH, 'utf8');
    return { connected: true, source: 'file' };
  } catch (e) {
    return { connected: false };
  }
};

export const uploadVideoToYouTube = async (filePath, title, description) => {
  const auth = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth });
  
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        categoryId: '22',
      },
      status: { privacyStatus: 'unlisted' },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });
  
  // Cleanup file after upload
  try {
    await fsPromises.unlink(filePath);
  } catch (e) {
    // ignore
  }
  
  return res.data;
};
