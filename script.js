const axios = require('axios');
const csvParser = require('csv-parser');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

// En error logger

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
  ],
});

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

  async function getTrackDetails(accessToken, trackId) {
    const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
    const audioFeaturesUrl = `https://api.spotify.com/v1/audio-features/${trackId}`;
  
    try {
      const trackResponse = await axios.get(trackUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
  
      const audioFeaturesResponse = await axios.get(audioFeaturesUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
  
      return {
        track: trackResponse.data,
        audioFeatures: audioFeaturesResponse.data
      };
    } catch (error) {
      console.error(`Failed to fetch track details and audio features for track ID: ${trackId}`);
    }
  }
  
  
  // Søker på sang og artist i Spotify og gir tilbake første resultat om det finnes noe på søket

  async function searchSong(accessToken, song, artist) {
    const query = `track:${song} artist:${artist}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
  
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
  
      if (response.data.tracks.items.length > 0) {
        const track = response.data.tracks.items[0];
        return track;
      } else {
        // No search results for the query
        logger.error(`No search results for query: ${query}`);
      }
    } catch (error) {
      // Failed to fetch track data for the query
      logger.error(`Failed to fetch track data for query: ${query}`);
    }
  }

  // Henter info om artist 

  async function getArtistDetails(accessToken, artistId) {
    const url = `https://api.spotify.com/v1/artists/${artistId}`;
  
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
  
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch artist details for artist ID: ${artistId}`);
    }
  }

  // Leser CSV-filen. 
  
  async function readSongsFromFile(fileName) {
    const songs = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(fileName)
        .pipe(csvParser({ separator: ';' }))
        .on('data', (row) => {
          const song = row.track_name;
          const artist = row.artist_names;
          songs.push({ song, artist });
        })
        .on('end', () => {
          resolve(songs);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  // Putter sammen alle csv-filene til en fil
  
  async function fetchSongDetails() {
    const accessToken = await getSpotifyAccessToken();
    const songs1 = await readSongsFromFile('2018 Spotify Streaming TOP 50 Norway.csv');
    const songs2 = await readSongsFromFile('2019 Spotify Streaming TOP 50 Norway.csv');
    const songs3 = await readSongsFromFile('2020 Spotify Streaming TOP 50 Norway.csv');
    const songs4 = await readSongsFromFile('2021 Spotify Streaming TOP 50 Norway.csv');
    const songs5 = await readSongsFromFile('2022 Spotify Streaming TOP 50 Norway.csv');
    const allSongs = [...songs1, ...songs2, ...songs3, ...songs4, ...songs5];
    const songDurations = await fetchSongDetailsForSongs(allSongs, accessToken);
    return songDurations;
  }
  
  // Henter all ønsket informasjon

  async function fetchSongDetailsForSongs(songs, accessToken) {
    const songDetails = [];
    for (const songObj of songs) {
      await sleep(100);
      let songDetail = {
        song: songObj.song,
        artist: songObj.artist
      };
      const track = await searchSong(accessToken, songObj.song, songObj.artist);
      if (track) {
        const trackDetails = await getTrackDetails(accessToken, track.id);
        const artistDetails = await getArtistDetails(accessToken, track.artists[0].id);
        if(trackDetails)
        {
          songDetail.duration_s = trackDetails.track.duration_ms/1000;
          songDetail.explicit = trackDetails.track.explicit;
          songDetail.loudness = trackDetails.audioFeatures.loudness;
          songDetail.tempo = trackDetails.audioFeatures.tempo;
          songDetail.key = trackDetails.audioFeatures.key
        }
        if(artistDetails)
          songDetail.genres = artistDetails.genres;
      }

      songDetails.push(songDetail);
    }
    return songDetails;
  }
  

  // Viser verdiene fra Spotify i terminalen 
  
  (async function () {
    try {
      const songDetails = await fetchSongDetails();
      console.log('Song details:');
      for (const songDetail of songDetails) {
        console.log(`${songDetail.song} by ${songDetail.artist}:`);
        console.log(`  Duration: ${songDetail.duration_s} s`);
        console.log(`  Explicit: ${songDetail.explicit}`);
        console.log(`  Genres: ${songDetail.genres ? songDetail.genres.join(', ') : ' ' }`);
        console.log(`  Loudness: ${songDetail.loudness}`);
        console.log(`  Tempo: ${songDetail.tempo}`);
        console.log(`  Key: ${songDetail.key}`);
      }
    } catch (error) {
      console.error('Error fetching song details:', error);
    }
  })();
  
  
  