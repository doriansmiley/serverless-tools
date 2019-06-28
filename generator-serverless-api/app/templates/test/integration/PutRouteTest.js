'use strict';
//must occur first!!! Our client SDK requires global window object and DOM objects
// @IMPORTANT: allows us to include the MFour Client SDK for tests
let globalFunction = require('../../Globals.js');
globalFunction();
const http = require('http');
const assert = require('assert');
const IntegrationUtils = require('./IntegrationUtils.js');
const fs = require("fs");

describe('PUT /v1<%- route %>', function() {
    const host = process.env.API_GATEWAY_HOST;
    const port = process.env.API_GATEWAY_PORT;
    const protocol = process.env.LOCAL_TESTING === '0' ? 'https:' : 'http:';
    const httpLib = IntegrationUtils.getHttpLib(host);
    const jwtSecret = process.env.JWT_SECRET;
    const stage = (process.env.API_GATEWAY_STAGE) ? '/' + process.env.API_GATEWAY_STAGE : '';

    it('should return success response 200', function(done) {
        // TODO: refactor these tests once business logic is implemented in your controllers
        const tmpValues = {
            tmp: 'someValue'
        };

        const jsonArtifact = JSON.stringify(tmpValues);
        const clientId = '1111';
        const postData = {
            clientId: clientId,
            tmpValues: jsonArtifact
        };
        const token = IntegrationUtils.getToken(clientId, jwtSecret);

        const options = {
            method: 'PUT',
            host: host,
            port: port,
            protocol: protocol,
            path: `${stage}/v1<%- route %>`,
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
        req.write(JSON.stringify(postData));
        req.end();
    }).timeout(25000);

    it('should return a 401 unauthorized', function(done) {
        // TODO: refactor these tests once business logic is implemented in your controllers
        const tmpValues = {
            tmp: 'someValue'
        };

        const jsonArtifact = JSON.stringify(tmpValues);
        const clientId = '1111';
        const postData = {
            clientId: clientId,
            driverValues: jsonArtifact
        };
        const token = IntegrationUtils.getToken(clientId, 'fail');
        const options = {
            method: 'PUT',
            host: host,
            port: port,
            protocol: protocol,
            path: `${stage}/v1<%- route %>`,
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
        req.write(JSON.stringify(postData));
        req.end();
    }).timeout(25000);

    it('should return a 403 No token provided', function(done) {
        // TODO: refactor these tests once business logic is implemented in your controllers
        const tmpValues = {
            tmp: 'someValue'
        };

        const jsonArtifact = JSON.stringify(tmpValues);
        const clientId = '1111';
        const postData = {
            clientId: clientId,
            driverValues: jsonArtifact
        };
        const token = IntegrationUtils.getToken(clientId, jwtSecret);
        const options = {
            method: 'PUT',
            host: host,
            port: port,
            protocol: protocol,
            path: `${stage}/v1<%- route %>`,
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
        req.write(JSON.stringify(postData));
        req.end();
    }).timeout(25000);

    it('should return a 403 when authentication type is not provided in the auth header', function(done) {
        // TODO: refactor these tests once business logic is implemented in your controllers
        const tmpValues = {
            tmp: 'someValue'
        };

        const jsonArtifact = JSON.stringify(tmpValues);
        const clientId = '1111';
        const postData = {
            clientId: clientId,
            driverValues: jsonArtifact
        };
        const token = IntegrationUtils.getToken(clientId, jwtSecret);
        const options = {
            method: 'PUT',
            host: host,
            port: port,
            protocol: protocol,
            path: `${stage}/v1<%- route %>`,
            headers: {
                'Content-Type' : 'application/json',
                'authorization' : `${token}`
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

                // assert 403 response
                assert.equal(403, res.statusCode);
                expect(result.toString()).to.equal('Invalid authorization header format.');
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
        req.write(JSON.stringify(postData));
        req.end();
    }).timeout(25000);

    it('should return a 404 when artifact does not exist', function(done) {
        // TODO: refactor these tests once business logic is implemented in your controllers
        const tmpValues = {
            tmp: 'someValue'
        };

        const jsonArtifact = JSON.stringify(tmpValues);
        const clientId = '1111';
        const postData = {
            clientId: clientId,
            tmpValues: jsonArtifact
        };

        const token = IntegrationUtils.getToken(clientId, jwtSecret);
        const options = {
            method: 'PUT',
            host: host,
            port: port,
            protocol: protocol,
            path: `${stage}/v1<%- route %>`,
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
                // TODO: add your tests once your business logic is done. You want to make sure updates on a record that do not exist return 404
                // assert 404 response
                // assert.equal(404, res.statusCode);
                // expect(result.toString()).to.equal('File not found');
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
        req.write(JSON.stringify(postData));
        req.end();
    }).timeout(25000);
});
