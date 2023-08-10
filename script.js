const axios = require('axios');
const csvParser = require('csv-parser');
const winston = require('winston');
const { writeToStream } = require('fast-csv');
const csvWriter = require('fast-csv').writeToPath;

const fastCsv = require('fast-csv');
const fs = require('fs');
const ws = fs.createWriteStream('output.csv');

// The rest of your code


require('dotenv').config();

console.log('Waiting...');

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


async function readSongsFromFile(fileName) {
  try {
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
          logger.error(`Error reading from file ${fileName}: ${error.message}`);
          reject(error);
        });
    });
  } catch (error) {
    logger.error(`Error in readSongsFromFile: ${error.message}`);
    throw error; // If you want to propagate the error further
  }
}

  // Definerer en sleep funksjon som gjør at man ikke sender for mange requests til Spotify samtidig

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let sleepTime = 100;

  // Får lyd informasjon fra Spotify gjennom å bruke AcessToken

  async function getMultipleTrackDetails(accessToken, trackIds) {
    const trackUrl = `https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`;

    try {
      const trackResponse = await axios.get(trackUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return trackResponse.data.tracks;
    } catch(error) {
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers['Retry-After'];
        console.log(`Rate limit hit, waiting for ${retryAfter} seconds`);
        await sleep(retryAfter * 1000); // Convert to milliseconds
        return await getMultipleTrackDetails(accessToken, trackIds);
      }
      logger.error(`Failed to fetch track details for track IDs: ${trackIds.join(', ')}`);
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
      logger.error(`Failed to fetch artist details for artist ID: ${artistId}`);
    }
  }

  // Putter sammen alle csv-filene til en fil
  
  async function fetchSongDetails() {
    try {
      console.log('Starting fetchSongDetails function...');
  
      const accessToken = await getSpotifyAccessToken();
      const songs1 = await readSongsFromFile('2018 Spotify Streaming TOP 50 Norway.csv');
      const songs2 = await readSongsFromFile('2019 Spotify Streaming TOP 50 Norway.csv');
      const songs3 = await readSongsFromFile('2020 Spotify Streaming TOP 50 Norway.csv');
      const songs4 = await readSongsFromFile('2021 Spotify Streaming TOP 50 Norway.csv');
      const songs5 = await readSongsFromFile('2022 Spotify Streaming TOP 50 Norway.csv');
      const allSongs = [...songs1, ...songs2, ...songs3, ...songs4, ...songs5];
      const songDurations = await fetchSongDetailsForSongs(allSongs, accessToken);
  
      console.log('Ending fetchSongDetails function...');
      return songDurations;
    } catch (error) {
      console.error(`Error inside fetchSongDetails: ${error.message}`);
      throw error; // re-throw the error to be caught in the outer scope
    }
  }

  async function getAudioFeatures(accessToken, trackIds) {
    const url = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`;
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data.audio_features;
    } catch (error) {
      logger.error(`Failed to fetch audio features for track IDs: ${trackIds.join(', ')}`);
    }
  }
  
  
  // Henter all ønsket informasjon


  async function fetchSongDetailsForSongs(songs, accessToken) {
    const songDetails = [];
    const batchSize = 50; // Set the batch size according to Spotify's limits
  
    for (let i = 0; i < songs.length; i += batchSize) {
      await sleep(sleepTime);
      const songBatch = songs.slice(i, i + batchSize);
      try {
        const trackIds = await Promise.all(songBatch.map(songObj => searchSong(accessToken, songObj.song, songObj.artist).then(track => track ? track.id : null)));
        const trackDetailsBatch = await getMultipleTrackDetails(accessToken, trackIds.filter(id => id));
        const audioFeaturesBatch = await getAudioFeatures(accessToken, trackIds.filter(id => id)); // Fetch audio features
  
        for (let j = 0; j < songBatch.length; j++) {
          const songObj = songBatch[j];
          const trackDetails = trackDetailsBatch[j];
          const audioFeatures = audioFeaturesBatch[j]; // Get the corresponding audio features
          let songDetail = {
            song: songObj.song,
            artist: songObj.artist
          };
  
          if (trackDetails && audioFeatures) {
            songDetail.duration_s = trackDetails.duration_ms / 1000;
            songDetail.explicit = trackDetails.explicit;
            songDetail.loudness = audioFeatures.loudness;
            songDetail.tempo = audioFeatures.tempo;
            songDetail.key = audioFeatures.key;
            const artistDetails = await getArtistDetails(accessToken, trackDetails.artists[0].id);
            songDetail.genres = artistDetails.genres;
          }
  
          songDetails.push(songDetail);
        }
      } catch (error) {
        if (error.response && error.response.status === 429) { // Rate limit error
          const retryAfter = error.response.headers['retry-after'];
          console.log(`Rate limit hit, waiting for ${retryAfter} seconds`);
          await new Promise(resolve => setTimeout(resolve, (retryAfter || 1) * 1000));
          i -= batchSize; // Decrement the index to retry this batch
        } else {
          console.error(`An error occurred while fetching details for songs: ${error.message}`);
          // You may choose to continue or break depending on your needs
        }
      }
    }
  
    return songDetails;
  }
  

// Outputter verdiene fra Spotify i en egen csv-fil.

(async function () {
  try {
    const songDetails = await fetchSongDetails();

    const rows = songDetails.map(songDetail => ({
      Song: songDetail.song,
      Artist: songDetail.artist,
      'Duration (s)': songDetail.duration_s,
      Explicit: songDetail.explicit,
      Genres: songDetail.genres ? songDetail.genres.join(', ') : ' ',
      Loudness: songDetail.loudness,
      Tempo: songDetail.tempo,
      Key: songDetail.key
    }));

    await writeToStream(ws, rows, { headers: true });

    console.log('Completed.');
  } catch (error) {
    logger.error(`Error in main function: ${error.message}`);
  }
})();


