import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handleChatApi, handleFetchModelsApi } from './src/server/chatHandler.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NexusAI Studio API',
  });
});

// Auto-fetch models from custom URL provider
app.post('/api/models', (req, res) => {
  handleFetchModelsApi(req, res).catch((err) => {
    console.error('Server error handling /api/models:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error fetching models' });
    }
  });
});

// OpenAI-compatible chat completion proxy endpoint
app.post('/api/chat', (req, res) => {
  handleChatApi(req, res).catch((err) => {
    console.error('Server error handling /api/chat:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Serve production static assets from Vite build output
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for Single-Page App routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NexusAI Studio production server listening on http://0.0.0.0:${PORT}`);
});
