# MarketMix YouTube Upload Server

Standalone Express backend for uploading property tour videos to YouTube via Google OAuth 2.0.

## Setup & Deployment on Render

1. Create a new **Web Service** on Render pointing to this standalone `youtube-server` directory.
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`
4. Add Environment Variables in Render Dashboard:
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `YOUTUBE_REDIRECT_URI` (`https://<your-render-service>.onrender.com/auth/youtube/callback`)
   - `YOUTUBE_REFRESH_TOKEN` (obtained after authenticating once via `/auth/youtube`)
