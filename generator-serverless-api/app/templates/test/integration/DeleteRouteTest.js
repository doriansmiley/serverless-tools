'use strict';
//must occur first!!! Our client SDK requires global window object and DOM objects
// @IMPORTANT: allows us to include the MFour Client SDK for tests
let globalFunction = require('../../Globals.js');
globalFunction();
const http = require('http');
const https = require('https');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const MFour = require('@mfourmobile/mfour-client-sdk/dist');
const MFourNode = require('@mfourmobile/mfour-node-sdk/dist');
const IntegrationUtils = require('./IntegrationUtils.js');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const fs = require("fs");

describe('DELETE /v1<%- route %>/:id', function() {
    const host = process.env.API_GATEWAY_HOST;
    const port = process.env.API_GATEWAY_PORT;
    const protocol = process.env.LOCAL_TESTING === '0' ? 'https:' : 'http:';
    const httpLib = IntegrationUtils.getHttpLib(host);
    const jwtSecret = process.env.JWT_SECRET;

    it('should return success response 200', function(done) {
        const id = '1234';
        const clientId = '5678';
        const token = IntegrationUtils.getToken(clientId, jwtSecret);
        const options = {
            method: 'DELETE',
            host: host,
            port: port,
            protocol: protocol,
            path: `/v1<%- route %>/${id}`,
            headers: {
                'Content-Type' : 'application/json',
                'authorization' : `Bearer ${token}`
            }
        };
        const req = httpLib.request(options, function (res) {
            var data = [];

            res.on('data', function (chunk) {
                data.push(chunk);
            });

            res.on('end', function () {
                var result = Buffer.concat(data);
                console.log('Response code: ' + res.statusCode);
                console.log('Response headers : ' + JSON.stringify(res.headers));
                console.log('Response: ' + result.toString());

                // assert 200 response
                assert.equal(200, res.statusCode);

                // parse result data
                let parsedResult = JSON.parse(result.toString());
                // TODO: add assertions when API is done
                expect(parsedResult).to.deep.equal({tmp: "someValue"});

                done();
            });
            res.on('error', function (err) {
                console.log("error", err);
                done(err);
            });
        });
        req.on('error', function (err) {
            console.log("error", err);
            done(err);
        });
        req.end();
    }).timeout(25000);

    it('should return a 401 unauthorized', function(done) {
        const id = '1234';
        const clientId = '1';
        const token = IntegrationUtils.getToken(clientId, 'fail');
        const options = {
            method: 'DELETE',
            host: host,
            port: port,
            protocol: protocol,
            path: `/v1<%- route %>/${id}`,
            headers: {
                'Content-Type' : 'application/json',
                'authorization' : `Bearer ${token}`
            }
        };
        const req = httpLib.request(options, function (res) {
            console.log(res.statusCode);
            console.log(res.statusMessage);
            assert.equal(401, res.statusCode);
            done();
        });
        req.on('error', function (err) {
            console.log("error", err);
            done(err);
        });
        req.end();
    }).timeout(25000);

    it('should return a 403 No token provided', function(done) {
        const id = '1234';
        const clientId = '1';
        const options = {
            method: 'DELETE',
            host: host,
            port: port,
            protocol: protocol,
            path: `/v1<%- route %>/${id}`,
            headers: {
                'Content-Type' : 'application/json'
            }
        };
        const req = httpLib.request(options, function (res) {
            console.log(res.statusCode);
            console.log(res.statusMessage);
            assert.equal(403, res.statusCode);
            done();
        });
        req.on('error', function (err) {
            console.log("error", err);
            done(err);
        });
        req.end();
    }).timeout(25000);

    it('should return a 403 when authentication type is not provided in the auth header', function(done) {
        const id = '1234';
        const clientId = '1';
        const token = IntegrationUtils.getToken(clientId, jwtSecret);
        const options = {
            method: 'DELETE',
            host: host,
            port: port,
            protocol: protocol,
            path: `/v1<%- route %>/${id}`,
            headers: {
                'Content-Type' : 'application/json',
                'authorization' : `${token}`
            }
        };
        const req = httpLib.request(options, function (res) {
            console.log(res.statusCode);
            console.log(res.statusMessage);
            assert.equal(403, res.statusCode);
            done();
        });
        req.on('error', function (err) {
            console.log("error", err);
            done(err);
        });
        req.end();
    }).timeout(25000);

    it('should return 500 when clientId does not exist in JWT', function(done) {
        const id = '1234';
        const clientId = '1';
        const token = jwt.sign({ foo: 'bar' }, jwtSecret, { algorithm: 'HS256'});
        const options = {
            method: 'DELETE',
            host: host,
            port: port,
            protocol: protocol,
            path: `/v1<%- route %>/${id}`,
            headers: {
                'Content-Type' : 'application/json',
                'authorization' : `Bearer ${token}`
            }
        };
        const req = httpLib.request(options, function (res) {
            var data = [];

            res.on('data', function (chunk) {
                data.push(chunk);
            });

            res.on('end', function () {
                var result = Buffer.concat(data);
                console.log('Response code: ' + res.statusCode);
                console.log('Response headers : ' + JSON.stringify(res.headers));
                console.log('Response: ' + result.toString());

                // assert 500 response
                assert.equal(500, res.statusCode);
                done();
            });
            res.on('error', function (err) {
                console.log("error", err);
                done(err);
            });
        });
        req.on('error', function (err) {
            console.log("error", err);
            done(err);
        });
        req.end();
    }).timeout(25000);
});
