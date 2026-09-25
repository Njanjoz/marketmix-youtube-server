import express from 'express';
import multer from 'multer';
import * as youtubeService from '../services/youtubeService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/auth/youtube', (req, res) => {
  res.redirect(youtubeService.getAuthUrl());
});

router.get('/auth/youtube/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await youtubeService.setCredentials(code);
    res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h2 style="color: green;">YouTube Authorization Successful!</h2>
          <p>You can close this tab. Your refresh token is displayed below for production environment variables:</p>
          <textarea style="width: 100%; max-width: 600px; height: 100px;" readonly>${tokens.refresh_token || 'Access token stored successfully.'}</textarea>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Authorization failed: ' + error.message);
  }
});

router.get('/api/youtube/status', async (req, res) => {
  const status = await youtubeService.getStatus();
  res.json(status);
});

router.post('/api/youtube/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file provided' });
  
  try {
    const data = await youtubeService.uploadVideoToYouTube(
      req.file.path, 
      req.body.title || 'MarketMix Property Tour', 
      req.body.description || ''
    );
    res.json({ success: true, videoId: data.id, youtubeUrl: `https://youtube.com/watch?v=${data.id}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
