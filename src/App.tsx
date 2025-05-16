import React, { useState, useEffect, useRef } from 'react';
import { Bot, Users, PlusCircle, Upload, FileText, Trash2, Database, MessageSquare, ChevronDown, ChevronRight, Send } from 'lucide-react';
import ImapLogo from './components/ImapLogo';

interface Agent {
  id: string;
  name: string;
  description: string;
  configuration: Record<string, string>;
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
  timestamp: Date;
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isKeyValid, setIsKeyValid] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [globalPrompts, setGlobalPrompts] = useState<GlobalPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'Allgemein' });
  const [isAgentsSubmenuOpen, setIsAgentsSubmenuOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', description: '', model: 'GPT-4o (OpenAI)' });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const promptCategories = [
    'Allgemein',
    'Analyse',
    'Beratung',
    'Kommunikation',
    'Sonstiges'
  ];

  useEffect(() => {
    const savedFiles = localStorage.getItem('uploaded_files');
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles));
    }

    const savedPrompts = localStorage.getItem('global_prompts');
    if (savedPrompts) {
      setGlobalPrompts(JSON.parse(savedPrompts));
    }
  }, []);

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAgentData: Agent = {
      id: Date.now().toString(),
      name: newAgent.name,
      description: newAgent.description,
      configuration: {
        model: newAgent.model
      }
    };

    setAgents(prevAgents => [newAgentData, ...prevAgents]);
    setActiveTab('dashboard');
    setIsAgentsSubmenuOpen(true);
    setNewAgent({ name: '', description: '', model: 'GPT-4o (OpenAI)' });
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
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date()
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
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
    const prompt: GlobalPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      title: newPrompt.title,
      content: newPrompt.content,
      category: newPrompt.category,
      createdAt: new Date()
    };

    const updatedPrompts = [...globalPrompts, prompt];
    setGlobalPrompts(updatedPrompts);
    localStorage.setItem('global_prompts', JSON.stringify(updatedPrompts));
    setNewPrompt({ title: '', content: '', category: 'Allgemein' });
  };

  const deletePrompt = (id: string) => {
    const updatedPrompts = globalPrompts.filter(prompt => prompt.id !== id);
    setGlobalPrompts(updatedPrompts);
    localStorage.setItem('global_prompts', JSON.stringify(updatedPrompts));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9) + '_user',
      text: chatInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const agentResponse: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9) + '_agent',
      text: `Echo: "${chatInput.trim()}" (Antwort von ${selectedAgent?.name || 'Demo Agent'})`,
      sender: 'agent',
      timestamp: new Date(Date.now() + 100)
    };

    setMessages(prevMessages => [...prevMessages, userMessage, agentResponse]);
    setChatInput('');
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#383640]">
      <nav className="bg-primary-500 border-b border-primary-600">
        <div className="w-full">
          <div className="flex justify-between h-16 pl-6 pr-8">
            <div className="flex items-center gap-3">
              <ImapLogo />
              <span className="font-sans font-normal text-xl text-white tracking-tight">Agent Building</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-secondary-200"></div>

      <div className="flex">
        <div className="w-64 bg-primary-700 h-screen border-r border-primary-600 p-4">
          <div className="space-y-4">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsAgentsSubmenuOpen(!isAgentsSubmenuOpen);
              }}
              className={`flex items-center justify-between w-full p-2 ${
                activeTab === 'dashboard' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
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
              <div className="pl-4 mt-1 space-y-1">
                {agents.slice(0, 3).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setActiveTab('viewAgent');
                      console.log(`Agent ${agent.name} ausgewählt. Implementiere Ansicht.`);
                    }}
                    className="flex items-center space-x-2 w-full p-1.5 text-sm text-gray-300 hover:bg-primary-600 hover:text-white rounded-md"
                  >
                    <span>- {agent.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'create' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Neuer Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('datacenter')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'datacenter' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Datencenter</span>
            </button>
            <button
              onClick={() => {
                if (!selectedAgent && agents.length > 0) {
                  setSelectedAgent(agents[0]);
                } else if (!selectedAgent) {
                  setSelectedAgent({
                    id: 'demo',
                    name: 'Demo Agent',
                    description: 'Ein Agent zum Testen des Chats',
                    configuration: {}
                  });
                }
                setActiveTab('chat');
                setMessages([]);
              }}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'chat' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat-Vorschau</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Meine Agents</h1>
              {agents.length === 0 ? (
                <div className="bg-white p-6 border border-primary-100">
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-white p-6 border border-primary-100 hover:border-highlight-300 transition-colors duration-200 rounded-lg shadow">
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="mt-2 text-sm text-gray-500 truncate">{agent.description}</p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            setActiveTab('viewAgent');
                            console.log(`Agent ${agent.name} öffnen. Implementiere Ansicht.`);
                          }}
                          className="text-sm font-medium text-imap-turquoise hover:text-imap-navy"
                        >
                          Agent öffnen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Neuen Agent erstellen</h1>
              <div className="bg-white p-6 border border-primary-100">
                <form onSubmit={handleCreateAgentSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name des Agents:
                    </label>
                    <input
                      type="text"
                      name="agentName"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-input"
                      placeholder="Wie soll dein Agent heißen?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Kurzbeschreibung:
                    </label>
                    <textarea
                      name="agentDescription"
                      value={newAgent.description}
                      onChange={(e) => setNewAgent({...newAgent, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-textarea"
                      placeholder="Was ist die Aufgabe des Agents?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      KI-Modell:
                    </label>
                    <select
                      name="agentModel"
                      value={newAgent.model}
                      onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-select"
                      required
                    >
                      <option>GPT-4o (OpenAI)</option>
                      <option>Gemini 2.5 Pro (Google)</option>
                      <option>Claude 3.7 Sonett (Anthropic)</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight-500"
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
              <h1 className="text-2xl font-bold text-white mb-6">Datencenter</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 border border-primary-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Globale Prompts</h2>
                  <form onSubmit={handlePromptSubmit} className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Titel</label>
                      <input
                        type="text"
                        value={newPrompt.title}
                        onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-input"
                        placeholder="z.B. Standardeinleitung"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kategorie</label>
                      <select
                        value={newPrompt.category}
                        onChange={(e) => setNewPrompt({...newPrompt, category: e.target.value})}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-select"
                      >
                        {promptCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prompt</label>
                      <textarea
                        value={newPrompt.content}
                        onChange={(e) => setNewPrompt({...newPrompt, content: e.target.value})}
                        rows={4}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-textarea"
                        placeholder="Geben Sie hier Ihren Prompt-Text ein..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Prompt hinzufügen
                    </button>
                  </form>

                  <div className="space-y-4">
                    {globalPrompts.map((prompt) => (
                      <div key={prompt.id} className="bg-primary-50 p-4 border border-highlight-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                            <span className="text-sm text-accent-600">{prompt.category}</span>
                          </div>
                          <button
                            onClick={() => deletePrompt(prompt.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Erstellt am {new Date(prompt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 border border-primary-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Globale Dateien</h2>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-8 text-center ${
                      dragActive ? 'border-highlight-400 bg-highlight-50' : 'border-gray-300'
                    }`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-primary-300" />
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      Dateien hierher ziehen oder klicken zum Auswählen
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      PDF, DOC, DOCX, TXT bis zu 10MB
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload-datacenter"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload-datacenter"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Dateien auswählen
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Hochgeladene Dateien</h3>
                      <div className="space-y-4">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-primary-50 p-4 border border-highlight-200"
                          >
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-primary-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && selectedAgent && (
            <div className="flex flex-col h-[calc(100vh-10rem)]">
              <h1 className="text-2xl font-bold text-white mb-4">
                Chat mit: {selectedAgent.name}
              </h1>

              <div className="flex-grow bg-secondary-150 p-4 border border-primary-100 overflow-y-auto mb-4 rounded-md">
                {messages.length === 0 && (
                  <p className="text-primary-700 text-center">Beginne die Konversation...</p>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                      msg.sender === 'user'
                        ? 'bg-primary-450 text-white ml-auto'
                        : 'bg-secondary-150 text-primary-700 mr-auto border border-primary-400'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 p-4 bg-white border border-primary-100 rounded-md"
              >
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Deine Nachricht..."
                  className="flex-grow p-2 border border-gray-300 rounded-md resize-none focus:ring-imap-turquoise focus:border-imap-turquoise form-textarea"
                  rows={1}
                />
                <button
                  type="submit"
                  className="p-2 bg-imap-mint text-primary-900 rounded-md hover:bg-imap-mintHover"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'chat' && !selectedAgent && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Chat</h1>
              <p className="text-white">Bitte wähle zuerst einen Agenten aus oder nutze die Chat-Vorschau mit einem Demo-Agenten.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;