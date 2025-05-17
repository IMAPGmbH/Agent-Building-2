import React, { useState, useEffect, useRef } from 'react';
import { Bot, Users, PlusCircle, Upload, FileText, Trash2, Database, MessageSquare, ChevronDown, ChevronRight, Send, Settings } from 'lucide-react';
import ImapLogo from './components/ImapLogo';
import DesignAdminPage from './components/admin/DesignAdminPage';

// Helper functions for pt/rem conversion
const ptToRem = (pt: number): string => `${(pt / 12).toFixed(4)}rem`;
// const remToPt = (rem: string): number => { // remToPt wird in App.tsx nicht direkt verwendet, aber in DesignAdminPage
//   const numericValue = parseFloat(rem);
//   if (isNaN(numericValue)) return 12;
//   return parseFloat((numericValue * 12).toFixed(2));
// };

// Die Definitionen für ColorSetting und FontSetting sind in DesignAdminPage.tsx und nicht direkt hier nötig,
// da App.tsx die DesignAdminPage-Komponente nur rendert.

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  configuration: Record<string, string>; // Beinhaltet jetzt z.B. { model: "gemini-1.5-flash-latest" }
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
}

interface GlobalPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  // const [isKeyValid, setIsKeyValid] = useState(true); // isKeyValid wird nicht mehr verwendet
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [globalPrompts, setGlobalPrompts] = useState<GlobalPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'Allgemein' });
  const [isAgentsSubmenuOpen, setIsAgentsSubmenuOpen] = useState(true); // Default auf true für bessere UX beim Start mit Agents
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    model: 'gemini-1.5-flash-latest' // Angepasst an Backend Erwartung, könnte auch spezifischer sein
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSystemPromptVisible, setIsSystemPromptVisible] = useState(false);
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const [areSettingsApplied, setAreSettingsApplied] = useState(false);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptCategories = [
    'Allgemein',
    'Analyse',
    'Beratung',
    'Kommunikation',
    'Sonstiges'
  ];

  // Effekt zum globalen Anwenden der Design-Einstellungen vom Backend
  useEffect(() => {
    const applyDesignSettings = async () => {
      setInitialLoadError(null);
      try {
        const response = await fetch('/api/design-settings'); // <<< GEÄNDERT ZU RELATIVEM PFAD
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Design-Einstellungen konnten nicht vom Server geladen werden (${response.status} ${response.statusText}): ${errorText}. Standard-CSS-Werte werden verwendet.`);
          setInitialLoadError(`Design-Einstellungen konnten nicht geladen werden (Status: ${response.status}). Standardwerte aktiv.`);
          setAreSettingsApplied(true); // Trotzdem true setzen, damit die App rendert
          return;
        }
        const savedSettings = await response.json();

        if (savedSettings && savedSettings.colors && savedSettings.fontSizesPt && savedSettings.fontWeights) {
          Object.entries(savedSettings.colors).forEach(([variableName, value]) => {
            if (typeof value === 'string') {
              document.documentElement.style.setProperty(variableName, value);
            }
          });

          Object.entries(savedSettings.fontSizesPt).forEach(([variableName, ptValue]) => {
            if (typeof ptValue === 'number') {
              document.documentElement.style.setProperty(variableName, ptToRem(ptValue));
            }
          });

          Object.entries(savedSettings.fontWeights).forEach(([variableName, weightValue]) => {
            if (typeof weightValue === 'string') {
              document.documentElement.style.setProperty(variableName, weightValue);
            }
          });
          console.log('Design-Einstellungen global in App.tsx angewendet.');
        } else {
          console.warn('Geladene Design-Einstellungen sind unvollständig. Standardwerte könnten teilweise aktiv bleiben.');
          setInitialLoadError('Geladene Design-Einstellungen sind unvollständig.');
        }
      } catch (error) {
        console.error('Fehler beim globalen Laden/Anwenden der Design-Einstellungen in App.tsx:', error);
        setInitialLoadError(`Netzwerkfehler beim Laden der Design-Einstellungen: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setAreSettingsApplied(true); // App rendern lassen, auch wenn Defaults verwendet werden
      }
    };

    applyDesignSettings();
  }, []);

  // Effekt zum Laden der Agenten vom Backend
  useEffect(() => {
    const fetchAgents = async () => {
      setInitialLoadError(null);
      try {
        const response = await fetch('/api/agents'); // <<< GEÄNDERT ZU RELATIVEM PFAD
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Body: ${errorText}`);
        }
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error("Fehler beim Laden der Agenten vom Backend:", error);
        setInitialLoadError(`Agenten konnten nicht geladen werden: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    if (areSettingsApplied) { // Agenten erst laden, wenn Design-Settings (auch fehlerhaft) durchgelaufen sind
        fetchAgents();
    }
  }, [areSettingsApplied]);

  // Lokale Daten (Dateien, Prompts) laden
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploaded_files');
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (e) { console.error("Fehler beim Parsen der gespeicherten Dateien:", e); localStorage.removeItem('uploaded_files');}
    }

    const savedPrompts = localStorage.getItem('global_prompts');
    if (savedPrompts) {
      try {
        setGlobalPrompts(JSON.parse(savedPrompts));
      } catch (e) { console.error("Fehler beim Parsen der gespeicherten Prompts:", e); localStorage.removeItem('global_prompts');}
    }
  }, []);

  // Textarea Höhe anpassen
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Zurücksetzen, um korrekte scrollHeight zu bekommen
      const scrollHeight = textareaRef.current.scrollHeight;
      const baseHeight = 24; // Annahme: 1 Zeile ~ 24px
      const maxHeight = 6 * baseHeight; // Max Höhe von 6 Zeilen

      if (chatInput === '') { // Wenn leer, auf Basis-Höhe setzen
        textareaRef.current.style.height = `${baseHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
    }
  }, [chatInput]);

  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAgent.name.trim() || !newAgent.description.trim()) {
      alert("Name und Beschreibung des Agents dürfen nicht leer sein.");
      return;
    }

    try {
      const agentToCreate = {
        name: newAgent.name,
        description: newAgent.description,
        systemPrompt: newAgent.systemPrompt,
        configuration: { model: newAgent.model }, // Das Backend erwartet `configuration.model`
      };

      const response = await fetch('/api/agents', { // <<< GEÄNDERT ZU RELATIVEM PFAD
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentToCreate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || `Fehler beim Erstellen des Agenten (Status: ${response.status})`);
      }

      // Nach erfolgreichem Erstellen die Agentenliste neu laden
      const fetchAgentsResponse = await fetch('/api/agents'); // <<< GEÄNDERT ZU RELATIVEM PFAD
      if (!fetchAgentsResponse.ok) {
        throw new Error(`HTTP error beim Neuladen der Agenten! status: ${fetchAgentsResponse.status}`);
      }
      const updatedAgents = await fetchAgentsResponse.json();
      setAgents(updatedAgents);

      setActiveTab('dashboard');
      setIsAgentsSubmenuOpen(true);
      setNewAgent({ name: '', description: '', systemPrompt: '', model: 'gemini-1.5-flash-latest' });

    } catch (error) {
      console.error("Fehler beim Erstellen des Agenten:", error);
      alert(`Ein Fehler ist aufgetreten: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ""; // Input zurücksetzen, um dieselbe Datei erneut hochladen zu können
    }
  };

  const handleFiles = (files: FileList) => {
    const newFilesArray: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9), // Einfache ID
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date()
    }));

    const updatedFiles = [...uploadedFiles, ...newFilesArray];
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
  };

  const deleteFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('uploaded_files', JSON.stringify(updatedFiles));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) {
        alert("Titel und Inhalt des Prompts dürfen nicht leer sein.");
        return;
    }
    const promptToAdd: GlobalPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      title: newPrompt.title,
      content: newPrompt.content,
      category: newPrompt.category,
      createdAt: new Date()
    };

    const updatedPrompts = [...globalPrompts, promptToAdd];
    setGlobalPrompts(updatedPrompts);
    localStorage.setItem('global_prompts', JSON.stringify(updatedPrompts));
    setNewPrompt({ title: '', content: '', category: 'Allgemein' });
  };

  const deletePrompt = (id: string) => {
    const updatedPrompts = globalPrompts.filter(prompt => prompt.id !== id);
    setGlobalPrompts(updatedPrompts);
    localStorage.setItem('global_prompts', JSON.stringify(updatedPrompts));
  };

  const handleSendMessage = async (e?: React.FormEvent) => { // e ist optional
    if (e) e.preventDefault();
    if (chatInput.trim() === '' || !selectedAgent) return;

    const userInput = chatInput.trim();

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9) + '_user',
      text: userInput,
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setChatInput('');
    setIsAgentResponding(true);

    const historyForBackend = messages.map(msg => ({ sender: msg.sender, text: msg.text }));

    try {
      const response = await fetch('/api/chat', { // <<< GEÄNDERT ZU RELATIVEM PFAD
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          history: historyForBackend, // Die letzten Nachrichten des aktuellen Chats
          systemPrompt: selectedAgent.systemPrompt || '', // Systemprompt des ausgewählten Agenten
          agentModel: selectedAgent.configuration?.model || 'gemini-1.5-flash-latest', // Modell des Agenten
        }),
      });

      setIsAgentResponding(false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || `Fehler beim Senden der Nachricht (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.reply) {
        const agentResponse: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9) + '_agent',
          text: data.reply,
          sender: 'agent',
        };
        setMessages(prevMessages => [...prevMessages, agentResponse]);
      } else if (data.error && data.message) { // Backend könnte einen kontrollierten Fehler senden
        const errorResponse: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9) + '_agent_error',
          text: `Fehler vom Agenten: ${data.message}`,
          sender: 'agent',
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
      } else {
        throw new Error("Keine gültige Antwort (reply) oder Fehlerstruktur vom Backend erhalten.");
      }

    } catch (error) {
      setIsAgentResponding(false);
      console.error("Fehler bei der Chat-Kommunikation:", error);
      const errorResponse: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9) + '_agent_error',
        text: `Entschuldigung, ein Fehler ist aufgetreten: ${error instanceof Error ? error.message : String(error)}`,
        sender: 'agent',
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  if (!areSettingsApplied) {
    return (
      <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center text-text-on-dark p-4">
        <div className="text-lg mb-4">Lade App-Styles...</div>
        {initialLoadError && (
          <div className="p-3 bg-red-700 text-white border border-red-900 max-w-md text-center">
            {initialLoadError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <nav className="bg-surface-dark fixed top-0 left-0 w-full z-50 h-16 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <ImapLogo />
          <span className="font-headings text-custom-h3 font-custom-h3-weight text-text-on-dark tracking-tight">Agent Building</span>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-accent-stripe fixed top-16 left-0 z-50"></div>

      <div className="flex pt-[4.375rem]"> {/* pt Wert angepasst an Nav + Stripe Höhe */}
        <div className="w-64 bg-sidebar-bg p-4 fixed top-[4.375rem] left-0 h-[calc(100vh-4.375rem)] overflow-y-auto">
          <div className="space-y-1"> {/* Reduzierter Abstand zwischen Sidebar-Items */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsAgentsSubmenuOpen(prev => !prev); // Toggle Submenü
              }}
              className={`flex items-center justify-between w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav-weight ${
                activeTab === 'dashboard' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Meine Agents</span>
              </div>
              {agents.length > 0 && (
                isAgentsSubmenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isAgentsSubmenuOpen && agents.length > 0 && (
              <div className="pl-4 mt-1 space-y-0.5"> {/* Feinerer Abstand im Submenü */}
                {agents.slice(0, 5).map(agent => ( // Zeige bis zu 5 Agents
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setActiveTab('chat');
                      setMessages([]); // Chatverlauf zurücksetzen
                      setIsSystemPromptVisible(false); // Systemprompt einklappen
                    }}
                    className={`flex items-center space-x-2 w-full p-1.5 text-custom-sidebar-nav font-custom-sidebar-nav-weight truncate ${
                        selectedAgent?.id === agent.id && activeTab === 'chat' ? 'text-sidebar-active-text bg-sidebar-active-bg bg-opacity-50' : 'text-text-muted-on-dark hover:bg-sidebar-hover-bg hover:text-sidebar-text'
                    }`}
                    title={agent.name}
                  >
                    <span className="truncate">- {agent.name}</span>
                  </button>
                ))}
                {agents.length > 5 && (
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className="flex items-center space-x-2 w-full p-1.5 text-custom-sidebar-nav font-custom-sidebar-nav-weight text-text-muted-on-dark hover:bg-sidebar-hover-bg hover:text-sidebar-text"
                    >
                        <span className="text-xs">... mehr anzeigen</span>
                    </button>
                )}
              </div>
            )}

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav-weight ${
                activeTab === 'create' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Neuer Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('datacenter')}
              className={`flex items-center space-x-2 w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav-weight ${
                activeTab === 'datacenter' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Datencenter</span>
            </button>

            <button
              onClick={() => setActiveTab('designAdmin')}
              className={`flex items-center space-x-2 w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav-weight ${
                activeTab === 'designAdmin' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Design Admin</span>
            </button>
          </div>
        </div>

        <main className="flex-1 p-8 ml-64 overflow-y-auto h-[calc(100vh-4.375rem)]"> {/* Scrollbar für den Hauptinhalt */}
          {initialLoadError && activeTab !== 'designAdmin' && ( // Fehler nicht auf DesignAdmin Seite prominent zeigen, da dort eigener Loader
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400">
              {initialLoadError}
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Meine Agents</h1>
              {agents.length === 0 && !initialLoadError ? ( // Nur zeigen, wenn kein Ladefehler vorliegt
                <div className="bg-surface-light p-6 border border-gray-200">
                  <p className="text-custom-body font-custom-body-weight text-text-muted-on-light">
                    Du hast noch keine Agents erstellt. Klicke auf "Neuer Agent" in der Seitenleiste, um zu beginnen.
                  </p>
                </div>
              ) : agents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-surface-light p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                      <h3 className="text-custom-h3 font-custom-h3-weight text-text-on-light truncate" title={agent.name}>{agent.name}</h3>
                      <p className="mt-2 text-custom-body font-custom-body-weight text-text-muted-on-light h-10 overflow-hidden text-ellipsis"> {/* Feste Höhe für Konsistenz */}
                        {agent.description}
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setActiveTab('chat');
                            setMessages([]);
                            setIsSystemPromptVisible(false);
                          }}
                          className="text-custom-button font-custom-button-weight text-link hover:text-link-hover"
                        >
                          Agent öffnen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null /* Bei Ladefehler und 0 Agenten nichts extra anzeigen */ }
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Neuen Agent erstellen</h1>
              <div className="bg-surface-light p-6 border border-gray-200">
                <form onSubmit={handleCreateAgentSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="agentName" className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Name des Agents:
                    </label>
                    <input
                      id="agentName"
                      type="text"
                      name="agentName"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-input text-custom-body font-custom-body-weight"
                      placeholder="Wie soll dein Agent heißen?"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="agentDescription" className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Kurzbeschreibung:
                    </label>
                    <textarea
                      id="agentDescription"
                      name="agentDescription"
                      value={newAgent.description}
                      onChange={(e) => setNewAgent({...newAgent, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-textarea text-custom-body font-custom-body-weight"
                      placeholder="Was ist die Aufgabe des Agents?"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="agentSystemPrompt" className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Systemprompt (optional):
                    </label>
                    <textarea
                      id="agentSystemPrompt"
                      name="agentSystemPrompt"
                      value={newAgent.systemPrompt}
                      onChange={(e) => setNewAgent({...newAgent, systemPrompt: e.target.value})}
                      rows={5}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-textarea text-custom-body font-custom-body-weight"
                      placeholder="Instruktionen für die KI, z.B. 'Du bist ein hilfreicher Assistent für Marketing-Texte.'"
                    />
                  </div>
                  <div>
                    <label htmlFor="agentModel" className="block text-custom-body font-custom-body-weight text-text-on-light">
                      KI-Modell:
                    </label>
                    <select
                      id="agentModel"
                      name="agentModel"
                      value={newAgent.model}
                      onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-select text-custom-body font-custom-body-weight"
                      required
                    >
                      {/* Wert muss mit Backend-Erwartung übereinstimmen, z.B. "gemini-1.5-flash-latest" */}
                      <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Google)</option>
                      {/* Weitere Modelle könnten hier als Optionen hinzugefügt werden, wenn vom Backend unterstützt */}
                      {/* <option value="gpt-4o" disabled>GPT-4o (OpenAI) - In Kürze</option> */}
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-custom-button font-custom-button-weight text-button-primary-text bg-button-primary-bg hover:bg-button-primary-hover-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring"
                    >
                      Agent erstellen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'datacenter' && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Datencenter</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Globale Prompts Sektion */}
                <div className="bg-surface-light p-6 border border-gray-200">
                  <h2 className="text-custom-h2 font-custom-h2-weight text-text-on-light mb-4">Globale Prompts</h2>
                  <form onSubmit={handlePromptSubmit} className="mb-6 space-y-4">
                    <div>
                      <label htmlFor="promptTitle" className="block text-custom-body font-custom-body-weight text-text-on-light">Titel</label>
                      <input
                        id="promptTitle"
                        type="text"
                        value={newPrompt.title}
                        onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-input text-custom-body font-custom-body-weight"
                        placeholder="z.B. Standardeinleitung"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="promptCategory" className="block text-custom-body font-custom-body-weight text-text-on-light">Kategorie</label>
                      <select
                        id="promptCategory"
                        value={newPrompt.category}
                        onChange={(e) => setNewPrompt({...newPrompt, category: e.target.value})}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-select text-custom-body font-custom-body-weight"
                      >
                        {promptCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="promptContent" className="block text-custom-body font-custom-body-weight text-text-on-light">Prompt</label>
                      <textarea
                        id="promptContent"
                        value={newPrompt.content}
                        onChange={(e) => setNewPrompt({...newPrompt, content: e.target.value})}
                        rows={4}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-textarea text-custom-body font-custom-body-weight"
                        placeholder="Geben Sie hier Ihren Prompt-Text ein..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-custom-button font-custom-button-weight text-button-primary-text bg-button-primary-bg hover:bg-button-primary-hover-bg"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Prompt hinzufügen
                    </button>
                  </form>

                  <div className="space-y-4 max-h-96 overflow-y-auto"> {/* Scrollbar für Prompt-Liste */}
                    {globalPrompts.length === 0 && <p className="text-text-muted-on-light">Noch keine globalen Prompts gespeichert.</p>}
                    {globalPrompts.map((prompt) => (
                      <div key={prompt.id} className="bg-gray-50 p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-custom-h3 font-custom-h3-weight text-text-on-light">{prompt.title}</h3>
                            <span className="text-xs text-text-muted-on-light bg-gray-200 px-1 py-0.5">{prompt.category}</span>
                          </div>
                          <button
                            onClick={() => deletePrompt(prompt.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Prompt löschen"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-custom-body font-custom-body-weight text-text-on-light whitespace-pre-wrap">{prompt.content}</p>
                        <p className="text-xs text-text-muted-on-light mt-2">
                          Erstellt am: {new Date(prompt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Globale Dateien Sektion */}
                <div className="bg-surface-light p-6 border border-gray-200">
                  <h2 className="text-custom-h2 font-custom-h2-weight text-text-on-light mb-4">Globale Dateien</h2>
                  <form
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onSubmit={(e) => e.preventDefault()} // Verhindert Formular-Submit beim Drücken von Enter im File-Dialog
                    className={`border-2 border-dashed p-8 text-center mb-6 ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload-datacenter"
                      accept=".pdf,.doc,.docx,.txt,.md" // Akzeptierte Dateitypen
                    />
                    <label
                      htmlFor="file-upload-datacenter"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="mx-auto h-12 w-12 text-text-muted-on-light" />
                      <p className="mt-2 text-custom-body font-custom-semibold text-text-on-light">
                        Dateien hierher ziehen oder klicken zum Auswählen
                      </p>
                      <p className="mt-1 text-xs text-text-muted-on-light">
                        (PDF, DOC, DOCX, TXT, MD - max. 10MB)
                      </p>
                    </label>
                  </form>

                  <div className="space-y-4 max-h-96 overflow-y-auto"> {/* Scrollbar für Datei-Liste */}
                    {uploadedFiles.length === 0 && <p className="text-text-muted-on-light">Noch keine globalen Dateien hochgeladen.</p>}
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 p-3 border border-gray-200"
                      >
                        <div className="flex items-center overflow-hidden">
                          <FileText className="w-5 h-5 text-text-muted-on-light mr-3 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-custom-body-weight text-text-on-light truncate" title={file.name}>{file.name}</p>
                            <p className="text-xs text-text-muted-on-light">
                              {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          title="Datei löschen"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && selectedAgent && (
            <div className="flex flex-col h-full max-h-[calc(100vh-4.375rem-4rem)]"> {/* Begrenze Höhe für Chat */}
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-4 flex-shrink-0">
                Chat mit: <span className="text-highlight-300">{selectedAgent.name}</span>
              </h1>

              {selectedAgent.systemPrompt && (
                <div className="mb-4 bg-page-bg flex-shrink-0">
                  <div
                    className="flex justify-between items-center p-2 cursor-pointer hover:bg-opacity-75"
                    onClick={() => setIsSystemPromptVisible(!isSystemPromptVisible)}
                  >
                    <span className="text-sm font-custom-body-weight text-text-on-dark">Systemprompt anzeigen/verbergen</span>
                    {isSystemPromptVisible ? (
                      <ChevronDown className="w-5 h-5 text-text-on-dark" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-text-on-dark" />
                    )}
                  </div>
                  {isSystemPromptVisible && (
                    <div className="bg-sidebar-bg p-3 mt-1 max-h-40 overflow-y-auto">
                      <p className="text-xs font-custom-body-weight text-text-on-dark whitespace-pre-wrap">
                        {selectedAgent.systemPrompt}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-grow bg-sidebar-bg p-4 overflow-y-auto mb-4 shadow-inner"> {/* Chat Nachrichten Bereich */}
                {messages.length === 0 && (
                  <p className="text-sm font-custom-body-weight text-text-muted-on-dark text-center">Beginne die Konversation oder stelle eine Frage...</p>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`mb-3 p-3 max-w-[85%] w-fit clear-both ${ /* w-fit und clear-both für korrekte Ausrichtung */
                      msg.sender === 'user'
                        ? 'bg-chat-user-message-bg text-chat-user-message-text ml-auto'
                        : 'bg-chat-agent-message-bg text-chat-agent-message-text mr-auto'
                    }`}
                  >
                    <p className="text-custom-chat-message font-custom-chat-message-weight whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}

                {isAgentResponding && (
                  <div className="flex justify-start mb-3 clear-both">
                    <div className="bg-chat-agent-message-bg text-chat-agent-message-text p-3 max-w-[85%] mr-auto w-fit">
                      <p className="text-custom-chat-message font-custom-chat-message-weight italic">Agent denkt nach...</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-start gap-2 p-2 bg-sidebar-bg border-t border-surface-dark flex-shrink-0"
              >
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { // Geändert von onKeyPress zu onKeyDown für bessere Shift+Enter Handhabung
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(); // Rufe ohne Event-Objekt auf
                    }
                  }}
                  placeholder="Deine Nachricht an den Agenten..."
                  className="flex-grow p-2 border-gray-600 bg-chat-input-bg text-chat-input-text focus:ring-focus-ring focus:border-focus-ring form-textarea text-custom-chat-input font-custom-chat-input-weight resize-none overflow-hidden"
                  rows={1} // Startet mit einer Zeile, Höhe wird dynamisch angepasst
                />
                <button
                  type="submit"
                  className="p-2 bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover-bg disabled:opacity-50"
                  disabled={isAgentResponding || chatInput.trim() === ''}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'chat' && !selectedAgent && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Chat</h1>
              <p className="text-custom-body font-custom-body-weight text-text-on-dark">
                Bitte wähle zuerst einen Agenten aus der Liste "Meine Agents" oder dem Submenü aus, um mit ihm zu chatten.
              </p>
            </div>
          )}

          {activeTab === 'designAdmin' && (
            <DesignAdminPage /> // DesignAdminPage rendert eigene Überschrift etc.
          )}
        </main>
      </div>
    </div>
  );
}

export default App;