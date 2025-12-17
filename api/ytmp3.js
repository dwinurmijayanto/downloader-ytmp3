// api/ytmp3.js
import fetch from 'node-fetch';

// ========== HUGGINGFACE GRADIO CONFIG ==========
const GRADIO_CONFIG = {
    spaceUrl: 'https://adarshajay-youtube-search.hf.space',
    apiName: 'youtube_search',
    timeout: 30000
};

// ========== ZEINK.CC SHORTURL CONFIG ==========
const SHORTURL_CONFIG = {
    api: 'https://zeinklab.com/api/create',
    baseUrl: 'http://zeink.cc',
    timeout: 15000
};

function isValidYoutubeUrl(url) {
    const youtubePatterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\//,
        /^(https?:\/\/)?(youtu\.be)\//,
        /^(https?:\/\/)?(www\.)?youtube\.com\/live\//,
        /^(https?:\/\/)?(m\.)?youtube\.com\//
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

function normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    return url;
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

async function getGradioFnIndex() {
    try {
        const configUrl = `${GRADIO_CONFIG.spaceUrl}/config`;
        const response = await fetch(configUrl, { 
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            return 0;
        }
        
        const config = await response.json();
        
        if (config.dependencies) {
            for (let i = 0; i < config.dependencies.length; i++) {
                const dep = config.dependencies[i];
                if (dep.api_name === GRADIO_CONFIG.apiName || 
                    dep.api_name === `/${GRADIO_CONFIG.apiName}`) {
                    return i;
                }
            }
        }
        
        return 0;
    } catch (error) {
        return 0;
    }
}

function generateSessionHash() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let hash = '';
    for (let i = 0; i < 11; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

async function searchYoutubeViaGradio(query) {
    try {
        const fnIndex = await getGradioFnIndex();
        const sessionHash = generateSessionHash();
        
        const joinUrl = `${GRADIO_CONFIG.spaceUrl}/gradio_api/queue/join?__theme=system`;
        const joinPayload = {
            data: [query],
            event_data: null,
            fn_index: fnIndex,
            trigger_id: 11,
            session_hash: sessionHash
        };
        
        const joinResponse = await fetch(joinUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(joinPayload),
            signal: AbortSignal.timeout(10000)
        });
        
        if (!joinResponse.ok) {
            return null;
        }
        
        const joinData = await joinResponse.json();
        const eventId = joinData.event_id;
        
        if (!eventId) {
            return null;
        }
        
        const dataUrl = `${GRADIO_CONFIG.spaceUrl}/gradio_api/queue/data?session_hash=${sessionHash}`;
        
        const dataResponse = await fetch(dataUrl, {
            headers: {
                'Accept': 'text/event-stream',
            },
            signal: AbortSignal.timeout(GRADIO_CONFIG.timeout)
        });
        
        if (!dataResponse.ok) {
            return null;
        }
        
        const text = await dataResponse.text();
        
        const lines = text.split('\n');
        let resultData = null;
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const jsonStr = line.substring(6).trim();
                    if (!jsonStr) continue;
                    
                    const eventData = JSON.parse(jsonStr);
                    
                    if (eventData.msg === 'process_completed' && eventData.output?.data) {
                        resultData = eventData.output.data[0];
                        break;
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
        }
        
        if (!resultData) {
            return null;
        }
        
        const lines_result = resultData.split('\n');
        
        let videoTitle = '';
        let videoUrl = '';
        
        for (let i = 0; i < lines_result.length; i++) {
            const line = lines_result[i].trim();
            
            if (line.includes('youtube.com/watch?v=') || line.includes('youtu.be/')) {
                videoUrl = line;
                if (i > 0) {
                    videoTitle = lines_result[i - 1].trim();
                }
                break;
            }
        }
        
        if (!videoUrl) {
            return null;
        }
        
        let videoId = '';
        if (videoUrl.includes('watch?v=')) {
            videoId = videoUrl.split('watch?v=')[1].split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        }
        
        return {
            url: videoUrl,
            videoId: videoId,
            title: videoTitle || 'YouTube Audio',
            channelName: 'Unknown',
            lengthText: 'Unknown'
        };
        
    } catch (error) {
        console.error('Error pencarian YouTube:', error.message);
        return null;
    }
}

async function shortenUrl(longUrl) {
    try {
        if (!isValidUrl(longUrl)) {
            return longUrl;
        }

        const payload = { url: longUrl };

        const response = await fetch(SHORTURL_CONFIG.api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://zeinklab.com',
                'Referer': 'https://zeinklab.com/create'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(SHORTURL_CONFIG.timeout)
        });

        if (!response.ok) {
            return longUrl;
        }

        let responseText = await response.text();
        
        const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
            responseText = jsonMatch[1];
        }
        
        const result = JSON.parse(responseText);

        if (result.success && result.short_url) {
            let url = result.short_url;
            if (url.startsWith('/')) {
                url = SHORTURL_CONFIG.baseUrl + url;
            } else if (!url.startsWith('http')) {
                url = SHORTURL_CONFIG.baseUrl + '/' + url;
            }
            
            return url;
        }
        
        return longUrl;

    } catch (error) {
        console.error('Error saat membuat shorturl:', error.message);
        return longUrl;
    }
}

async function getYoutubeMp3Url(youtubeUrl) {
    const normalizedUrl = normalizeUrl(youtubeUrl);
    const videoId = extractVideoId(normalizedUrl);
    
    if (!videoId) {
        return null;
    }
    
    const API_KEY = '3a7e9844ffmsh5d0520e908fa6e7p1da7d9jsn9d8f1e787e46';
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok' || !data.link) {
            return null;
        }
        
        return {
            url: data.link,
            title: data.title || 'YouTube Audio',
            duration: data.duration || 'Unknown',
            size: data.size || 'Unknown',
            videoId: videoId
        };
        
    } catch (error) {
        console.error(`API gagal:`, error.message);
        return null;
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get input from query params or body
        const input = req.method === 'GET' 
            ? req.query.q || req.query.url || req.query.query
            : req.body?.q || req.body?.url || req.body?.query;

        if (!input) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: 'Please provide "q", "url", or "query" parameter',
                usage: {
                    direct: '/api/ytmp3?url=https://youtube.com/watch?v=...',
                    search: '/api/ytmp3?q=despacito'
                }
            });
        }

        let youtubeUrl = input;
        let searchMode = false;

        // Check if input is URL or search query
        if (!isValidYoutubeUrl(input)) {
            searchMode = true;
            console.log(`Search mode: "${input}"`);

            const searchResult = await searchYoutubeViaGradio(input);

            if (!searchResult || !searchResult.url) {
                return res.status(404).json({
                    error: 'Video not found',
                    message: `No video found for: "${input}"`,
                    searchMode: true
                });
            }

            youtubeUrl = searchResult.url;
        }

        const audioData = await getYoutubeMp3Url(youtubeUrl);

        if (!audioData || !audioData.url) {
            return res.status(500).json({
                error: 'Download failed',
                message: 'Failed to get download URL from API'
            });
        }

        // Try to shorten URL
        const shortUrl = await shortenUrl(audioData.url);

        return res.status(200).json({
            success: true,
            searchMode,
            data: {
                title: audioData.title,
                duration: audioData.duration,
                size: audioData.size,
                videoId: audioData.videoId,
                downloadUrl: audioData.url,
                shortUrl: shortUrl !== audioData.url ? shortUrl : undefined,
                youtubeUrl
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
