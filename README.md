# 🎵 Music Data Fetcher

A script to collect, process, and export track-level metadata from the **Spotify Web API**, tailored for non-technical users in music research and analysis.

Originally built to support a **music business student’s bachelor's thesis**, this tool automates the collection of track attributes (e.g., tempo, loudness, key, genres) for thousands of songs across multiple countries and time periods. The resulting dataset is clean, aggregated, and ready for further analysis (e.g., in Excel, R, or Python).

---

## 📊 Use Case

> 5 years × 4 quarters × 3 countries × 50 top songs = **~3000 tracks**

This project was created to extract key attributes from **Spotify’s API** for each track listed in `.csv` files (e.g., Norway's Top 50 each quarter). These features were required for music industry analysis but not easily accessible without programming.

---

## ✅ Features

- 🔐 OAuth 2.0-based access to Spotify API (Client Credentials flow)
- 🎧 Track-level data: `duration`, `explicit`, `tempo`, `loudness`, `key`
- 🧑‍🎤 Artist-level data: `genres` (via separate endpoint)
- 📄 Merges and processes thousands of songs across multiple CSV files
- ⚠️ Respects Spotify's rate limits with retry logic and batching
- 🐛 Logs all failed lookups and issues to `error.log`
- 📤 Exports clean data to `output.csv`

---

## 🛠️ Tech Stack

- **JavaScript (Node.js)**
- `axios` for HTTP requests
- `dotenv` for credentials
- `fast-csv` and `csv-parser` for CSV I/O
- `winston` for logging
- **Spotify Web API**

---

## 🔐 Requirements

You **must** set up a `.env` file with your Spotify Developer credentials to make it work.

🛠️ How to Use (Quick Start)
1. Clone repo and install: git clone ... && cd ... && npm install
2. Create .env with CLIENT_ID and CLIENT_SECRET
3. Add input .csv files to the project root
4. Run the script: node index.js
5. Get results in output.csv (errors in error.log)


⚙️ How It Works (Under the Hood)
1. CSV Parsing: Reads rows with track_name and artist_names
2. Search API: Uses Spotify’s /search endpoint to find exact track IDs
3. Batch Queries:
    - /tracks endpoint: for duration, explicit flag
    - /audio-features: for tempo, loudness, key
    - /artists: for genre metadata
4. Rate Limiting: Handles 429 errors with dynamic sleep/retry logic
5. Logging: Errors like "track not found" or failed fetches are written to error.log
6. Output: Final enriched dataset is written to output.csv

MIT License