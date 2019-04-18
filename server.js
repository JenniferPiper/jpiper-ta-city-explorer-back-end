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
});

app.get('/meetups', getMeetups);

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

function getMeetups(request, response) {
  const url = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&lon=${request.query.data.longitude}&page=20&lat=${request.query.data.latitude}&key=${process.env.MEETUP_API_KEY}`;

  superagent.get(url)
    .then(result => {
      const meetups = result.body.events.map(meetup => {
        const event = new Meetup(meetup);
        return event;
      });

      response.send(meetups);
    })
    .catch(error => handleError(error, response));
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
function Meetup(meetup) {
  this.link = meetup.link;
  this.name = meetup.group.name;
  this.creation_date = new Date(meetup.group.created).toString().slice(0, 15);
  this.host = meetup.group.who;
  this.created_at = Date.now();
}


// Error handler
function handleError(err, res) {
  console.error('JPiper city explorer error: ', err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
