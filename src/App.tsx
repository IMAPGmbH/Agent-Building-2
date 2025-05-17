import React, { useState, useEffect, useRef } from 'react';
import { Bot, Users, PlusCircle, Upload, FileText, Trash2, Database, MessageSquare, ChevronDown, ChevronRight, Send } from 'lucide-react';
import ImapLogo from './components/ImapLogo';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
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
  const [newAgent, setNewAgent] = useState({ 
    name: '', 
    description: '', 
    systemPrompt: '',
    model: 'Gemini 2.5 Pro (Google)' 
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSystemPromptVisible, setIsSystemPromptVisible] = useState(false);
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptCategories = [
    'Allgemein',
    'Analyse',
    'Beratung',
    'Kommunikation',
    'Sonstiges'
  ];

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/agents');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error("Fehler beim Laden der Agenten vom Backend:", error);
      }
    };

    fetchAgents();
  }, []);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const baseHeight = 24;
      const maxHeight = 6 * baseHeight;

      if (chatInput === '') {
        textareaRef.current.style.height = `${baseHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        if (scrollHeight > maxHeight) {
          textareaRef.current.style.overflowY = 'auto';
        } else {
          textareaRef.current.style.overflowY = 'hidden';
        }
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
        configuration: { model: newAgent.model },
      };

      const response = await fetch('http://localhost:3001/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentToCreate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Fehler beim Erstellen des Agenten (Status: ${response.status})`);
      }

      const fetchAgentsResponse = await fetch('http://localhost:3001/api/agents');
      if (!fetchAgentsResponse.ok) {
        throw new Error(`HTTP error beim Neuladen der Agenten! status: ${fetchAgentsResponse.status}`);
      }
      const updatedAgents = await fetchAgentsResponse.json();
      setAgents(updatedAgents);

      setActiveTab('dashboard');
      setIsAgentsSubmenuOpen(true);
      setNewAgent({ name: '', description: '', systemPrompt: '', model: 'Gemini 2.5 Pro (Google)' });

    } catch (error) {
      console.error("Fehler beim Erstellen des Agenten:", error);
      alert(`Ein Fehler ist aufgetreten: ${error.message}`);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          history: historyForBackend,
          systemPrompt: selectedAgent.systemPrompt || '',
          agentModel: selectedAgent.configuration?.model || 'Gemini 2.5 Pro (Google)',
        }),
      });

      setIsAgentResponding(false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
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
      } else {
        throw new Error("Keine Antwort (reply) vom Backend erhalten.");
      }

    } catch (error) {
      setIsAgentResponding(false);
      console.error("Fehler bei der Chat-Kommunikation:", error);
      const errorResponse: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9) + '_agent_error',
        text: `Entschuldigung, ein Fehler ist aufgetreten: ${error.message}`,
        sender: 'agent',
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-page-bg">
      <nav className="bg-surface-dark fixed top-0 left-0 w-full z-50 h-16 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <ImapLogo />
          <span className="font-headings text-custom-h3 font-custom-h3-weight text-text-on-dark tracking-tight">Agent Building</span>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-accent-stripe fixed top-16 left-0 z-50"></div>

      <div className="flex mt-[4.375rem]">
        <div className="w-64 bg-sidebar-bg p-4 fixed top-[4.375rem] left-0 h-[calc(100vh-4.375rem)] overflow-y-auto">
          <div className="space-y-4">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsAgentsSubmenuOpen(!isAgentsSubmenuOpen);
              }}
              className={`flex items-center justify-between w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav ${
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
              <div className="pl-4 mt-1 space-y-1">
                {agents.slice(0, 3).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setActiveTab('chat');
                      setMessages([]);
                      setIsSystemPromptVisible(false);
                    }}
                    className="flex items-center space-x-2 w-full p-1.5 text-custom-sidebar-nav font-custom-sidebar-nav text-text-muted-on-dark hover:bg-sidebar-hover-bg hover:text-sidebar-text rounded-md"
                  >
                    <span>- {agent.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav ${
                activeTab === 'create' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Neuer Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('datacenter')}
              className={`flex items-center space-x-2 w-full p-2 text-custom-sidebar-nav font-custom-sidebar-nav ${
                activeTab === 'datacenter' ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text hover:bg-sidebar-hover-bg'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Datencenter</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-8 ml-64">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Meine Agents</h1>
              {agents.length === 0 ? (
                <div className="bg-surface-light p-6 border border-primary-100">
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-surface-light p-6 border border-primary-100 hover:border-highlight-300 transition-colors duration-200 rounded-lg shadow">
                      <h3 className="text-custom-h3 font-custom-h3-weight text-text-on-light">{agent.name}</h3>
                      <p className="mt-2 text-custom-body font-custom-body-weight text-text-muted-on-light truncate">{agent.description}</p>
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
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Neuen Agent erstellen</h1>
              <div className="bg-surface-light p-6 border border-primary-100">
                <form onSubmit={handleCreateAgentSubmit} className="space-y-6">
                  <div>
                    <label className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Name des Agents:
                    </label>
                    <input
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
                    <label className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Kurzbeschreibung:
                    </label>
                    <textarea
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
                    <label className="block text-custom-body font-custom-body-weight text-text-on-light">
                      Systemprompt:
                    </label>
                    <textarea
                      name="agentSystemPrompt"
                      value={newAgent.systemPrompt}
                      onChange={(e) => setNewAgent({...newAgent, systemPrompt: e.target.value})}
                      rows={4}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-textarea text-custom-body font-custom-body-weight"
                      placeholder="Gib hier ein, was die Aufgabe des KI-Agenten sein soll."
                    />
                  </div>
                  <div>
                    <label className="block text-custom-body font-custom-body-weight text-text-on-light">
                      KI-Modell:
                    </label>
                    <select
                      name="agentModel"
                      value={newAgent.model}
                      onChange={(e) => setNewAgent({...newAgent, model: e.target.value})}
                      className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-select text-custom-body font-custom-body-weight"
                      required
                    >
                      <option value="GPT-4o (OpenAI)" disabled>GPT-4o (OpenAI) - In Kürze</option>
                      <option value="Gemini 2.5 Pro (Google)">Gemini 2.5 Pro (Google)</option>
                      <option value="Claude 3.7 Sonett (Anthropic)" disabled>Claude 3.7 Sonett (Anthropic) - In Kürze</option>
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
                <div className="bg-surface-light p-6 border border-primary-100">
                  <h2 className="text-custom-h2 font-custom-h2-weight text-text-on-light mb-4">Globale Prompts</h2>
                  <form onSubmit={handlePromptSubmit} className="mb-6 space-y-4">
                    <div>
                      <label className="block text-custom-body font-custom-body-weight text-text-on-light">Titel</label>
                      <input
                        type="text"
                        value={newPrompt.title}
                        onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-focus-ring focus:ring-focus-ring form-input text-custom-body font-custom-body-weight"
                        placeholder="z.B. Standardeinleitung"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-custom-body font-custom-body-weight text-text-on-light">Kategorie</label>
                      <select
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
                      <label className="block text-custom-body font-custom-body-weight text-text-on-light">Prompt</label>
                      <textarea
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

                  <div className="space-y-4">
                    {globalPrompts.map((prompt) => (
                      <div key={prompt.id} className="bg-surface-light p-4 border border-highlight-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-custom-h3 font-custom-h3-weight text-text-on-light">{prompt.title}</h3>
                            <span className="text-custom-body font-custom-body-weight text-text-muted-on-light">{prompt.category}</span>
                          </div>
                          <button
                            onClick={() => deletePrompt(prompt.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-custom-body font-custom-body-weight text-text-on-light whitespace-pre-wrap">{prompt.content}</p>
                        <p className="text-custom-body font-custom-body-weight text-text-muted-on-light mt-2">
                          Erstellt am {new Date(prompt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-light p-6 border border-primary-100">
                  <h2 className="text-custom-h2 font-custom-h2-weight text-text-on-light mb-4">Globale Dateien</h2>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-8 text-center ${
                      dragActive ? 'border-highlight-400 bg-highlight-50' : 'border-gray-300'
                    }`}
                  >
                    <Upload className="mx-auto h-12 w-12 text-text-muted-on-light" />
                    <p className="mt-2 text-custom-body font-custom-semibold text-text-on-light">
                      Dateien hierher ziehen oder klicken zum Auswählen
                    </p>
                    <p className="mt-1 text-custom-body font-custom-body-weight text-text-muted-on-light">
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
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-custom-button font-custom-button-weight text-button-primary-text bg-button-primary-bg hover:bg-button-primary-hover-bg cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Dateien auswählen
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-custom-h3 font-custom-h3-weight text-text-on-light mb-4">Hochgeladene Dateien</h3>
                      <div className="space-y-4">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-surface-light p-4 border border-highlight-200"
                          >
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-text-muted-on-light mr-3" />
                              <div>
                                <p className="text-custom-body font-custom-body-weight text-text-on-light">{file.name}</p>
                                <p className="text-custom-body font-custom-body-weight text-text-muted-on-light">
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
            <div className="flex flex-col h-full">
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-4">
                Chat mit: {selectedAgent.name}
              </h1>

              {selectedAgent.systemPrompt && (
                <div className="mb-4 bg-page-bg">
                  <div
                    className="flex justify-between items-center p-2 cursor-pointer bg-page-bg hover:bg-opacity-75"
                    onClick={() => setIsSystemPromptVisible(!isSystemPromptVisible)}
                  >
                    <span className="text-custom-body font-custom-body-weight text-text-on-dark">Systemprompt</span>
                    {isSystemPromptVisible ? (
                      <ChevronDown className="w-5 h-5 text-text-on-dark" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-text-on-dark" />
                    )}
                  </div>
                  {isSystemPromptVisible && (
                    <div className="bg-page-bg p-1 pt-0">
                      <div className="bg-sidebar-bg p-3">
                        <p className="text-custom-body font-custom-body-weight text-text-on-dark whitespace-pre-wrap">
                          {selectedAgent.systemPrompt}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-grow bg-sidebar-bg p-4 overflow-y-auto mb-4">
                {messages.length === 0 && (
                  <p className="text-custom-body font-custom-body-weight text-text-muted-on-dark text-center">Beginne die Konversation...</p>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`mb-3 p-3 max-w-[80%] ${
                      msg.sender === 'user'
                        ? 'bg-chat-user-message-bg text-chat-user-message-text ml-auto'
                        : 'bg-chat-agent-message-bg text-chat-agent-message-text mr-auto'
                    }`}
                  >
                    <p className="text-custom-chat-message font-custom-chat-message-weight">{msg.text}</p>
                  </div>
                ))}

                {isAgentResponding && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-chat-agent-message-bg text-chat-agent-message-text p-3 max-w-[80%] mr-auto">
                      <p className="text-custom-chat-message font-custom-chat-message-weight italic">Agent denkt nach...</p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-start gap-2 p-4 bg-sidebar-bg"
              >
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      const scrollHeight = textareaRef.current.scrollHeight;
                      const maxHeight = 6 * 24;
                      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder="Deine Nachricht..."
                  className="flex-grow p-2 border-0 resize-none focus:ring-focus-ring focus:border-focus-ring form-textarea text-custom-chat-input font-custom-chat-input-weight text-chat-input-text bg-chat-input-bg"
                />
                <button
                  type="submit"
                  className="p-2 bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover-bg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'chat' && !selectedAgent && (
            <div>
              <h1 className="text-custom-h1 font-custom-h1-weight text-text-on-dark mb-6">Chat</h1>
              <p className="text-custom-body font-custom-body-weight text-text-on-dark">Bitte wähle zuerst einen Agenten aus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;