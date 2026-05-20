import React, { useState, useEffect, useRef } from 'react';
import { CustomSearch, CustomChevronDown, CustomX, CustomMusicNote, CustomAlbum, CustomPlaylist } from './CustomIcons';
import { getPipedSuggestions } from '../services/pipedApi';
import { usePlayback } from '../context/PlaybackContext';

const SearchBar = ({ onSearch, initialQuery = '' }) => {
  const { instanceUrl } = usePlayback();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState('music_songs');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Sync initialQuery prop
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!query.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await getPipedSuggestions(query, instanceUrl);
        setSuggestions(results);
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, showSuggestions, instanceUrl]);

  // Handle clicking outside suggestions and filter to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), filter);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion, filter);
    setShowSuggestions(false);
  };

  return (
    <div className="search-container" ref={containerRef}>
      <form onSubmit={handleSubmit} className="search-input-wrapper">
        <CustomSearch className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search for songs, artists, playlists..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {query && (
          <button
            type="button"
            className="track-action-btn"
            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
          >
            <CustomX size={18} />
          </button>
        )}

        {/* Autocomplete Dropdown rendered inside search-input-wrapper for absolute alignment */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <CustomSearch size={14} style={{ opacity: 0.5 }} />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Custom Sleek Dropdown Selection */}
      <div className="custom-select-container">
        <button
          type="button"
          className="custom-select-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {filter === 'music_songs' && (
              <>
                <CustomMusicNote size={16} style={{ color: 'var(--pastel-purple)' }} />
                <span>Songs</span>
              </>
            )}
            {filter === 'music_albums' && (
              <>
                <CustomAlbum size={16} style={{ color: 'var(--pastel-green)' }} />
                <span>Albums</span>
              </>
            )}
            {filter === 'music_playlists' && (
              <>
                <CustomPlaylist size={16} style={{ color: 'var(--pastel-pink)' }} />
                <span>Playlists</span>
              </>
            )}
            {filter === 'all' && (
              <>
                <CustomSearch size={16} style={{ color: 'var(--text-muted)' }} />
                <span>Everything</span>
              </>
            )}
          </span>
          <CustomChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`} />
        </button>
        {isDropdownOpen && (
          <div className="custom-select-options">
            <div
              className={`custom-select-option ${filter === 'music_songs' ? 'selected' : ''}`}
              onClick={() => {
                setFilter('music_songs');
                setIsDropdownOpen(false);
                if (query.trim()) onSearch(query.trim(), 'music_songs');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <CustomMusicNote size={14} />
              <span>Songs</span>
            </div>
            <div
              className={`custom-select-option ${filter === 'music_albums' ? 'selected' : ''}`}
              onClick={() => {
                setFilter('music_albums');
                setIsDropdownOpen(false);
                if (query.trim()) onSearch(query.trim(), 'music_albums');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <CustomAlbum size={14} />
              <span>Albums</span>
            </div>
            <div
              className={`custom-select-option ${filter === 'music_playlists' ? 'selected' : ''}`}
              onClick={() => {
                setFilter('music_playlists');
                setIsDropdownOpen(false);
                if (query.trim()) onSearch(query.trim(), 'music_playlists');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <CustomPlaylist size={14} />
              <span>Playlists</span>
            </div>
            <div
              className={`custom-select-option ${filter === 'all' ? 'selected' : ''}`}
              onClick={() => {
                setFilter('all');
                setIsDropdownOpen(false);
                if (query.trim()) onSearch(query.trim(), 'all');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <CustomSearch size={14} />
              <span>Everything</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
