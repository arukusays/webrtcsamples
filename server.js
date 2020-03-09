'use strict';

const express = require('express');
const http = require('http');

const app = express();
app.use(express.static('./'));
http.createServer(app).listen(8080);
console.log('serving on http://localhost:8080');