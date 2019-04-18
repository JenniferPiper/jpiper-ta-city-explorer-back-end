'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const app = express();
app.use(cors());

app.get('/location', (request, response) => {
  searchLatLng(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
});

app.get('/weather', (request, response) => {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherData = result.body.daily.data.map(dayObj => {
        return new DailyWeather(dayObj);
      });
      response.send(weatherData);

    }).catch(error => handleError(error))
})

app.use('*', (request, response) => {
  response.send('server is working!')
});

function searchLatLng(frontEndQuery) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${frontEndQuery}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(result => {
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

function DailyWeather(rawDayObj) {
  this.forecast = rawDayObj.summary;
  this.time = new Date(rawDayObj.time * 1000).toDateString();
}
// Error handler
function handleError(err, res) {
  console.error('JPiper city explorer error: ', err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
