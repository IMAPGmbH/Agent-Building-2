import React, { useState, useEffect, ChangeEvent } from 'react';

interface ColorSetting {
  label: string;
  variableName: string;
  description?: string;
}

// Hilfsfunktionen für Pt <-> Rem Umrechnung (Basis: 1rem = 12pt oder 16px)
const ptToRem = (pt: number): string => `${(pt / 12).toFixed(4)}rem`;
const remToPt = (rem: string): number => {
  const numericValue = parseFloat(rem);
  if (isNaN(numericValue)) return 12; // Fallback, falls CSS-Wert nicht lesbar
  return parseFloat((numericValue * 12).toFixed(2));
};

interface FontSetting {
  label: string;
  sizeVariable: string;
  weightVariable: string;
  defaultPtSize: number;
  defaultWeight: string;
  description?: string;
}

const editableColorSettings: ColorSetting[] = [
  { label: 'Seitenhintergrund', variableName: '--color-page-bg', description: 'Haupt-Hintergrundfarbe der gesamten Anwendung.' },
  { label: 'Helle Oberfläche (z.B. Karten)', variableName: '--color-surface-light', description: 'Hintergrund für helle Inhaltselemente wie Karten, Modals.' },
  { label: 'Dunkle Oberfläche (z.B. Nav)', variableName: '--color-surface-dark', description: 'Hintergrund für dunkle UI-Bereiche wie die Hauptnavigation.' },
  { label: 'Text auf dunklem Hintergrund', variableName: '--color-text-on-dark', description: 'Standard-Textfarbe auf dunklen Oberflächen.' },
  { label: 'Text auf hellem Hintergrund', variableName: '--color-text-on-light', description: 'Standard-Textfarbe auf hellen Oberflächen.' },
  { label: 'Sidebar Hintergrund', variableName: '--color-sidebar-bg', description: 'Hintergrundfarbe der Sidebar.' },
  { label: 'Sidebar Text', variableName: '--color-sidebar-text', description: 'Textfarbe in der Sidebar.' },
  { label: 'Sidebar Aktives Item Hintergrund', variableName: '--color-sidebar-active-bg', description: 'Hintergrund des aktiven/ausgewählten Items in der Sidebar.' },
  { label: 'Sidebar Aktives Item Text', variableName: '--color-sidebar-active-text', description: 'Textfarbe des aktiven/ausgewählten Items in der Sidebar.' },
  { label: 'Akzentstreifen (unter Nav)', variableName: '--color-accent-stripe', description: 'Farbe des Akzentstreifens unter der Hauptnavigation.' },
  { label: 'Button Primär Hintergrund', variableName: '--color-button-primary-bg', description: 'Hintergrundfarbe für primäre Buttons.' },
  { label: 'Button Primär Text', variableName: '--color-button-primary-text', description: 'Textfarbe für primäre Buttons.' },
  { label: 'Button Primär Hover Hintergrund', variableName: '--color-button-primary-hover-bg', description: 'Hintergrundfarbe für primäre Buttons beim Hover.' },
  { label: 'Link Text', variableName: '--color-link-text', description: 'Standardfarbe für Hyperlinks.' },
  { label: 'Chat: Nutzer Nachricht Hintergrund', variableName: '--color-chat-user-message-bg' },
  { label: 'Chat: Nutzer Nachricht Text', variableName: '--color-chat-user-message-text' },
  { label: 'Chat: Agent Nachricht Hintergrund', variableName: '--color-chat-agent-message-bg' },
  { label: 'Chat: Agent Nachricht Text', variableName: '--color-chat-agent-message-text' },
];

const DesignAdminPage: React.FC = () => {
  const [colorValues, setColorValues] = useState<Record<string, string>>({});
  const [fontSizesPt, setFontSizesPt] = useState<Record<string, number>>({});
  const [fontWeights, setFontWeights] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const editableFontSettings: FontSetting[] = [
    {
      label: 'Sidebar Navigation',
      sizeVariable: '--font-size-sidebar-nav-item',
      weightVariable: '--font-weight-sidebar-nav-item',
      defaultPtSize: 12,
      defaultWeight: '400',
      description: 'Schrift für Menüpunkte in der seitlichen Navigation.'
    },
    {
      label: 'Fließtext (Body)',
      sizeVariable: '--font-size-body',
      weightVariable: '--font-weight-body',
      defaultPtSize: 12,
      defaultWeight: '400',
      description: 'Allgemeiner Text für Beschreibungen, Paragraphen etc.'
    },
    {
      label: 'Überschrift H1',
      sizeVariable: '--font-size-h1',
      weightVariable: '--font-weight-h1',
      defaultPtSize: 22.5,
      defaultWeight: '700',
      description: 'Größte Überschrift auf den Seiten.'
    },
    {
      label: 'Überschrift H2',
      sizeVariable: '--font-size-h2',
      weightVariable: '--font-weight-h2',
      defaultPtSize: 18,
      defaultWeight: '600',
      description: 'Zweitgrößte Überschrift.'
    },
    {
      label: 'Überschrift H3',
      sizeVariable: '--font-size-h3',
      weightVariable: '--font-weight-h3',
      defaultPtSize: 15,
      defaultWeight: '600',
      description: 'Drittgrößte Überschrift.'
    },
    {
      label: 'Chat Nachrichten Text',
      sizeVariable: '--font-size-chat-message',
      weightVariable: '--font-weight-chat-message',
      defaultPtSize: 10.5,
      defaultWeight: '400',
      description: 'Text innerhalb der Chatblasen.'
    
    },
    {
      label: 'Chat Eingabefeld Text',
      sizeVariable: '--font-size-chat-input',
      weightVariable: '--font-weight-chat-input',
      defaultPtSize: 10.5,
      defaultWeight: '400',
      description: 'Text im Chat-Eingabefeld.'
    },
    {
      label: 'Button Text',
      sizeVariable: '--font-size-button',
      weightVariable: '--font-weight-button',
      defaultPtSize: 10.5,
      defaultWeight: '500',
      description: 'Text auf Standard-Buttons.'
    },
  ];

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const initialColorVals: Record<string, string> = {};
    editableColorSettings.forEach(setting => {
      const value = rootStyles.getPropertyValue(setting.variableName).trim();
      initialColorVals[setting.variableName] = value.startsWith('#') ? value : '#000000';
    });
    setColorValues(initialColorVals);

    const initialFontSizes: Record<string, number> = {};
    const initialFontWeights: Record<string, string> = {};
    editableFontSettings.forEach(setting => {
      const sizeRem = rootStyles.getPropertyValue(setting.sizeVariable).trim();
      initialFontSizes[setting.sizeVariable] = sizeRem ? remToPt(sizeRem) : setting.defaultPtSize;
      
      const weight = rootStyles.getPropertyValue(setting.weightVariable).trim();
      initialFontWeights[setting.weightVariable] = (weight === '400' || weight === '600') ? weight : setting.defaultWeight;
    });
    setFontSizesPt(initialFontSizes);
    setFontWeights(initialFontWeights);

    setIsLoading(false);
  }, []);

  const handleColorChange = (variableName: string, value: string) => {
    const sanitizedValue = value.startsWith('#') ? value : `#${value.replace(/[^0-9a-fA-F]/g, '')}`;
    
    document.documentElement.style.setProperty(variableName, sanitizedValue);
    setColorValues(prev => ({ ...prev, [variableName]: sanitizedValue }));
  };

  const handleTextInputChange = (variableName: string, textValue: string) => {
    let hex = textValue;
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    if (/^#[0-9a-fA-F]{6}$/i.test(hex) || /^#[0-9a-fA-F]{3}$/i.test(hex)) {
      handleColorChange(variableName, hex);
    } else {
      setColorValues(prev => ({ ...prev, [variableName]: textValue }));
    }
  };

  const handleFontSizeChange = (variableName: string, ptValue: number) => {
    if (isNaN(ptValue) || ptValue <= 0) return;
    const remValue = ptToRem(ptValue);
    document.documentElement.style.setProperty(variableName, remValue);
    setFontSizesPt(prev => ({ ...prev, [variableName]: ptValue }));
  };

  const handleFontWeightChange = (variableName: string, weightValue: string) => {
    document.documentElement.style.setProperty(variableName, weightValue);
    setFontWeights(prev => ({ ...prev, [variableName]: weightValue }));
  };

  if (isLoading) {
    return <div className="p-6 text-text-on-dark">Lade Design-Einstellungen...</div>;
  }

  return (
    <div className="bg-surface-light p-8 text-text-on-light shadow-xl">
      <h1 className="text-custom-h1 font-custom-h1-weight font-headings mb-8 pb-2 border-b border-gray-300">
        Design-Einstellungen
      </h1>
      
      <section>
        <h2 className="text-custom-h2 font-custom-h2-weight font-headings mb-6">Farbeinstellungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {editableColorSettings.map(setting => (
            <div key={setting.variableName} className="p-4 border border-gray-200 shadow-sm bg-white">
              <label htmlFor={setting.variableName} className="block text-sm font-custom-medium text-gray-700 mb-1">
                {setting.label}
              </label>
              {setting.description && <p className="text-xs text-gray-500 mb-2">{setting.description}</p>}
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id={`${setting.variableName}-colorpicker`}
                  value={colorValues[setting.variableName]?.match(/^#[0-9a-fA-F]{6}$/i) ? colorValues[setting.variableName] : '#000000'}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleColorChange(setting.variableName, e.target.value)}
                  className="h-10 w-10 p-0 border-0 cursor-pointer shadow"
                />
                <input
                  type="text"
                  id={setting.variableName}
                  value={colorValues[setting.variableName] || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleTextInputChange(setting.variableName, e.target.value)}
                  className="form-input flex-grow text-sm border-gray-300 shadow-sm focus:border-focus-ring focus:ring focus:ring-focus-ring focus:ring-opacity-50 placeholder-gray-400"
                  placeholder="#RRGGBB"
                />
                <div 
                  className="w-10 h-10 border border-gray-300 shadow-inner"
                  style={{ backgroundColor: colorValues[setting.variableName] || 'transparent' }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-custom-h2 font-custom-h2-weight font-headings mb-6">
          Schriftart- & Größeneinstellungen (Schriftfamilie: Poppins)
        </h2>
        <div className="space-y-6">
          {editableFontSettings.map(setting => (
            <div key={setting.label} className="p-4 border border-gray-200 shadow-sm bg-white">
              <h3 className="text-md font-custom-semibold text-gray-800 mb-1">{setting.label}</h3>
              {setting.description && <p className="text-xs text-gray-500 mb-3">{setting.description}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${setting.sizeVariable}-size`} className="block text-xs font-custom-medium text-gray-600 mb-1">
                    Schriftgröße (pt)
                  </label>
                  <input
                    type="number"
                    id={`${setting.sizeVariable}-size`}
                    value={fontSizesPt[setting.sizeVariable] || setting.defaultPtSize}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFontSizeChange(setting.sizeVariable, parseFloat(e.target.value))}
                    className="form-input w-full text-sm border-gray-300 shadow-sm focus:border-focus-ring focus:ring focus:ring-focus-ring focus:ring-opacity-50"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label htmlFor={`${setting.weightVariable}-weight`} className="block text-xs font-custom-medium text-gray-600 mb-1">
                    Schriftstärke
                  </label>
                  <select
                    id={`${setting.weightVariable}-weight`}
                    value={fontWeights[setting.weightVariable] || setting.defaultWeight}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFontWeightChange(setting.weightVariable, e.target.value)}
                    className="form-select w-full text-sm border-gray-300 shadow-sm focus:border-focus-ring focus:ring focus:ring-focus-ring focus:ring-opacity-50"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="600">Semibold (600)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="mt-12 pt-6 border-t border-gray-300">
        <button 
          className="px-6 py-3 bg-button-primary-bg text-button-primary-text text-custom-button font-custom-button-weight shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary-hover-bg"
        >
          Einstellungen speichern (Backend-Anbindung folgt)
        </button>
      </div>
    </div>
  );
};

export default DesignAdminPage;