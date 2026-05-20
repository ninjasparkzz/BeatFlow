import React, { useState, useEffect } from 'react';
import { 
  CustomPlay, 
  CustomPause, 
  CustomNext, 
  CustomPrev, 
  CustomShuffle, 
  CustomRepeat, 
  CustomVolume, 
  CustomMute, 
  CustomPlaylist, 
  CustomHeart,
  CustomLoader,
  CustomChevronDown
} from './CustomIcons';
import { usePlayback } from '../context/PlaybackContext';
import { formatDuration } from './TrackList';

const Player = ({ showQueue, setShowQueue }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    errorMsg,
    shuffle,
    repeatMode,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    setIsMuted,
    toggleLike,
    isLiked,
    setShuffle,
    setRepeatMode
  } = usePlayback();

  const [isExpanded, setIsExpanded] = useState(false);
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  // Listen for Escape key to close the expanded player
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <div className="player-bar">
        {/* Left Track Info - Click to Expand */}
        <div 
          className="player-track-info" 
          onClick={() => currentTrack && setIsExpanded(true)}
          style={{ cursor: currentTrack ? 'pointer' : 'default' }}
          title={currentTrack ? "Click to expand player" : undefined}
        >
          {currentTrack ? (
            <>
              <div className="player-thumbnail-container">
                <img 
                  src={currentTrack.thumbnail} 
                  alt={currentTrack.title} 
                  className="player-thumbnail"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop';
                  }}
                />
              </div>
              <div className="player-meta">
                <div className="player-title" title={currentTrack.title}>
                  {currentTrack.title}
                </div>
                <div className="player-artist" title={currentTrack.uploader}>
                  {currentTrack.uploader}
                </div>
              </div>
              <button 
                className={`track-action-btn ${liked ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Avoid expanding player
                  toggleLike(currentTrack);
                }}
                style={{ marginLeft: '10px' }}
                title={liked ? "Unlike" : "Like"}
              >
                <CustomHeart size={16} fill={liked ? "currentColor" : "none"} />
              </button>
            </>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No track selected
            </div>
          )}
        </div>

        {/* Center Controls & Seek Bar */}
        <div className="player-controls-container">
          {errorMsg && (
            <div style={{ color: 'var(--pastel-pink)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', margin: '-10px 0 2px' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          <div className="control-buttons">
            <button 
              className={`control-btn ${shuffle ? 'active' : ''}`}
              onClick={() => setShuffle(!shuffle)}
              title="Shuffle"
            >
              <CustomShuffle size={18} />
            </button>
            
            <button 
              className="control-btn"
              onClick={prevTrack}
              disabled={!currentTrack}
              title="Previous"
            >
              <CustomPrev size={20} />
            </button>

            {isLoading ? (
              <button className="control-btn-play" style={{ background: 'var(--primary)', color: '#fff' }} disabled>
                <CustomLoader className="spinner" size={20} style={{ animation: 'spin 1s linear infinite' }} />
              </button>
            ) : (
              <button 
                className="control-btn-play" 
                onClick={togglePlay}
                disabled={!currentTrack}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <CustomPause size={20} fill="currentColor" /> : <CustomPlay size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
              </button>
            )}

            <button 
              className="control-btn"
              onClick={nextTrack}
              disabled={!currentTrack}
              title="Next"
            >
              <CustomNext size={20} />
            </button>

            <button 
              className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={() => {
                const modes = ['off', 'all', 'one'];
                const currentIdx = modes.indexOf(repeatMode);
                const nextMode = modes[(currentIdx + 1) % modes.length];
                setRepeatMode(nextMode);
              }}
              title={`Repeat: ${repeatMode}`}
              style={{ position: 'relative' }}
            >
              <CustomRepeat size={20} />
              {repeatMode === 'one' && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-6px', 
                  fontSize: '8px', 
                  fontWeight: '800', 
                  background: 'var(--pastel-purple)', 
                  color: 'var(--bg-base)', 
                  padding: '1px 3px', 
                  borderRadius: '4px' 
                }}>
                  1
                </span>
              )}
              {repeatMode === 'all' && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-6px', 
                  fontSize: '8px', 
                  fontWeight: '800', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  padding: '1px 3px', 
                  borderRadius: '4px' 
                }}>
                  All
                </span>
              )}
            </button>
          </div>
   
          {/* Seek Bar */}
          <div className="player-progress-bar">
            <span className="progress-time">{formatDuration(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              disabled={!currentTrack}
              style={{
                flex: 1,
                accentColor: 'var(--pastel-purple)',
                height: '5px',
                borderRadius: '5px',
                cursor: 'pointer',
                opacity: currentTrack ? 1 : 0.5
              }}
            />
            <span className="progress-time">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Controls (Volume, Queue Toggle) */}
        <div className="player-actions-right">
          <button 
            className={`control-btn ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title="Play Queue"
          >
            <CustomPlaylist size={20} />
          </button>

          <div className="volume-container">
            <button 
              className="control-btn" 
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <CustomMute size={18} /> : <CustomVolume size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: '70px',
                accentColor: 'var(--primary)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Popup Player Overlay */}
      {isExpanded && currentTrack && (
        <div className="expanded-player-overlay">
          {/* Close Button */}
          <button 
            className="expanded-close-btn" 
            onClick={() => setIsExpanded(false)} 
            title="Close (Esc)"
          >
            <CustomChevronDown size={32} />
          </button>
          
          <div className="expanded-content animate-slide-up">
            {/* Huge Album Art with dynamic pastel background glow */}
            <div className="expanded-art-container">
              <div 
                className="expanded-art-glow" 
                style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
              ></div>
              <img 
                src={currentTrack.thumbnail} 
                alt={currentTrack.title} 
                className="expanded-art" 
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Track Info */}
            <div className="expanded-title" title={currentTrack.title}>
              {currentTrack.title}
            </div>
            <div className="expanded-artist" title={currentTrack.uploader}>
              {currentTrack.uploader}
            </div>

            {/* Seek Bar */}
            <div className="expanded-progress-container">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                style={{
                  width: '100%',
                  accentColor: 'var(--pastel-purple)',
                  height: '6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)'
                }}
              />
              <div className="expanded-time-row">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Big Control Buttons */}
            <div className="expanded-controls">
              <button 
                className={`expanded-control-btn ${shuffle ? 'active' : ''}`}
                onClick={() => setShuffle(!shuffle)}
                title="Shuffle"
              >
                <CustomShuffle size={22} />
              </button>
              
              <button 
                className="expanded-control-btn"
                onClick={prevTrack}
                title="Previous"
              >
                <CustomPrev size={24} />
              </button>

              {isLoading ? (
                <button className="expanded-control-btn-play" disabled>
                  <CustomLoader className="spinner" size={28} style={{ animation: 'spin 1s linear infinite' }} />
                </button>
              ) : (
                <button 
                  className="expanded-control-btn-play" 
                  onClick={togglePlay}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <CustomPause size={28} fill="currentColor" />
                  ) : (
                    <CustomPlay size={28} fill="currentColor" style={{ marginLeft: '4px' }} />
                  )}
                </button>
              )}

              <button 
                className="expanded-control-btn"
                onClick={nextTrack}
                title="Next"
              >
                <CustomNext size={24} />
              </button>

              <button 
                className={`expanded-control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                onClick={() => {
                  const modes = ['off', 'all', 'one'];
                  const currentIdx = modes.indexOf(repeatMode);
                  const nextMode = modes[(currentIdx + 1) % modes.length];
                  setRepeatMode(nextMode);
                }}
                title={`Repeat: ${repeatMode}`}
                style={{ position: 'relative' }}
              >
                <CustomRepeat size={22} />
                {repeatMode === 'one' && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-4px', 
                    right: '-6px', 
                    fontSize: '8px', 
                    fontWeight: '800', 
                    background: 'var(--pastel-purple)', 
                    color: 'var(--bg-base)', 
                    padding: '1px 3px', 
                    borderRadius: '4px' 
                }}>
                  1
                </span>
              )}
              {repeatMode === 'all' && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-6px', 
                  fontSize: '8px', 
                  fontWeight: '800', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  padding: '1px 3px', 
                  borderRadius: '4px' 
                }}>
                  All
                </span>
              )}
              </button>
            </div>

            {/* Bottom Actions inside overlay */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '16px', padding: '0 4px' }}>
              <button 
                className={`track-action-btn ${liked ? 'liked' : ''}`}
                onClick={() => toggleLike(currentTrack)}
                style={{ scale: '1.25' }}
                title={liked ? "Unlike" : "Like"}
              >
                <CustomHeart size={20} fill={liked ? "currentColor" : "none"} />
              </button>

              <div className="volume-container" style={{ width: '140px' }}>
                <button 
                  className="control-btn" 
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <CustomMute size={18} /> : <CustomVolume size={18} />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '100%',
                    accentColor: 'var(--primary)',
                    height: '4px',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Player;
