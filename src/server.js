import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import youtubeRoutes from './routes/youtube.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'marketmix-youtube-server' });
});

app.use('/', youtubeRoutes);

app.listen(PORT, () => {
  console.log(`YouTube Server running on http://localhost:${PORT}`);
});
