const axios = require('axios');
const csvParser = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

// Får tilgang til Spotify API gjennom Client ID og Secret fra .env-fil

async function getSpotifyAccessToken() {
    const authEndpoint = 'https://accounts.spotify.com/api/token';
    const credentials = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(authEndpoint, 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      }
    });
    
    return response.data.access_token;
  }

  // Definerer en sleep funksjon som gjør at man ikke sender for mange requests til Spotify samtidig

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Får lyd informasjon fra Spotify gjennom å bruke AcessToken

  async function getAudioFeatures(accessToken, trackId) {
    const url = `https://api.spotify.com/v1/audio-features/${trackId}`;
  
    const response = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
  
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error(`Failed to fetch audio features for track ID: ${trackId}`);
    }
  }
  
  // Søker på sang og artist i Spotify og gir tilbake første resultat om det finnes noe på søket

  async function searchSong(accessToken, song, artist) {
    const query = `track:${song} artist:${artist}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
  
    if (response.ok) {
      const data = await response.json();
      
      if (data.tracks.items.length > 0) {
        const track = data.tracks.items[0];
        return track;
      } else {
        // Ingen søk på resultatet fra query
      }
    } else {
      // Feilet på å fetche track data for query
    }
  }

  // Leser csv-filen som er spesifisert og søker på Spotify vha. searchSong funksjonen, 
  // og henter lengden på sangen gjennom getAudioFeatures funksjonen.

  async function fetchSongDurations() {
    const accessToken = await getSpotifyAccessToken();
    const songs = [];
    const songDurations = [];
  
    return new Promise((resolve, reject) => {
      fs.createReadStream('Spotify Tester.csv')
        .pipe(csvParser({ separator: ';' }))
        .on('data', (row) => {
          const song = row.track_name;
          const artist = row.artist_names;
          songs.push({ song, artist });
        })
        .on('end', async () => {
          for (const songObj of songs) {
            await sleep(100)
            const track = await searchSong(accessToken, songObj.song, songObj.artist);
            if (track) {
              songDurations.push({
                song: songObj.song,
                artist: songObj.artist,
                duration_ms: track.duration_ms,
              });
            }
          }
          resolve(songDurations);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  // Viser verdiene fra Spotify i terminalen 
  
  (async function () {
    try {
      const songDurations = await fetchSongDurations();
      console.log('Song durations (in ms):');
      for (const songDuration of songDurations) {
        console.log(`${songDuration.song} by ${songDuration.artist}: ${songDuration.duration_ms} ms`);
      }
    } catch (error) {
      console.error('Error fetching song durations:', error);
    }
  })();
  
  