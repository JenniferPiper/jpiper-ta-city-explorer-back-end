'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/location', (request, response) => {
  const locationData = searchLatLng(request.query.data);
  response.send(locationData);
});

app.get('/weather', (request, response) => {
  const locationData = searchLatLng(request.query.data);
  const weatherData = searchWeather(locationData.latitude, locationData.longitude);
  response.send(weatherData);
})

app.use('*', (request, response) => {
  response.send('server is working!')
});

function searchLatLng(frontEndQuery) {
  const search_query = frontEndQuery;
  const testData = require('./data/geo.json');
  const formatted_query = testData.results[0].formatted_address;
  const latitude = testData.results[0].geometry.location.lat;
  const longitude = testData.results[0].geometry.location.lng;
  const responseObject = {
    search_query,
    formatted_query,
    latitude,
    longitude
  };
  return responseObject;
}

function searchWeather(latitude, longitude) {
  const testWeatherData = require('./data/darksky.json');
  const summary = testWeatherData.minutely.summary;
  const date = new Date(testWeatherData.minutely.data[0].time);
  // convert time to human-friendly string and remove the year from the end
  const time = date.toDateString().slice(0, -5);
  const weatherObject = {
    forecast: summary,
    latitude: latitude,
    longitude: longitude,
    time: time
  };
  return weatherObject;
}

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
