'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const app = express();
app.use(cors());

app.get('/location', (request, response) => {
  console.log('request.query:', request.query);
  searchLatLng(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
});

app.get('/weather', (request, response) => {
  const locationData = searchLatLng(request.query.data);
  const weatherData = getWeather(locationData.latitude, locationData.longitude);
  response.send(weatherData);
})

app.use('*', (request, response) => {
  response.send('server is working!')
});

function searchLatLng(frontEndQuery) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${frontEndQuery}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(result => {
      console.log('result.BODY: ', result.body);
      return new Location(frontEndQuery, result);
    })
    .catch(error => console.log('JPiper city explorer error: ', error));
}

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function getWeather(latitude, longitude) {
  const testWeatherData = require('./data/darksky.json');
  const dailyWeatherData = testWeatherData.daily.data;

  const weatherObjects = dailyWeatherData.map(dayObj => {
    return new DailyWeather(dayObj);
  });

  return weatherObjects;
}

function DailyWeather(rawDayObj) {
  const time = new Date(rawDayObj.time * 1000).toDateString();
  this.forecast = rawDayObj.summary,
  this.time = time
}
// Error handler
function handleError(err, res) {
  console.error('JPiper city explorer error: ', err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
