import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function SearchApp() {
  const [query, setQuery] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if API key is configured
    chrome.storage.sync.get('settings', (result) => {
      const settings = result.settings || {};
      setHasApiKey(!!settings.apiKey);
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && hasApiKey) {
      // Send search query to background script
      chrome.runtime.sendMessage({
        type: 'SEARCH_QUERY',
        query: query.trim()
      }, () => {
        // Close the window after sending the message
        window.close();
      });
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  if (isLoading) {
    return (
      <div className="container">
        <h1>Search Open Tabs</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Search Open Tabs</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={hasApiKey ? "Enter search query..." : "API key required"}
          autoFocus={hasApiKey}
          disabled={!hasApiKey}
        />
        <button type="submit" disabled={!hasApiKey || !query.trim()}>
          Search
        </button>
      </form>
      <div className="hint">
        {hasApiKey 
          ? "Enter keywords to find relevant tabs. Press Enter or click Search."
          : (
            <div>
              API key is required for tab search.{' '}
              <button className="settings-link" onClick={openSettings}>
                Open Settings
              </button>{' '}
              to configure your Google API key.
            </div>
          )
        }
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<SearchApp />);