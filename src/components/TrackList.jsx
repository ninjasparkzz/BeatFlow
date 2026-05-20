import React, { useState, useEffect, useRef } from 'react';
import { CustomPlay, CustomPause, CustomPlus, CustomHeart, CustomList, CustomPlaylist } from './CustomIcons';
import { usePlayback } from '../context/PlaybackContext';

// Helper: Format duration (seconds to mm:ss)
export const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const TrackList = ({ tracks, showHeader = false, playlistId = null }) => {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlay,
    toggleLike, 
    isLiked, 
    addToQueue,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist
  } = usePlayback();

  const [activeMenuTrackId, setActiveMenuTrackId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuTrackId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRowClick = (track, e) => {
    // Prevent play if user clicks actions
    if (e.target.closest('.track-action-btn') || e.target.closest('.playlist-menu-dropdown')) {
      return;
    }
    playTrack(track, tracks);
  };

  const handlePlaylistSelect = (playlistId, track) => {
    addTrackToPlaylist(playlistId, track);
    setActiveMenuTrackId(null);
  };

  return (
    <div className="tracks-list-container">
      {showHeader && tracks.length > 0 && (
        <div 
          className="track-row" 
          style={{ 
            borderBottom: '1px solid var(--border-color)', 
            fontWeight: '600', 
            color: 'var(--text-secondary)',
            cursor: 'default',
            pointerEvents: 'none'
          }}
        >
          <div className="track-row-index">#</div>
          <div style={{ width: '40px', marginRight: '16px' }}></div>
          <div className="track-row-info">Title</div>
          <div className="track-row-duration">Duration</div>
          <div>Actions</div>
        </div>
      )}

      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;
        const liked = isLiked(track.id);

        return (
          <div 
            key={`${track.id}-${index}`} 
            className={`track-row ${isActive ? 'active' : ''}`}
            onClick={(e) => handleRowClick(track, e)}
          >
            <div className="track-row-index">
              {isActive ? (
                isPlaying ? (
                  <>
                    <div className="track-index-visualizer">
                      <div className="playing-bars">
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                      </div>
                    </div>
                    <button 
                      className="track-index-hover-btn" 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      title="Pause"
                    >
                      <CustomPause size={12} fill="currentColor" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="track-index-num active-text">{index + 1}</span>
                    <button 
                      className="track-index-hover-btn" 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      title="Play"
                    >
                      <CustomPlay size={12} fill="currentColor" />
                    </button>
                  </>
                )
              ) : (
                <>
                  <span className="track-index-num">{index + 1}</span>
                  <button 
                    className="track-index-hover-btn" 
                    onClick={(e) => { e.stopPropagation(); playTrack(track, tracks); }}
                    title="Play"
                  >
                    <CustomPlay size={12} fill="currentColor" style={{ marginLeft: '1px' }} />
                  </button>
                </>
              )}
            </div>

            <img 
              src={track.thumbnail} 
              alt={track.title} 
              className="track-row-thumbnail" 
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop';
              }}
            />

            <div className="track-row-info">
              <div className="track-row-title">{track.title}</div>
              <div className="track-row-artist">{track.uploader}</div>
            </div>

            <div className="track-row-duration">
              {formatDuration(track.duration)}
            </div>

            <div className="track-row-actions" style={{ position: 'relative' }}>
              <button 
                className={`track-action-btn ${liked ? 'liked' : ''}`}
                onClick={() => toggleLike(track)}
                title={liked ? "Unlike" : "Like"}
              >
                <CustomHeart size={16} fill={liked ? "currentColor" : "none"} />
              </button>

              <button 
                className="track-action-btn"
                onClick={() => addToQueue(track)}
                title="Add to queue"
              >
                <CustomPlus size={18} />
              </button>

              {/* Playlist context menu */}
              <button 
                className="track-action-btn"
                onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                title="Add to playlist"
              >
                <CustomList size={18} />
              </button>

              {activeMenuTrackId === track.id && (
                <div 
                  className="suggestions-dropdown playlist-menu-dropdown" 
                  ref={menuRef}
                  style={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: '28px', 
                    width: '200px',
                    margin: 0
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    ADD TO PLAYLIST
                  </div>
                  {playlists.map(pl => (
                    <div 
                      key={pl.id} 
                      className="suggestion-item"
                      onClick={() => handlePlaylistSelect(pl.id, track)}
                      style={{ padding: '10px 14px' }}
                    >
                      <CustomPlaylist size={14} style={{ marginRight: '6px' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.name}
                      </span>
                    </div>
                  ))}
                  {playlists.length === 0 && (
                    <div style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      No playlists created yet. Create one in the sidebar!
                    </div>
                  )}

                  {playlistId && (
                    <>
                      <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                      <div 
                        className="suggestion-item"
                        onClick={() => {
                          removeTrackFromPlaylist(playlistId, track.id);
                          setActiveMenuTrackId(null);
                        }}
                        style={{ padding: '10px 14px', color: 'var(--pastel-pink)' }}
                      >
                        Remove from Playlist
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {tracks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No tracks found.
        </div>
      )}
    </div>
  );
};

export default TrackList;
