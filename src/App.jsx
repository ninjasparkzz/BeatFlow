import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import SearchBar from './components/SearchBar';
import TrackList from './components/TrackList';
import Queue from './components/Queue';
import Settings from './components/Settings';
import { usePlayback } from './context/PlaybackContext';
import { getPipedSearch } from './services/pipedApi';
import { Play, Sparkles, Clock, Heart, Headphones } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Queue panel visibility
  const [showQueue, setShowQueue] = useState(false);
  
  const { 
    instanceUrl, 
    setInstanceUrl,
    likedTracks, 
    playlists, 
    history, 
    playTrack 
  } = usePlayback();

  // Handle running searches
  const handleSearch = async (query, filter = 'music_songs') => {
    setSearchQuery(query);
    setActiveTab('search');
    setIsSearching(true);
    setSearchError('');
    
    try {
      const results = await getPipedSearch(query, instanceUrl, filter, setInstanceUrl);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setSearchError('Search failed. All selected API instances are busy or blocked. Try a custom server in Settings.');
    } finally {
      setIsSearching(false);
    }
  };

  // Genre Quick Listen Cards
  const GENRES = [
    {
      title: 'Lofi Chill Girl',
      query: 'lofi hip hop radio beats to study',
      artist: 'Curated beats for study and sleep',
      thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392f?q=80&w=250&auto=format&fit=crop'
    },
    {
      title: 'Neon Synthwave',
      query: 'synthwave retro synth music',
      artist: 'Outrun cybernetic retro melodies',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=250&auto=format&fit=crop'
    },
    {
      title: 'Drift Phonk Bass',
      query: 'drift phonk music playlist',
      artist: 'Aggressive cowbell beats & bass',
      thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=250&auto=format&fit=crop'
    },
    {
      title: 'Coffee Shop Acoustic',
      query: 'acoustic cover songs chill',
      artist: 'Cozy indie vocal acoustic tracks',
      thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=250&auto=format&fit=crop'
    }
  ];

  // Helper to fetch playlist by ID
  const getActivePlaylist = () => {
    return playlists.find(p => p.id === selectedPlaylistId);
  };

  return (
    <div className="app-container">
      {/* Background Decorative Ambient Lights */}
      <div className="ambient-glow"></div>
      <div className="ambient-glow-2"></div>

      {/* Sidebar Section */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedPlaylistId={selectedPlaylistId}
        setSelectedPlaylistId={setSelectedPlaylistId}
      />

      {/* Main Container */}
      <main className="main-view">
        {/* Render Search Bar on all screens except Settings & Playlists for fast navigation */}
        {activeTab !== 'settings' && (
          <SearchBar onSearch={handleSearch} initialQuery={activeTab === 'search' ? searchQuery : ''} />
        )}

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="fade-in">
            <div className="home-welcome">
              <h2>Welcome to BeatFlow</h2>
              <p>Search and stream millions of tracks from YouTube Music, entirely ad-free.</p>
            </div>

            <div className="section-header">
              <h3>Featured Moods</h3>
            </div>
            
            <div className="grid-cards">
              {GENRES.map((genre, idx) => (
                <div 
                  key={idx} 
                  className="music-card glass-card"
                  onClick={() => handleSearch(genre.query, 'music_songs')}
                >
                  <div className="card-img-wrapper">
                    <img 
                      src={genre.thumbnail} 
                      alt={genre.title} 
                      className="card-img" 
                      loading="lazy" 
                    />
                    <button className="card-play-btn">
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>
                  <div className="card-title">{genre.title}</div>
                  <div className="card-subtitle">{genre.artist}</div>
                </div>
              ))}
            </div>

            {/* Listening History */}
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div className="section-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} style={{ color: 'var(--pastel-blue)' }} />
                    Recently Played
                  </h3>
                </div>
                <TrackList tracks={history.slice(0, 5)} />
              </div>
            )}

            {/* Liked Tracks Quick View */}
            {likedTracks.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <div className="section-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={20} style={{ color: 'var(--pastel-pink)' }} />
                    Favorite Songs
                  </h3>
                  <span 
                    style={{ fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}
                    onClick={() => setActiveTab('liked')}
                  >
                    View All
                  </span>
                </div>
                <TrackList tracks={likedTracks.slice(0, 5)} />
              </div>
            )}
            
            {history.length === 0 && likedTracks.length === 0 && (
              <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Headphones size={40} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <h4>Your library is empty</h4>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Search for a track or click a Mood Card above to start streaming!</p>
              </div>
            )}
          </div>
        )}

        {/* Search Results Tab */}
        {activeTab === 'search' && (
          <div className="fade-in">
            <div className="home-welcome">
              <h3>Search Results for "{searchQuery}"</h3>
            </div>

            {isSearching ? (
              <div className="full-loader">
                <div className="spinner"></div>
                <p>Resolving tracks from YouTube Music...</p>
              </div>
            ) : searchError ? (
              <div style={{ color: 'var(--neon-pink)', padding: '20px 0', textAlign: 'center' }}>
                {searchError}
              </div>
            ) : (
              <TrackList tracks={searchResults} showHeader={true} />
            )}
          </div>
        )}

        {/* Liked Tracks Tab */}
        {activeTab === 'liked' && (
          <div className="fade-in">
            <div className="home-welcome">
              <h2>Liked Tracks</h2>
              <p>Your library of saved favorites ({likedTracks.length} tracks)</p>
            </div>
            <TrackList tracks={likedTracks} showHeader={true} />
          </div>
        )}

        {/* Playlist Tab */}
        {activeTab === 'playlist' && getActivePlaylist() && (
          <div className="fade-in">
            <div className="home-welcome">
              <h2>{getActivePlaylist().name}</h2>
              <p>Custom Playlist ({getActivePlaylist().tracks.length} tracks)</p>
            </div>
            <TrackList 
              tracks={getActivePlaylist().tracks} 
              showHeader={true} 
              playlistId={selectedPlaylistId} 
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="fade-in">
            <Settings />
          </div>
        )}
      </main>

      {/* Bottom Audio Controller */}
      <Player showQueue={showQueue} setShowQueue={setShowQueue} />

      {/* Slide-out Queue Panel */}
      {showQueue && (
        <Queue onClose={() => setShowQueue(false)} />
      )}
    </div>
  );
};

export default App;
