export const DEFAULT_INSTANCES = [
  { name: 'Private Coffee (EU)', url: 'https://api.piped.private.coffee' },
  { name: 'Kavin Rocks (US)', url: 'https://pipedapi.kavin.rocks' },
  { name: 'Lunar ICU (EU)', url: 'https://piped-api.lunar.icu' },
  { name: 'Syncord (US)', url: 'https://pipedapi.syncord.org' },
  { name: 'Ducks Party (EU)', url: 'https://pipedapi.ducks.party' }
];

// Helper: Fetch with a configurable timeout in milliseconds
const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// Search tracks with an integrated automatic fallback loop
export const getPipedSearch = async (query, instanceUrl = DEFAULT_INSTANCES[0].url, filter = 'music_songs', onInstanceSwitch = null) => {
  // Order instances so the active one is tried first
  const urlsToTry = [
    instanceUrl, 
    ...DEFAULT_INSTANCES.map(i => i.url).filter(url => url !== instanceUrl)
  ];
  let lastError = null;

  for (const url of urlsToTry) {
    try {
      console.log(`Searching for "${query}" (filter: ${filter}) via ${url}...`);
      const searchUrl = `${url}/search?q=${encodeURIComponent(query)}&filter=${filter}`;
      const response = await fetchWithTimeout(searchUrl, { timeout: 5000 });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If we succeeded on a fallback instance, update the user's active instance selection
      if (url !== instanceUrl && onInstanceSwitch) {
        console.log(`Search failover success! Updating active Piped API server to: ${url}`);
        onInstanceSwitch(url);
      }

      // Normalize items
      return (data.items || []).map(item => {
        const videoId = item.url ? item.url.split('v=')[1] || item.url.split('/').pop() : item.id;
        return {
          id: videoId,
          title: item.title,
          uploader: item.uploaderName || item.uploader || 'Unknown Artist',
          duration: item.duration || 0,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : (item.thumbnail || item.thumbnails?.[0] || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'),
          type: item.type || 'stream',
          views: item.views || 0,
          uploaded: item.uploadedText || ''
        };
      });
    } catch (err) {
      console.warn(`Search failed via ${url}. Trying next instance...`, err);
      lastError = err;
    }
  }
  
  throw lastError || new Error('All search API instances failed to resolve.');
};

// Stream fetcher with explicit 5-second connection timeout
export const getPipedStream = async (videoId, instanceUrl = DEFAULT_INSTANCES[0].url) => {
  try {
    const url = `${instanceUrl}/streams/${videoId}`;
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const audioStreams = data.audioStreams || [];
    
    if (audioStreams.length === 0) {
      throw new Error('No audio streams found for this track');
    }
    
    const m4aStream = audioStreams.find(s => s.mimeType && s.mimeType.includes('audio/mp4'));
    const chosenStream = m4aStream || audioStreams[0];
    
    return {
      streamUrl: chosenStream.url,
      mimeType: chosenStream.mimeType,
      duration: data.duration || 0,
      title: data.title,
      uploader: data.uploader || 'Unknown Artist',
      thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : (data.thumbnailUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop'),
      description: data.description || '',
      relatedStreams: (data.relatedStreams || []).map(item => {
        const relId = item.url ? item.url.split('v=')[1] || item.url.split('/').pop() : item.id;
        return {
          id: relId,
          title: item.title,
          uploader: item.uploaderName || item.uploader || 'Unknown Artist',
          duration: item.duration || 0,
          thumbnail: relId ? `https://img.youtube.com/vi/${relId}/mqdefault.jpg` : (item.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop')
        };
      })
    };
  } catch (error) {
    console.error('Piped stream fetch failed:', error);
    throw error;
  }
};

// Fetch suggestions with a tight 2-second timeout to avoid UI input blocks
export const getPipedSuggestions = async (query, instanceUrl = DEFAULT_INSTANCES[0].url) => {
  try {
    const url = `${instanceUrl}/suggestions?query=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, { timeout: 2000 });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Piped suggestions failed:', error);
    return [];
  }
};
