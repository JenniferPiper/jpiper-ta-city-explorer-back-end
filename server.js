'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => console.error(error));

const app = express();
app.use(cors());

app.get('/location', searchLatLng);

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

app.get('/trails', getTrails);

app.use('*', (request, response) => {
  response.send('server is working!')
});

function getTrails(request, response) {
  // console.log('getTrails request: ', request.query.data);
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}1&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAILS_API_KEY}`;

  superagent.get(url)
    .then(result => {  
      const trailsArray = result.body.trails.map(trail => {
        return new Trail(trail);
      });
      response.send(trailsArray);
    });
}

function Trail(trail) {
  this.name = trail.name;
  this.trail_url = trail.url;
  this.location = trail.location;
  this.length = trail.length;
  if(trail.conditionDate === '1970-01-01 00:00:00') {
    this.condition_date = '(Not reported)';
    this.condition_time = '(Not reported)';
  } else {
    this.condition_date = trail.conditionDate.toString().slice(0, -9);
    this.condition_time = trail.conditionDate.toString().slice(-9, -3);
  }
  this.conditions = `${trail.conditionStatus}, ${trail.conditionDetails}`;
  this.summary = trail.summary;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
}
function DailyWeather(rawDayObj) {
  this.forecast = rawDayObj.summary;
  this.time = new Date(rawDayObj.time * 1000).toDateString();
}


// function getWeather(request, response) {
//   const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
//   superagent.get(url)
// }

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


function searchLatLng(request, response){
  // Take the data from the front end
  const searchQuery = request.query.data;
  // console.log('searchLatLng request.query.data: ', request.query.data)
  //check if it has been looked for before
  console.log('checking the DATABASE');
  client.query('SELECT * FROM locations WHERE search_query=$1', [searchQuery])
    .then(result => {
      // console.log('result from DATABASE: ', result);
      if (result.rows.length) { // (stuff in the db)
        console.log('Exists in the DATABASE ', result.rows);
        response.send(result.rows[0])
      } else {
        getStuffFromGoogle(searchQuery, response)
      }
    });
}

function getStuffFromGoogle(searchQuery, response){
  // Compose the url using our secret api key and the search term
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;
  // go get the data from google
  superagent.get(url).then(result => {
    // take the front end query and the results from google and normalize the data
    const location = new Location(searchQuery, result.body.results[0]);
    console.log('From Google API: \n', location);
    // send the location to the front end
    response.send(location);

    console.log('Not in the database, inserting into DATABASE', location);
    client.query(`INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`, [location.search_query, location.formatted_query, location.latitude, location.longitude]);
  })
}


function Location(query, data){ // (front end query, data from google)
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}


function Meetup(meetup) {
  this.link = meetup.link;
  this.name = meetup.group.name;
  this.creation_date = new Date(meetup.group.created).toString().slice(0, 15);
  this.host = meetup.group.who;
  this.created_at = Date.now();
}

// function lookup(options) {
//   const SQL = `SELECT * FROM ${options.tableName} WHERE location_id=$1;`
//   const values = [options.location];

//   client.query(SQL, values)
//     .then(result => {
//       if(result.rowCount > 0) {
//         options.cacheHit(result);
//       } else {
//         options.cacheMiss();
//       }
//     })
//     .catch(error => handleError(error));
// }

// Error handler
function handleError(err, res) {
  console.error('JPiper city explorer error: ', err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
