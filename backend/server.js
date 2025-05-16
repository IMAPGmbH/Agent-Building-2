// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Importiere das Google Generative AI SDK
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Lade Umgebungsvariablen aus .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Lade den API Key

// Middleware
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'db.json');

// --- Hilfsfunktionen für die Datenbank (db.json) ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
      console.warn('db.json nicht gefunden oder fehlerhaft, initialisiere neu.');
      await writeDB({ agents: [] });
      return { agents: [] };
    }
    console.error('Fehler beim Lesen der Datenbank:', error);
    throw error;
  }
}

async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Fehler beim Schreiben in die Datenbank:', error);
    throw error;
  }
}

// --- API Endpunkte ---

// GET /api/agents - Alle Agenten abrufen
app.get('/api/agents', async (req, res) => {
  try {
    const db = await readDB();
    res.status(200).json(db.agents || []);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Abrufen der Agenten.', error: error.message });
  }
});

// POST /api/agents - Neuen Agenten erstellen
app.post('/api/agents', async (req, res) => {
  try {
    const { name, description, systemPrompt, configuration } = req.body;

    if (!name || !description || !configuration || !configuration.model) {
      return res.status(400).json({ message: 'Name, Beschreibung und Modell-Konfiguration sind erforderlich.' });
    }

    const db = await readDB();
    if (!db.agents) {
        db.agents = [];
    }
    const newAgent = {
      id: uuidv4(),
      name,
      description,
      systemPrompt: systemPrompt || '',
      configuration,
      createdAt: new Date().toISOString(),
    };

    db.agents.push(newAgent);
    await writeDB(db);

    res.status(201).json(newAgent);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Erstellen des Agenten.', error: error.message });
  }
});

// POST /api/chat - Nachricht an Gemini senden
app.post('/api/chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY ist nicht konfiguriert!"); // Wichtig für Debugging
    return res.status(500).json({ message: 'Gemini API Key nicht konfiguriert.' });
  }

  try {
    const { message, history, systemPrompt, agentModel } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Keine Nachricht übermittelt.' });
    }
    // Die Prüfung auf agentModel.toLowerCase().includes('gemini') ist für den allgemeinen Chat-Endpunkt vielleicht zu restriktiv,
    // aber für den Moment lassen wir sie, da wir uns auf Gemini konzentrieren.
    if (!agentModel || !agentModel.toLowerCase().includes('gemini')) {
        console.warn(`Ungültiges oder nicht unterstütztes Agentenmodell empfangen: ${agentModel}`);
        return res.status(400).json({ message: 'Ungültiges oder nicht unterstütztes Agentenmodell für diesen Endpunkt.' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Hier verwenden wir ein robustes Modell, das Chat unterstützt.
    // "gemini-1.5-flash-latest" ist gut für Geschwindigkeit und Kosten.
    // "gemini-1.5-pro-latest" ist leistungsstärker.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const chatHistoryForAPI = [];
    if (history && Array.isArray(history)) { // Sicherstellen, dass history ein Array ist
      history.forEach(msg => {
        if (msg && msg.sender && msg.text) { // Grundlegende Überprüfung der Nachrichtenstruktur
          chatHistoryForAPI.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      });
    }

    const chat = model.startChat({
      history: chatHistoryForAPI,
      systemInstruction: systemPrompt ? { role: "system", parts: [{text: systemPrompt}] } : undefined,
      generationConfig: {
        // maxOutputTokens: 1000, // Optional: Passe dies bei Bedarf an
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    console.log(`Sende Nachricht an Gemini: "${message}" mit Systemprompt: "${systemPrompt ? systemPrompt.substring(0,50)+'...' : 'Keiner'}" und ${chatHistoryForAPI.length} Nachrichten im Verlauf.`);

    const result = await chat.sendMessage(message);
    const response = result.response;

    if (!response) {
        console.error("Keine Antwort von der Gemini API erhalten.");
        throw new Error("Keine Antwort von der Gemini API erhalten.");
    }

    const text = response.text();
    console.log(`Antwort von Gemini empfangen: "${text ? text.substring(0,50)+'...' : 'Leere Antwort'}"`);

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Fehler bei der Kommunikation mit der Gemini API oder bei der Verarbeitung:', error);
    res.status(500).json({ message: 'Fehler bei der Chat-Verarbeitung.', error: error.message || error.toString() });
  }
});

// Einfacher Test-Endpunkt für die Server-Wurzel
app.get('/', (req, res) => {
  res.send('IMAP Agent Building Backend ist aktiv!');
});

// Server starten
app.listen(PORT, () => {
  console.log(`IMAP Agent Building Backend läuft auf http://localhost:${PORT}`);
  console.log(`Datenbank-Datei unter: ${DB_PATH}`);
});