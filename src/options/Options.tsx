import React, { useState } from 'react';
import { useChromeStorage } from '../utils/useChromeStorage';
import { ExtensionSettings, GroupingMethod } from '../types';
import { DEFAULT_PROMPT } from '../utils/defaultPrompt';
import { DEFAULTS } from '../constants';

const Options: React.FC = () => {
  const [settings, setSettings, isLoading] = useChromeStorage<ExtensionSettings>(
    'settings',
    {
      apiKey: '',
      groupingMethod: DEFAULTS.GROUPING_METHOD,
      isEnabled: DEFAULTS.IS_ENABLED,
      customPrompt: DEFAULT_PROMPT,
    }
  );

  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    setSaveMessage('Settings saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, apiKey: e.target.value };
    setSettings(newSettings);
    handleSave();
  };

  const handleMethodChange = (method: GroupingMethod) => {
    const newSettings = { ...settings, groupingMethod: method };
    setSettings(newSettings);
    handleSave();
  };

  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, isEnabled: e.target.checked };
    setSettings(newSettings);
    handleSave();
  };

  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSettings = { ...settings, customPrompt: e.target.value };
    setSettings(newSettings);
    handleSave();
  };

  const resetPromptToDefault = () => {
    const newSettings = { ...settings, customPrompt: DEFAULT_PROMPT };
    setSettings(newSettings);
    handleSave();
  };

  if (isLoading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>🐕 Tab Group Collie Settings</h1>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={handleEnabledChange}
            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
          />
          Enable Tab Group Collie
        </label>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#555' }}>Grouping Method</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { value: 'hostname', label: 'Hostname', description: 'Group tabs by domain (e.g., all Google sites together)' },
            { value: 'thematic', label: 'Thematic', description: 'Group tabs by theme (e.g., social media, development tools)' },
          ].map((method) => (
            <label
              key={method.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: settings.groupingMethod === method.value ? '#f0f8ff' : 'white',
              }}
            >
              <input
                type="radio"
                name="groupingMethod"
                value={method.value}
                checked={settings.groupingMethod === method.value}
                onChange={() => handleMethodChange(method.value as GroupingMethod)}
                style={{ marginRight: '10px', marginTop: '2px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{method.label}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#555' }}>Google API Key (Optional)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          For enhanced thematic grouping using AI. Leave empty to use basic thematic grouping.
        </p>
        <input
          type="password"
          value={settings.apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your Google API Key"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#555' }}>Custom AI Prompt (Advanced)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Customize the prompt used for AI-based thematic grouping. Use {'{tabs}'} placeholder where tab list should be inserted.
        </p>
        <textarea
          value={settings.customPrompt}
          onChange={handleCustomPromptChange}
          placeholder="Enter your custom prompt..."
          rows={8}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical',
          }}
        />
        <button
          onClick={resetPromptToDefault}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reset to Default
        </button>
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
        <h4 style={{ marginBottom: '10px', color: '#555' }}>Usage:</h4>
        <ul style={{ fontSize: '14px', color: '#666', margin: 0, paddingLeft: '20px' }}>
          <li>Click the extension icon and press "Group Tabs Now"</li>
          <li>Use keyboard shortcut: Ctrl+Shift+S (Cmd+Shift+S on Mac)</li>
          <li>Right-click on any page and select "Group Tabs"</li>
        </ul>
      </div>

      {saveMessage && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default Options;
