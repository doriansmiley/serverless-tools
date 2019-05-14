'use strict';

//must occur first!!! Our client SDK requires global window object and DOM objects
// @IMPORTANT: allows us to include the MFour Client SDK for tests
let globalFunction = require('../../Globals.js');
globalFunction();
const jwt = require('jsonwebtoken');
let util = require('util');
const http = require('http');
const https = require('https');


class IntegrationUtils
{
    static getToken(clientId, jwtSecret) {
        return jwt.sign({ clientId: clientId }, jwtSecret, { algorithm: 'HS256'});
    }

    static getHttpLib(url) {
        return url === 'localhost' ? http : https;
    }
}

module.exports = IntegrationUtils;
