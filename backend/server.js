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

// Standard-Design-Einstellungen (konsistent mit src/index.css Fallbacks)
const defaultDesignSettings = {
  colors: {
    "--color-page-bg": "#383640",
    "--color-surface-light": "#FFFFFF",
    "--color-surface-dark": "#242329",
    "--color-text-on-dark": "#FFFFFF",
    "--color-text-on-light": "#000000",
    "--color-text-muted-on-dark": "#b3b3b3",
    "--color-text-muted-on-light": "#555555",
    "--color-sidebar-bg": "#242329",
    "--color-sidebar-text": "#FFFFFF",
    "--color-sidebar-active-bg": "#DBC6DE",
    "--color-sidebar-active-text": "#000000",
    "--color-sidebar-hover-bg": "#000000", // Beispiel, anpassen falls andere Farbe
    "--color-accent-stripe": "#BC9BC8",
    "--color-focus-ring": "#ffe180", // Beispiel, anpassen
    "--color-button-primary-bg": "#A0F0C3",
    "--color-button-primary-text": "#12434D",
    "--color-button-primary-hover-bg": "#90E0B3",
    "--color-link-text": "#00A89E",
    "--color-link-hover-text": "#12434D", // Beispiel
    "--color-chat-user-message-bg": "#383640",
    "--color-chat-user-message-text": "#FFFFFF",
    "--color-chat-agent-message-bg": "#DBC6DE",
    "--color-chat-agent-message-text": "#242329",
    "--color-chat-input-bg": "#FFFFFF",
    "--color-chat-input-text": "#000000",
    "--color-chat-placeholder-text": "#999999"
  },
  fontSizesPt: {
    "--font-size-sidebar-nav-item": 12,
    "--font-size-body": 12,
    "--font-size-h1": 22.5,
    "--font-size-h2": 18,
    "--font-size-h3": 15,
    "--font-size-chat-message": 10.5,
    "--font-size-chat-input": 10.5,
    "--font-size-button": 10.5
  },
  fontWeights: {
    "--font-weight-sidebar-nav-item": "400",
    "--font-weight-body": "400",
    "--font-weight-h1": "700",
    "--font-weight-h2": "600",
    "--font-weight-h3": "600",
    "--font-weight-chat-message": "400",
    "--font-weight-chat-input": "400",
    "--font-weight-button": "500"
  }
};

// --- Hilfsfunktionen für die Datenbank (db.json) ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    let db = JSON.parse(data);

    // Stelle sicher, dass designSettings existiert und initialisiert ist
    if (!db.designSettings || typeof db.designSettings !== 'object') {
      console.warn('designSettings nicht in db.json gefunden oder ungültig, initialisiere mit Defaults.');
      db.designSettings = JSON.parse(JSON.stringify(defaultDesignSettings)); // Tiefe Kopie
      // Kein automatisches Zurückschreiben hier, das passiert bei Bedarf durch PUT oder wenn eine neue DB erstellt wird.
    } else {
      // Stelle sicher, dass alle Unterobjekte existieren
      if (typeof db.designSettings.colors !== 'object') db.designSettings.colors = JSON.parse(JSON.stringify(defaultDesignSettings.colors));
      if (typeof db.designSettings.fontSizesPt !== 'object') db.designSettings.fontSizesPt = JSON.parse(JSON.stringify(defaultDesignSettings.fontSizesPt));
      if (typeof db.designSettings.fontWeights !== 'object') db.designSettings.fontWeights = JSON.parse(JSON.stringify(defaultDesignSettings.fontWeights));
    }
    return db;
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
      console.warn('db.json nicht gefunden oder fehlerhaft, initialisiere neu mit Struktur und Defaults.');
      const defaultDBStructure = {
        agents: [],
        designSettings: JSON.parse(JSON.stringify(defaultDesignSettings)) // Tiefe Kopie
      };
      await writeDB(defaultDBStructure);
      return defaultDBStructure;
    }
    console.error('Fehler beim Lesen der Datenbank:', error);
    throw error; // Wirft den Fehler weiter, damit aufrufende Funktionen ihn behandeln können
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
    if (!db.agents) { // Sollte durch readDB eigentlich nie passieren, aber sicher ist sicher
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
    console.error("GEMINI_API_KEY ist nicht konfiguriert!");
    return res.status(500).json({ message: 'Gemini API Key nicht konfiguriert.' });
  }

  try {
    const { message, history, systemPrompt, agentModel } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Keine Nachricht übermittelt.' });
    }
    if (!agentModel || !agentModel.toLowerCase().includes('gemini')) {
        console.warn(`Ungültiges oder nicht unterstütztes Agentenmodell empfangen: ${agentModel}`);
        return res.status(400).json({ message: 'Ungültiges oder nicht unterstütztes Agentenmodell für diesen Endpunkt.' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Oder dynamisch basierend auf agentModel, wenn mehr Modelle unterstützt werden

    const chatHistoryForAPI = [];
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        if (msg && typeof msg.sender === 'string' && typeof msg.text === 'string') {
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
        // maxOutputTokens: 2000, // Beispiel
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    console.log(`Sende Nachricht an Gemini: "${message.substring(0,100)}${message.length > 100 ? '...' : ''}" mit Systemprompt: "${systemPrompt ? systemPrompt.substring(0,50)+'...' : 'Keiner'}" und ${chatHistoryForAPI.length} Nachrichten im Verlauf.`);

    const result = await chat.sendMessage(message);
    const response = result.response;

    if (!response) {
        console.error("Keine Antwort von der Gemini API erhalten.");
        // Sende trotzdem einen 200er Status mit einer speziellen Nachricht, damit das Frontend es abfangen kann
        return res.status(200).json({ reply: "[Agent konnte nicht antworten - keine Antwort von API]", error: true });
    }
    
    const text = response.text();
    console.log(`Antwort von Gemini empfangen: "${text ? text.substring(0,100)+'...' : 'Leere Antwort'}"`);

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Fehler bei der Kommunikation mit der Gemini API oder bei der Verarbeitung:', error);
    // Sende eine spezifische Fehlermeldung, die das Frontend anzeigen kann
    let errorMessage = 'Fehler bei der Chat-Verarbeitung.';
    if (error.message) {
        errorMessage = error.message.includes("SAFETY") 
            ? "Die Antwort wurde aufgrund von Sicherheitseinstellungen blockiert."
            : error.message;
    }
    res.status(500).json({ message: errorMessage, error: true, details: error.toString() });
  }
});


// GET /api/design-settings - Aktuelle Design-Einstellungen abrufen
app.get('/api/design-settings', async (req, res) => {
  try {
    const db = await readDB();
    // readDB stellt sicher, dass db.designSettings existiert und Defaults hat
    res.status(200).json(db.designSettings);
  } catch (error) {
    console.error('Fehler beim Abrufen der Design-Einstellungen:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Design-Einstellungen.', error: error.message });
  }
});

// PUT /api/design-settings - Design-Einstellungen aktualisieren/speichern
app.put('/api/design-settings', async (req, res) => {
  try {
    const newSettings = req.body;

    if (!newSettings || typeof newSettings !== 'object' ||
        !newSettings.colors || typeof newSettings.colors !== 'object' ||
        !newSettings.fontSizesPt || typeof newSettings.fontSizesPt !== 'object' ||
        !newSettings.fontWeights || typeof newSettings.fontWeights !== 'object') {
      return res.status(400).json({ message: 'Ungültige Daten für Design-Einstellungen. "colors", "fontSizesPt", und "fontWeights" als Objekte sind erforderlich.' });
    }

    const db = await readDB(); // Stellt sicher, dass db.designSettings mit Defaults existiert

    // Überschreibe nur die übergebenen Teile, behalte aber die Struktur und Defaults für nicht übergebene Keys
    db.designSettings = {
        colors: { ...defaultDesignSettings.colors, ...(db.designSettings.colors || {}), ...newSettings.colors },
        fontSizesPt: { ...defaultDesignSettings.fontSizesPt, ...(db.designSettings.fontSizesPt || {}), ...newSettings.fontSizesPt },
        fontWeights: { ...defaultDesignSettings.fontWeights, ...(db.designSettings.fontWeights || {}), ...newSettings.fontWeights },
    };
    
    await writeDB(db);
    res.status(200).json({ message: 'Design-Einstellungen erfolgreich gespeichert.', settings: db.designSettings });
  } catch (error) {
    console.error('Fehler beim Speichern der Design-Einstellungen:', error);
    res.status(500).json({ message: 'Fehler beim Speichern der Design-Einstellungen.', error: error.message });
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
  // Überprüfe, ob die db.json beim Start lesbar ist und designSettings initialisiert werden
  readDB().then(db => {
    if (db.designSettings) {
      console.log('Design-Einstellungen beim Start erfolgreich geladen/initialisiert.');
    } else {
      console.error('Problem: Design-Einstellungen konnten beim Start nicht geladen/initialisiert werden.');
    }
  }).catch(err => {
    console.error('Fehler beim initialen Laden der DB für den Start-Check:', err);
  });
});