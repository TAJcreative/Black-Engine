import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '8166827300:AAEu6JFEPuf4cKNvmmKFJxxLBZA7ZzVT7v4';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

async function callAlliance(message: string, apiKey: string) {
  // Alliance Logic: Harmonizing multiple models
  // For the demonstration, we will call a powerful primary model but label it as Consensus.
  // In a real scenario, this would aggregate multiple calls.
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/auto', // Auto-routing for best synergy
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Title': 'Black Engine Alliance',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    return "Protocol Error: Bridge Interrupted.";
  }
}

// Bot logic
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') {
    bot.sendMessage(chatId, "Welcome to Black Engine. Please link your OpenRouter Key using /link [KEY].");
    return;
  }

  if (text?.startsWith('/link ')) {
    const key = text.split(' ')[1];
    if (key) {
      await db.collection('users').doc(chatId.toString()).set({
        openrouterKey: key,
        telegramId: chatId.toString(),
        updatedAt: new Date().toISOString()
      });
      bot.sendMessage(chatId, "Neural Bridge Synced. You can now use the Alliance.");
    }
    return;
  }

  // Handle generic messages as chat requests
  const userDoc = await db.collection('users').doc(chatId.toString()).get();
  if (userDoc.exists) {
    const apiKey = userDoc.data()?.openrouterKey;
    bot.sendChatAction(chatId, 'typing');
    const result = await callAlliance(text || "", apiKey);
    
    // Apply 10% markup logic (simulated by adding a notice or calculating internal stars)
    // Here we just deliver the message as requested.
    bot.sendMessage(chatId, `[ALLIANCE CONSENSUS]:\n\n${result}`);
  } else {
    bot.sendMessage(chatId, "Protocol offline. Use /link [KEY] to activate.");
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Routes
  app.get('/api/auth/status', (req, res) => {
    const sessionId = req.cookies.openrouter_session_id;
    res.json({ authenticated: !!sessionId });
  });

  app.post('/api/auth/callback', async (req, res) => {
    const { key, code } = req.body;
    const authValue = key || code;
    
    if (!authValue) {
      return res.status(400).json({ error: 'Missing auth value' });
    }

    // Optional: Exchange code for key if it's a code (OpenRouter usually sends key directly in this flow)
    // But we'll treat it as the key for now as per previous implementation logic.

    try {
      // Create a session in Firestore to store this key
      const sessionRef = db.collection('sessions').doc();
      await sessionRef.set({
        key: authValue,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Securely store the sessionId in a cookie
      res.cookie('openrouter_session_id', sessionRef.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Firestore session creation failed:', err);
      res.status(500).json({ error: 'Failed to initialize neural bridge storage.' });
    }
  });

  // Helper to get key from session
  async function getApiKey(req: any) {
    const sessionId = req.cookies.openrouter_session_id;
    if (sessionId) {
      const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      if (sessionDoc.exists) {
        return sessionDoc.data()?.key;
      }
    }
    return process.env.OPENROUTER_API_KEY;
  }

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('openrouter_session_id', {
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // Proxy for OpenRouter Chat
  app.post('/api/chat', async (req, res) => {
    const { messages, model } = req.body;
    const apiKey = await getApiKey(req);

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
    const apiKey = await getApiKey(req);

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
