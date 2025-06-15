import React, { useState } from 'react';
import { useChromeStorage } from '../utils/useChromeStorage';
import { ExtensionSettings } from '../types';
import { DEFAULT_PROMPT } from '../utils/defaultPrompt';

const Popup: React.FC = () => {
  const [settings, setSettings, isLoading] = useChromeStorage<ExtensionSettings>(
    'settings',
    {
      apiKey: '',
      groupingMethod: 'hostname',
      isEnabled: true,
      customPrompt: DEFAULT_PROMPT,
    }
  );
  
  const [isGrouping, setIsGrouping] = useState(false);
  const [message, setMessage] = useState('');

  const groupTabs = async () => {
    setIsGrouping(true);
    setMessage('');
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GROUP_TABS' });
      if (response.success) {
        setMessage('Tabs grouped successfully!');
      } else {
        setMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setMessage('Failed to group tabs');
    }
    
    setIsGrouping(false);
  };

  const toggleEnabled = () => {
    setSettings({ ...settings, isEnabled: !settings.isEnabled });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontSize: '14px' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', textAlign: 'center' }}>
        🐕 Tab Group Collie
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={toggleEnabled}
            style={{ marginRight: '8px' }}
          />
          Enable Tab Group Collie
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Current method:</strong> {settings.groupingMethod}
      </div>

      <button
        onClick={groupTabs}
        disabled={isGrouping || !settings.isEnabled}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: settings.isEnabled ? '#4285f4' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: settings.isEnabled ? 'pointer' : 'not-allowed',
          marginBottom: '10px',
        }}
      >
        {isGrouping ? 'Grouping...' : 'Group Tabs Now'}
      </button>

      <button
        onClick={openSettings}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: 'transparent',
          color: '#4285f4',
          border: '1px solid #4285f4',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Settings
      </button>

      {message && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
            color: message.includes('Error') ? '#c62828' : '#2e7d32',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        Shortcut: Ctrl+Shift+S (Cmd+Shift+S on Mac)
      </div>
    </div>
  );
};

export default Popup;
