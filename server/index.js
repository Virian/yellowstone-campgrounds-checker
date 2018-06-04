const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.text({ type: "*/*" }));
app.use(express.static('../src'));
app.use('/api', require('./api'));

app.listen(process.env.PORT || 4000, function () {
  console.log('Listening for requests.');
});
