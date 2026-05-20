import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getPipedStream, DEFAULT_INSTANCES } from '../services/pipedApi';

const PlaybackContext = createContext();

export const PlaybackProvider = ({ children }) => {
  const [instanceUrl, setInstanceUrlState] = useState(() => {
    return localStorage.getItem('beatflow_instance_url') || DEFAULT_INSTANCES[0].url;
  });
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('beatflow_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Queue state
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'

  // Library state (LocalStorage)
  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('beatflow_liked') || '[]');
    } catch {
      return [];
    }
  });
  
  const [playlists, setPlaylists] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('beatflow_playlists') || '[]');
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('beatflow_history') || '[]');
    } catch {
      return [];
    }
  });

  const ytPlayerRef = useRef(null);
  const [isYtReady, setIsYtReady] = useState(false);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('beatflow_liked', JSON.stringify(likedTracks));
  }, [likedTracks]);

  useEffect(() => {
    localStorage.setItem('beatflow_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('beatflow_history', JSON.stringify(history));
  }, [history]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsYtReady(true);
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setIsYtReady(true);
    };

    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      // Script is already added but window.YT might not be ready yet. Poll for readiness.
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsYtReady(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Instantiate the YT Player when YT API is ready
  useEffect(() => {
    if (!isYtReady || ytPlayerRef.current) return;

    try {
      ytPlayerRef.current = new window.YT.Player('youtube-player-hidden', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(isMuted ? 0 : volume * 100);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              setErrorMsg('');
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsLoading(false);
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsLoading(true);
            } else if (event.data === 5) { // CUED
              setIsLoading(false);
              try {
                event.target.playVideo();
              } catch (err) {
                console.warn('Failed to autoplay cued video:', err);
              }
            }
          },
          onError: (event) => {
            console.error('YT Player Error:', event.data);
            setErrorMsg('Could not play this track. It may be restricted by YouTube.');
            setIsLoading(false);
          }
        }
      });
    } catch (e) {
      console.error('Error creating YouTube player:', e);
    }
  }, [isYtReady]);

  // Volume control effect
  useEffect(() => {
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
    localStorage.setItem('beatflow_volume', volume.toString());
  }, [volume, isMuted]);

  // Handle Play/Pause execution
  useEffect(() => {
    if (!ytPlayerRef.current) return;
    try {
      if (isPlaying) {
        if (ytPlayerRef.current.playVideo) ytPlayerRef.current.playVideo();
      } else {
        if (ytPlayerRef.current.pauseVideo) ytPlayerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn('YT Player control error:', e);
    }
  }, [isPlaying]);

  // Time and duration tracking interval
  useEffect(() => {
    let timer = null;
    if (isPlaying && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
      timer = setInterval(() => {
        try {
          const current = ytPlayerRef.current.getCurrentTime();
          setCurrentTime(current);
          const total = ytPlayerRef.current.getDuration();
          if (total && total !== duration) {
            setDuration(total);
          }
        } catch (e) {
          // ignore transient player errors
        }
      }, 500);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  // Instance settings updater
  const setInstanceUrl = (url) => {
    setInstanceUrlState(url);
    localStorage.setItem('beatflow_instance_url', url);
  };

  // Play a specific track
  const playTrack = async (track, newQueue = null) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      setIsPlaying(false);
      
      setCurrentTrack(track);
      
      // Update queue
      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex(t => t.id === track.id);
        setCurrentIndex(idx !== -1 ? idx : 0);
      } else {
        const idx = queue.findIndex(t => t.id === track.id);
        if (idx !== -1) {
          setCurrentIndex(idx);
        } else {
          const updatedQueue = [...queue];
          const insertIdx = currentIndex + 1;
          updatedQueue.splice(insertIdx, 0, track);
          setQueue(updatedQueue);
          setCurrentIndex(insertIdx);
        }
      }

      // Add to play history
      setHistory(prev => {
        const filtered = prev.filter(t => t.id !== track.id);
        return [track, ...filtered].slice(0, 50);
      });

      // Play on YouTube
      if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        ytPlayerRef.current.loadVideoById(track.id);
        setIsPlaying(true);
      } else {
        console.warn('YouTube player not ready, attempting load delay...');
        setTimeout(() => {
          if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
            ytPlayerRef.current.loadVideoById(track.id);
            setIsPlaying(true);
          } else {
            setErrorMsg('YouTube player is initializing. Please click play again in a moment.');
          }
        }, 1200);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to play track:', err);
      setErrorMsg('Failed to initialize playback.');
      setIsLoading(false);
    }
  };

  // Skip controls
  const nextTrack = () => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(0);
        ytPlayerRef.current.playVideo();
      }
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[randomIndex]);
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex < queue.length) {
        playTrack(queue[nextIndex]);
      } else if (repeatMode === 'all') {
        playTrack(queue[0]);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;

    if (currentTime > 4) {
      seek(0);
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      playTrack(queue[prevIndex]);
    } else if (repeatMode === 'all') {
      playTrack(queue[queue.length - 1]);
    } else {
      seek(0);
    }
  };

  // Playback Control Handlers
  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const seek = (time) => {
    if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
      setCurrentTime(time);
    }
  };

  const setVolume = (v) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (val > 0) setIsMuted(false);
  };

  // Queue Operations
  const addToQueue = (track) => {
    if (queue.some(t => t.id === track.id)) return;
    setQueue(prev => [...prev, track]);
    if (queue.length === 0) {
      setCurrentIndex(0);
      playTrack(track, [track]);
    }
  };

  const removeFromQueue = (index) => {
    const updated = [...queue];
    updated.splice(index, 1);
    setQueue(updated);

    if (index === currentIndex) {
      if (updated.length === 0) {
        setCurrentTrack(null);
        setIsPlaying(false);
        setCurrentIndex(-1);
      } else {
        const nextIdx = index >= updated.length ? updated.length - 1 : index;
        setCurrentIndex(nextIdx);
        playTrack(updated[nextIdx], updated);
      }
    } else if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  // Likes & Custom Playlists Logic
  const toggleLike = (track) => {
    setLikedTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const isLiked = (trackId) => likedTracks.some(t => t.id === trackId);

  const createPlaylist = (name) => {
    if (!name.trim()) return;
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.trim(),
      tracks: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const addTrackToPlaylist = (playlistId, track) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id !== playlistId) return playlist;
      if (playlist.tracks.some(t => t.id === track.id)) return playlist;
      return {
        ...playlist,
        tracks: [...playlist.tracks, track]
      };
    }));
  };

  const removeTrackFromPlaylist = (playlistId, trackId) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id !== playlistId) return playlist;
      return {
        ...playlist,
        tracks: playlist.tracks.filter(t => t.id !== trackId)
      };
    }));
  };

  return (
    <PlaybackContext.Provider value={{
      instanceUrl,
      setInstanceUrl,
      currentTrack,
      playbackUrl: currentTrack?.id || '',
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isLoading,
      errorMsg,
      queue,
      currentIndex,
      shuffle,
      repeatMode,
      likedTracks,
      playlists,
      history,
      
      setShuffle,
      setRepeatMode,
      setIsMuted,
      playTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      addToQueue,
      removeFromQueue,
      clearQueue,
      toggleLike,
      isLiked,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist
    }}>
      {children}
      {/* Invisible YouTube Player iframe Target */}
      <div 
        id="youtube-player-hidden" 
        style={{ 
          position: 'absolute', 
          width: '1px', 
          height: '1px', 
          left: '-9999px', 
          opacity: 0, 
          pointerEvents: 'none' 
        }} 
      />
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => useContext(PlaybackContext);
