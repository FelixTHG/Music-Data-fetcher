# Music-Data-fetcher
Script that is meant to get and aggregate data from Spotify API to make it accessible for analysis


There's a music business student that wants to analyse data from the top 50 songs per quarter over 5 years on spotify, in 3 different countries.<br>
This means we have 50 songs * 4 quarters * 5 years * 3 countries = 3000 songs.<br>
1000 songs have been added to the repo in Norway's .CSV files<br>
The field called URI can be used to send to the spotify API (URI stands for uniform resource identifier)<br>
https://developer.spotify.com/documentation/web-api<br><br>

The URI is in practice an ID for a song in Spotify's database/api.<br>
The fields that the student wants to study/analyse are:<br>
Length<br>
loudness<br>
tempo <br>
key (musical key (string))<br>
explicit (bool)<br>
genres (array)<br>
<br>
https://developer.spotify.com/documentation/web-api/reference/get-track<br>
from this API-endpoint we can get:<br>
explicit (bool) whether lyrics are explicit or not<br>
duration_ms (int) duration in milliseconds<br>
genres (array of strings) genres of the artist!!!<br><br>

https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis<br>
from this API-endpoint we can get:<br>
duration (number) length of track in seconds (ex 207.95985)<br>
loudness (number float)<br>
tempo (number float)<br>
key (integer)<br>

other data that might be of interest:
analyzer_version<br>
analysis_sample_rate?<br>
tempo_confidence<br>
time_signature<br>
time_signature_confidence<br>



to get started I'd follow the "getting started" guide on this page:
https://developer.spotify.com/documentation/web-api
If you are stuck you may ask new bing for an example. 
Personally I wanted to make the script/programme in Erlang, just because I want to learn it.
Use whatever language you want :) Asking Bing it gave me an example of how to connect in Python, 
and also it wrote that (when asked naturally) spotify allows approximately 160 requests per minute.
just to be safe I suggest letting maximum 100 requests go every minute, as we don't want to be blocked.
Also 100 coincides nicely with 50 songs, because since we need 2 separate endpoints, we will need 50 songs * 2 endpoints.
