# Music-Data-fetcher
Script that is meant to get and aggregate data from Spotify API to make it accessible for analysis


There's a music business student that wants to analyse data from the top 50 songs per quarter over 5 years on spotify, in 3 different countries.
This means we have 50 songs * 4 quarters * 5 years * 3 countries = 3000 songs.
1000 songs have been added to the repo in Norway's .CSV files
The field called URI can be used to send to the spotify API (URI stands for uniform resource identifier)
https://developer.spotify.com/documentation/web-api

The URI is in practice an ID for a song in Spotify's database/api.
The fields that the student wants to study/analyse are:
Length
loudness
tempo 
key (musical key (string))
explicit (bool)
genres (array)

https://developer.spotify.com/documentation/web-api/reference/get-track
from this API-endpoint we can get:
explicit (bool) whether lyrics are explicit or not
duration_ms (int) duration in milliseconds
genres (array of strings) genres of the artist!!!

https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis
from this API-endpoint we can get:
duration (number) length of track in seconds (ex 207.95985)
loudness (number float)
tempo (number float)
key (integer)

other data that might be of interest:
analyzer_version
analysis_sample_rate?
tempo_confidence
time_signature
time_signature_confidence



to get started I'd follow the "getting started" guide on this page:
https://developer.spotify.com/documentation/web-api
If you are stuck you may ask new bing for an example. 
Personally I wanted to make the script/programme in Erlang, just because I want to learn it.
Use whatever language you want :) Asking Bing it gave me an example of how to connect in Python, 
and also it wrote that (when asked naturally) spotify allows approximately 160 requests per minute.
just to be safe I suggest letting maximum 100 requests go every minute, as we don't want to be blocked.
Also 100 coincides nicely with 50 songs, because since we need 2 separate endpoints, we will need 50 songs * 2 endpoints.
