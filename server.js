'use strict';

require('dotenv').config();

const PORT = process.env.PORT || 4000 ;
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.use('*', (request, response) => {
  response.send('server is working!')
});

app.listen(PORT, () => {
  console.log(`app is listening on PORT ${PORT}`);
});
