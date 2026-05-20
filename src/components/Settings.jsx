import React, { useState } from 'react';
import { Check, HelpCircle, RefreshCw } from 'lucide-react';
import { usePlayback } from '../context/PlaybackContext';
import { DEFAULT_INSTANCES } from '../services/pipedApi';

const Settings = () => {
  const { instanceUrl, setInstanceUrl } = usePlayback();
  const [customUrl, setCustomUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      let formattedUrl = customUrl.trim();
      // Ensure it doesn't end with a slash for uniformity
      if (formattedUrl.endsWith('/')) {
        formattedUrl = formattedUrl.slice(0, -1);
      }
      setInstanceUrl(formattedUrl);
      setCustomUrl('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="home-welcome">
        <h2>Settings</h2>
        <p>Configure stream resolvers and customize your listening experience.</p>
      </div>

      <div className="settings-section glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h4>API Stream Resolver</h4>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          BeatFlow fetches stream audio and search results using open-source, privacy-friendly Piped instances. 
          If you experience slow loading times or query failures, switch to a different instance below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DEFAULT_INSTANCES.map((instance) => {
            const isActive = instance.url === instanceUrl;
            return (
              <div 
                key={instance.url} 
                className="instance-card glass-card"
                onClick={() => setInstanceUrl(instance.url)}
                style={{ 
                  cursor: 'pointer',
                  borderWidth: isActive ? '1px' : '1px',
                  borderColor: isActive ? 'var(--neon-cyan)' : 'var(--border-color)',
                  background: isActive ? 'var(--bg-surface-hover)' : 'var(--bg-card)'
                }}
              >
                <div className="instance-info">
                  <h5>{instance.name}</h5>
                  <p>{instance.url}</p>
                </div>
                {isActive && (
                  <div className="instance-badge">
                    <Check size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Active
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleCustomSubmit} className="custom-instance-input-group">
          <input
            type="url"
            className="search-input"
            placeholder="Or enter custom Piped API URL (e.g., https://pipedapi.example.com)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            style={{ paddingLeft: '16px' }}
            required
          />
          <button type="submit" className="btn-primary">
            Save
          </button>
        </form>

        {saveSuccess && (
          <div style={{ color: 'var(--neon-cyan)', fontSize: '13px', marginTop: '10px' }}>
            ✓ Custom API Instance updated successfully!
          </div>
        )}
      </div>

      <div className="settings-section glass-panel" style={{ padding: '24px' }}>
        <h4>About BeatFlow</h4>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>Version:</strong> 1.0.0 (Client-only Web Player)
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>No Ads:</strong> Plays audio files directly in your browser. YouTube ads are skipped automatically.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Hosting:</strong> Ready for zero-config deployments to Vercel, Netlify, or Github Pages.
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <HelpCircle size={16} />
            <span>If some songs fail to play, they might be blocked in the country where the selected API server is hosted. Try switching server regions (US/EU/AU).</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
