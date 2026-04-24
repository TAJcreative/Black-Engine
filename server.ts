import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Routes
  app.get('/api/auth/status', (req, res) => {
    const userKey = req.cookies.openrouter_key;
    res.json({ authenticated: !!userKey });
  });

  app.get('/auth/callback', (req, res) => {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).send('Missing key in callback. Please try again.');
    }

    // Securely store the key in a cookie
    // SameSite=none and Secure=true are required for iframes in AI Studio
    res.cookie('openrouter_key', key, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body style="background: #131314; color: #e3e3e3; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden;">
          <div style="text-align: center; padding: 20px;">
            <h2 style="color: #a855f7; margin-bottom: 15px; font-weight: 900; letter-spacing: 0.1em;">NEURAL BRIDGE SYNCED</h2>
            <p style="opacity: 0.7; font-size: 14px;">Authentication successful. Returning to Mind Interface...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('openrouter_key', {
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // Proxy for OpenRouter Chat
  app.post('/api/chat', async (req, res) => {
    const { messages, model } = req.body;
    const userKey = req.cookies.openrouter_key;
    const globalKey = process.env.OPENROUTER_API_KEY;
    const apiKey = userKey || globalKey;

    if (!apiKey) {
      return res.status(401).json({ error: 'No active bridge. Please Login with OpenRouter.' });
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model || 'google/gemini-flash-1.5',
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'Black Engine',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Chat error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
    }
  });

  // Proxy for OpenRouter Balance
  app.get('/api/balance', async (req, res) => {
    const userKey = req.cookies.openrouter_key;
    const globalKey = process.env.OPENROUTER_API_KEY;
    const apiKey = userKey || globalKey;

    if (!apiKey) {
      return res.status(401).json({ error: 'No active bridge.' });
    }

    try {
      const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Balance error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
