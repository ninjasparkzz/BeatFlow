import React, { useState } from 'react';
import { CustomHome, CustomSearch, CustomHeart, CustomSettings, CustomPlus, CustomPlaylist, CustomTrash } from './CustomIcons';
import { usePlayback } from '../context/PlaybackContext';

const Sidebar = ({ activeTab, setActiveTab, selectedPlaylistId, setSelectedPlaylistId }) => {
  const { playlists, createPlaylist, deletePlaylist } = usePlayback();
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setSelectedPlaylistId(null);
  };

  const handlePlaylistClick = (playlistId) => {
    setActiveTab('playlist');
    setSelectedPlaylistId(playlistId);
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowModal(false);
    }
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="logo-container">
        <MusicIcon className="logo-icon" size={28} />
        <span className="logo-text">BeatFlow</span>
      </div>

      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => handleNavClick('home')}
        >
          <CustomHome size={20} />
          <span>Home</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleNavClick('search')}
        >
          <CustomSearch size={20} />
          <span>Search</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => handleNavClick('liked')}
        >
          <CustomHeart size={20} />
          <span>Liked Tracks</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <CustomSettings size={20} />
          <span>Settings</span>
        </div>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-section-title">Playlists</div>
      
      <button 
        className="playlist-create-btn"
        onClick={() => setShowModal(true)}
      >
        <CustomPlus size={18} />
        <span>Create Playlist</span>
      </button>

      <div className="sidebar-playlists">
        {playlists.map((pl) => (
          <div 
            key={pl.id}
            className={`playlist-nav-item ${activeTab === 'playlist' && selectedPlaylistId === pl.id ? 'active nav-item' : ''}`}
            onClick={() => handlePlaylistClick(pl.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <CustomPlaylist size={16} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pl.name}
              </span>
            </div>
            <CustomTrash 
              size={14} 
              className="track-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${pl.name}"?`)) {
                  deletePlaylist(pl.id);
                  if (selectedPlaylistId === pl.id) {
                    handleNavClick('home');
                  }
                }
              }}
            />
          </div>
        ))}
        {playlists.length === 0 && (
          <p style={{ padding: '0 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            No playlists yet.
          </p>
        )}
      </div>

      {/* Playlist Creation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content glass-panel" onSubmit={handleCreatePlaylist}>
            <h3>Create Playlist</h3>
            <input 
              type="text" 
              className="modal-input"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              required
            />
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};

// Helper: Custom SVG icon for logo (Modern Soundwave/Equalizer Design)
const MusicIcon = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <rect x="3" y="10" width="3" height="4" rx="1" fill="currentColor" stroke="none" />
    <rect x="8" y="6" width="3" height="12" rx="1" fill="currentColor" stroke="none" />
    <rect x="13" y="3" width="3" height="18" rx="1" fill="currentColor" stroke="none" />
    <rect x="18" y="8" width="3" height="8" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export default Sidebar;
