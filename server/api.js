const express = require('express');
const request = require('request');
const axios = require('axios');
const moment = require('moment-timezone');
// const Parser = require('html-dom-parser');
// const DomParser = require('dom-parser');
// const parser = new DomParser();
const firebase = require('firebase');
const campgrounds = require('./config/campgrounds.json');
const router = express.Router();
const { URLS } = require('./config');
const {
  check,
  getAll,
} = URLS;

moment.tz.setDefault('America/Denver');
firebase.initializeApp({
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  databaseURL: process.env.FIREBASE_DATABASEURL,
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID
});
const database = firebase.firestore();

router.get(check, function (req, res) {
  const key = req.query.key;
  console.log('[' + new Date() + '] Check invoked.');

  if (key !== process.env.API_KEY) {
    res.status(403).send({error: 'Key doesn\'t match!'});
    console.error('[' + new Date() + '] Key doesn\'t match.');
    return;
  }


  console.log('[' + new Date() + '] Key matches.');

  /*request('https://www.nps.gov/yell/planyourvisit/campgrounds.htm', function (error, response, body) {
    const dom = parser.parseFromString(body);
    console.log(dom.getElementById('cs_control_2680786').innerHTML);
    // console.log(Parser(body)[2].children[6].children[37]);
  });*/
  campgrounds.map(campground => {
    const yesterday = moment().subtract(1, 'day');
    axios.get('https://nps-yell.cartodb.com/api/v2/sql', {
      params: {
        cb: new Date().getTime(),
        q: 'SELECT * FROM campgrounds_and_lodging_status x WHERE x.npmap_id=\'' + campground.npmap_id + '\' AND x.fill_datetime > \'' + yesterday.toISOString() + '\''
      }
    }).then(response => {
      const campgroundsRef = database.collection('campgrounds');
      response.data.rows.map(row => {
        campgroundsRef.add({
          id: row.npmap_id,
          fillTime: moment(row.fill_datetime).unix(),
          name: campground.name,
          isClosed: row.is_closed
        })
      })
    })
  })
  console.log('[' + new Date() + '] Exiting check.');
  res.send({status: 'success'});
});

router.get(getAll, function (req, res) {
  const key = req.query.key;
  console.log('[' + new Date() + '] GetAll invoked.');

  if (key !== process.env.API_KEY) {
    res.status(403).send({error: 'Key doesn\'t match!'});
    console.error('[' + new Date() + '] Key doesn\'t match.');
    return;
  }

  console.log('[' + new Date() + '] Key matches.');

  campgrounds.map((campground, idx) => {
    const batch = database.batch()
    const campgroundsRef = database.collection('campgrounds')
    axios.get('https://nps-yell.cartodb.com/api/v2/sql', {
      params: {
        cb: new Date().getTime(),
        q: 'SELECT * FROM campgrounds_and_lodging_status x WHERE x.npmap_id=\'' + campground.npmap_id + '\''
      }
    }).then(response => {
      response.data.rows.map(row => {
        const newRow = campgroundsRef.doc()
        batch.set(newRow, {
          id: row.npmap_id,
          fillTime: moment(row.fill_datetime).unix(),
          name: campground.name,
          isClosed: row.is_closed
        })
      })
      batch.commit().then(() => console.log('[' + new Date() + '] getAll - commited ' + idx))
    })
  })
  console.log('[' + new Date() + '] Exiting getAll.');
  res.send({status: 'success'});
});

module.exports = router;
