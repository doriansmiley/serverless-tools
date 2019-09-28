'use strict';
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
