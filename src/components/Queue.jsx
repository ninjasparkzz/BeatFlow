import React from 'react';
import { CustomTrash, CustomX } from './CustomIcons';
import { usePlayback } from '../context/PlaybackContext';

const Queue = ({ onClose }) => {
  const { 
    queue, 
    currentIndex, 
    playTrack, 
    removeFromQueue, 
    clearQueue 
  } = usePlayback();

  return (
    <div className="queue-panel glass-panel">
      <div className="panel-header">
        <h4>Play Queue ({queue.length})</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {queue.length > 0 && (
            <button 
              className="track-action-btn"
              onClick={clearQueue}
              title="Clear all"
              style={{ color: 'var(--pastel-pink)' }}
            >
              <CustomTrash size={16} />
            </button>
          )}
          <button className="track-action-btn" onClick={onClose} title="Close Panel">
            <CustomX size={18} />
          </button>
        </div>
      </div>

      <div className="panel-content">
        {queue.map((track, index) => {
          const isActive = index === currentIndex;
          return (
            <div 
              key={`${track.id}-${index}`}
              className={`queue-item ${isActive ? 'active' : ''}`}
              onClick={() => playTrack(track, queue)}
            >
              <div className="queue-item-info">
                <div className="queue-item-title">{track.title}</div>
                <div className="queue-item-artist">{track.uploader}</div>
              </div>
              <button
                className="track-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(index);
                }}
                title="Remove from queue"
              >
                <CustomX size={14} />
              </button>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '13px' }}>
            Queue is empty. Find some music and add to queue!
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
