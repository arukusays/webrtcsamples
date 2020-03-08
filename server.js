'use strict';

const express = require('express');
const https = require('https');
const fs = require('fs');

const opts = {
    key: fs.readFileSync('orekey.pem'),
    cert: fs.readFileSync('orecert.pem')
};
const app = express();
app.use(express.static('./'));
https.createServer(opts, app).listen(8443);
console.log('serving on https://localhost:8443');