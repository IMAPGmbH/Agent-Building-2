import React, { useState, useEffect } from 'react';
import { Bot, Settings, Users, BookOpen, PlusCircle, Key, Upload, FileText, Trash2, Database, MessageSquare } from 'lucide-react';
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

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [globalPrompts, setGlobalPrompts] = useState<GlobalPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: 'Allgemein' });

  const promptCategories = [
    'Allgemein',
    'Analyse',
    'Beratung',
    'Kommunikation',
    'Sonstiges'
  ];

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_key');
    if (savedKey) {
      setOpenaiKey(savedKey);
      validateApiKey(savedKey);
    }

    const savedFiles = localStorage.getItem('uploaded_files');
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles));
    }

    const savedPrompts = localStorage.getItem('global_prompts');
    if (savedPrompts) {
      setGlobalPrompts(JSON.parse(savedPrompts));
    }
  }, []);

  const validateApiKey = async (key: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });
      setIsKeyValid(response.ok);
      if (response.ok) {
        localStorage.setItem('openai_key', key);
      }
    } catch (error) {
      setIsKeyValid(false);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateApiKey(openaiKey);
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

  return (
    <div className="min-h-screen bg-[#383640]">
      <nav className="bg-primary-500 border-b border-primary-600">
        <div className="w-full">
          <div className="flex justify-between h-16 pl-6 pr-8">
            <div className="flex items-center gap-3">
              <ImapLogo />
              <span className="font-sans font-normal text-xl text-white tracking-tight">Agent Building</span>
            </div>
            <div className="flex items-center">
              {isKeyValid ? (
                <span className="text-highlight-300 flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API-Key aktiv
                </span>
              ) : (
                <span className="text-accent-200 flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API-Key erforderlich
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-secondary-200"></div>

      <div className="flex">
        <div className="w-64 bg-primary-700 h-screen border-r border-primary-600 p-4">
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'dashboard' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Meine Agents</span>
            </button>
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
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'upload' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>Dokumente</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'settings' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Einstellungen</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center space-x-2 w-full p-2 ${
                activeTab === 'docs' ? 'bg-secondary-200 text-black' : 'text-white hover:bg-primary-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Dokumentation</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Meine Agents</h1>
              {!isKeyValid ? (
                <div className="text-center py-12 bg-white border border-primary-100">
                  <Key className="mx-auto h-12 w-12 text-primary-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">API-Key erforderlich</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Bitte fügen Sie zuerst Ihren OpenAI API-Key in den Einstellungen hinzu.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Zu den Einstellungen
                    </button>
                  </div>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12 bg-white border border-primary-100">
                  <Bot className="mx-auto h-12 w-12 text-primary-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Keine Agents vorhanden</h3>
                  <p className="mt-1 text-sm text-gray-500">Erstellen Sie Ihren ersten Agent, um loszulegen.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('create')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Neuen Agent erstellen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-white p-6 border border-primary-100 hover:border-highlight-300 transition-colors duration-200">
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">{agent.description}</p>
                    </div>
                  ))}
                </div>
              )}
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

          {activeTab === 'upload' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Dokumente</h1>
              <div className="bg-white p-6 border border-primary-100">
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
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover cursor-pointer"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Dateien auswählen
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Hochgeladene Dokumente</h2>
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
          )}

          {activeTab === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">API-Einstellungen</h1>
              <div className="bg-white p-6 border border-primary-100">
                <form onSubmit={handleKeySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">OpenAI API-Key</label>
                    <div className="mt-1 relative">
                      <input
                        type="password"
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-input"
                        placeholder="sk-..."
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Ihr API-Key wird sicher in Ihrem Browser gespeichert und nicht an unsere Server übertragen.
                    </p>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight-500"
                    >
                      API-Key speichern
                    </button>
                  </div>
                  {isKeyValid && (
                    <div className="mt-4 p-4 bg-green-50">
                      <p className="text-green-700">✓ API-Key erfolgreich validiert</p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Neuen Agent erstellen</h1>
              {!isKeyValid ? (
                <div className="text-center py-12 bg-white border border-primary-100">
                  <Key className="mx-auto h-12 w-12 text-primary-300" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">API-Key erforderlich</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Bitte fügen Sie zuerst Ihren OpenAI API-Key in den Einstellungen hinzu.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-primary-900 bg-imap-mint hover:bg-imap-mintHover"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Zu den Einstellungen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 border border-primary-100">
                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name des Agents</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-input"
                        placeholder="z.B. Dokumentenanalyse-Agent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-textarea"
                        placeholder="Beschreiben Sie die Aufgaben und Fähigkeiten des Agents"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GPT-4 Konfiguration</label>
                      <div className="mt-1 p-4 bg-primary-50 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Systemrolle</label>
                          <textarea
                            rows={2}
                            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 form-textarea"
                            placeholder="Definieren Sie die Rolle und Aufgaben des AI-Assistenten"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Temperatur</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            defaultValue="0.7"
                            className="mt-1 block w-full"
                          />
                        </div>
                      </div>
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;