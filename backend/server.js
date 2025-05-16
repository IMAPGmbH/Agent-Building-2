// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises'; // Wir verwenden die Promise-basierte Version von fs
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Importiere uuid für eindeutige IDs

// Lade Umgebungsvariablen aus .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Nutze den Port aus .env oder default 3001

// Middleware
app.use(cors()); // Erlaube Cross-Origin Requests (wichtig für lokale Entwicklung)
app.use(express.json()); // Erlaube dem Server, JSON-Daten in Request-Bodies zu lesen

// Pfad zur unserer einfachen JSON-Datenbank
const DB_PATH = path.join(process.cwd(), 'db.json'); // Stellt sicher, dass der Pfad korrekt ist, egal von wo das Skript gestartet wird

// --- Hilfsfunktionen für die Datenbank (db.json) ---

// Funktion zum Lesen der Datenbank
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Wenn die Datei nicht existiert oder leer ist, initialisiere sie
    if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
      console.warn('db.json nicht gefunden oder fehlerhaft, initialisiere neu.');
      await writeDB({ agents: [] });
      return { agents: [] };
    }
    console.error('Fehler beim Lesen der Datenbank:', error);
    throw error; // Wirft den Fehler weiter, damit API-Endpunkte darauf reagieren können
  }
}

// Funktion zum Schreiben in die Datenbank
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
    res.status(200).json(db.agents || []); // Stelle sicher, dass immer ein Array zurückgegeben wird
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Abrufen der Agenten.', error: error.message });
  }
});

// POST /api/agents - Neuen Agenten erstellen
app.post('/api/agents', async (req, res) => {
  try {
    const { name, description, systemPrompt, configuration } = req.body;

    // Einfache Validierung
    if (!name || !description || !configuration || !configuration.model) {
      return res.status(400).json({ message: 'Name, Beschreibung und Modell-Konfiguration sind erforderlich.' });
    }

    const db = await readDB();
    const newAgent = {
      id: uuidv4(), // Generiere eine eindeutige ID
      name,
      description,
      systemPrompt: systemPrompt || '', // Optional, default ist leerer String
      configuration,
      createdAt: new Date().toISOString(),
    };

    db.agents.push(newAgent);
    await writeDB(db);

    res.status(201).json(newAgent); // 201 Created
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Erstellen des Agenten.', error: error.message });
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