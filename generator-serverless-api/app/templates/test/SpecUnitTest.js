'use strict';
//must occur first!!! Our client SDK requires global window object and DOM objects
// @IMPORTANT: allows us to include the MFour Client SDK for tests
let globalFunction = require('../Globals.js');
globalFunction();
const http = require('http');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const fs = require("fs");

describe('Testing OpenAPI Spec', function() {
    it('should validate the spec', function() {
        const json = JSON.parse(fs.readFileSync("./apiSpec.json", "utf-8").toString());
        const validator = new OpenAPISchemaValidator({version:3});
        const result = validator.validate(json);
        expect(result.errors.length).to.equal(0);
    });
});
