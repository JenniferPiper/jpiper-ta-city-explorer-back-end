'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/location', (request, response) => {
  response.send(searchLatLng(request.query.data));
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

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
