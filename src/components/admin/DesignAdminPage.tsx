import React, { useState, useEffect, ChangeEvent } from 'react';

interface ColorSetting {
  label: string;
  variableName: string;
  description?: string;
}

const ptToRem = (pt: number): string => `${(pt / 12).toFixed(4)}rem`;
const remToPt = (rem: string): number => {
  const numericValue = parseFloat(rem);
  if (isNaN(numericValue)) return 12; // Standard-PT-Wert, falls Umrechnung fehlschlägt
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
  { label: 'Chat: Agent Nachricht Text', variableName: '--color-chat-agent-message-text' }
];

const DesignAdminPage: React.FC = () => {
  const [colorValues, setColorValues] = useState<Record<string, string>>({});
  const [fontSizesPt, setFontSizesPt] = useState<Record<string, number>>({});
  const [fontWeights, setFontWeights] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    }
  ];

  useEffect(() => {
    // Funktion zum Laden der Einstellungen aus dem Backend ist in App.tsx global,
    // hier initialisieren wir mit den aktuell berechneten Werten aus CSS,
    // da die globalen Einstellungen bereits angewendet sein sollten.
    // Das Laden hier wäre redundant und könnte zu Race Conditions führen.
    // Stattdessen liest diese Komponente die Werte, die global schon gesetzt wurden.
    setIsLoading(true);
    setLoadError(null);
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      
      const currentColors: Record<string, string> = {};
      editableColorSettings.forEach(setting => {
        const value = rootStyles.getPropertyValue(setting.variableName).trim();
        currentColors[setting.variableName] = value.startsWith('#') ? value : '#000000'; // Fallback, falls CSS-Wert ungültig
      });
      setColorValues(currentColors);

      const currentFontSizesPt: Record<string, number> = {};
      const currentFontWeights: Record<string, string> = {};
      editableFontSettings.forEach(setting => {
        const sizeRem = rootStyles.getPropertyValue(setting.sizeVariable).trim();
        currentFontSizesPt[setting.sizeVariable] = sizeRem ? remToPt(sizeRem) : setting.defaultPtSize;
        
        const weight = rootStyles.getPropertyValue(setting.weightVariable).trim();
        // Sicherstellen, dass nur gültige Gewichte gesetzt werden
        currentFontWeights[setting.weightVariable] = (weight === '400' || weight === '600' || weight === '500' || weight === '700') ? weight : setting.defaultWeight;
      });
      setFontSizesPt(currentFontSizesPt);
      setFontWeights(currentFontWeights);

    } catch (error) {
        console.error("Fehler beim Initialisieren der Design Admin Seite mit berechneten Styles:", error);
        setLoadError("Fehler beim Lesen der aktuellen Styles. Standardwerte werden angezeigt.");
        // Fallback zu Default-Werten, falls getComputedStyle fehlschlägt oder CSS-Variablen nicht da sind
        const fallbackColors: Record<string, string> = {};
        editableColorSettings.forEach(s => fallbackColors[s.variableName] = '#000000'); // Beispiel Fallback
        setColorValues(fallbackColors);

        const fallbackFontSizes: Record<string, number> = {};
        editableFontSettings.forEach(s => fallbackFontSizes[s.sizeVariable] = s.defaultPtSize);
        setFontSizesPt(fallbackFontSizes);

        const fallbackFontWeights: Record<string, string> = {};
        editableFontSettings.forEach(s => fallbackFontWeights[s.weightVariable] = s.defaultWeight);
        setFontWeights(fallbackFontWeights);
    } finally {
      setIsLoading(false);
    }
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
    // Akzeptiere 3- oder 6-stellige Hex-Werte
    if (/^#[0-9a-fA-F]{6}$/i.test(hex) || /^#[0-9a-fA-F]{3}$/i.test(hex)) {
      handleColorChange(variableName, hex);
    } else {
      // Erlaube temporär ungültige Eingaben, damit der User tippen kann
      setColorValues(prev => ({ ...prev, [variableName]: textValue }));
    }
  };

  const handleFontSizeChange = (variableName: string, ptValue: number) => {
    if (isNaN(ptValue) || ptValue <= 0) return; // Ungültige Eingaben ignorieren
    const remValue = ptToRem(ptValue);
    document.documentElement.style.setProperty(variableName, remValue);
    setFontSizesPt(prev => ({ ...prev, [variableName]: ptValue }));
  };

  const handleFontWeightChange = (variableName: string, weightValue: string) => {
    document.documentElement.style.setProperty(variableName, weightValue);
    setFontWeights(prev => ({ ...prev, [variableName]: weightValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const settingsToSave = {
        colors: colorValues,
        fontSizesPt: fontSizesPt,
        fontWeights: fontWeights,
      };

      const response = await fetch('/api/design-settings', { // <<< GEÄNDERT ZU RELATIVEM PFAD
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Fehler beim Speichern: Server antwortete mit ${response.statusText} (${response.status})` }));
        throw new Error(errorData.message || `Fehler beim Speichern: Server antwortete mit ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('Speicherergebnis:', result.message);
      alert('Design-Einstellungen erfolgreich gespeichert!');

    } catch (error) {
      console.error('Fehler beim Speichern der Design-Einstellungen:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSaveError(errorMessage);
      alert(`Fehler beim Speichern: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-text-on-dark">Lade Design-Editor...</div>;
  }

  return (
    <div className="bg-surface-light p-8 text-text-on-light shadow-xl">
      {loadError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400">
          Fehler beim Initialisieren der Seite: {loadError}
        </div>
      )}

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
                  value={colorValues[setting.variableName]?.match(/^#[0-9a-fA-F]{3,6}$/i) ? colorValues[setting.variableName] : '#000000'}
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
                  style={{ backgroundColor: colorValues[setting.variableName]?.match(/^#[0-9a-fA-F]{3,6}$/i) ? colorValues[setting.variableName] : 'transparent' }}
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
                    value={fontSizesPt[setting.sizeVariable] !== undefined ? fontSizesPt[setting.sizeVariable] : setting.defaultPtSize}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleFontSizeChange(setting.sizeVariable, parseFloat(e.target.value))}
                    className="form-input w-full text-sm border-gray-300 shadow-sm focus:border-focus-ring focus:ring focus:ring-focus-ring focus:ring-opacity-50"
                    min="1"
                    step="0.5" // Kleinere Schritte erlauben, falls gewünscht
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
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="mt-12 pt-6 border-t border-gray-300">
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-6 py-3 bg-button-primary-bg text-button-primary-text text-custom-button font-custom-button-weight shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-button-primary-hover-bg disabled:opacity-50"
        >
          {isSaving ? 'Speichert...' : 'Einstellungen speichern'}
        </button>
        {saveError && (
          <div className="mt-2 p-2 text-sm bg-red-100 text-red-700 border border-red-400">
            Fehler beim Speichern: {saveError}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignAdminPage;