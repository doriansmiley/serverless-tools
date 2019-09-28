// load the rest of the modules
const serverless = require('serverless-http');
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as AWSXRay from 'aws-xray-sdk';
import * as AWS from 'aws-sdk';
import {JWTController} from './controllers/JWTController';
import {XSSController} from './controllers/XSSController';
import * as cors from 'cors';
const debug = require('debug')('<%- apiName %>');
const swaggerDocument = require('../apiSpec.json');
const swaggerUi = require('swagger-ui-express');
<%- importStatements %>

const app = express();
const corsOptions = {
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-amzn-trace-id'],
    exposedHeaders: ['Content-Type', 'Authorization', 'x-amzn-trace-id']
};
// enable pre-flight requests
app.options('*', cors(corsOptions));
// for parsing application/json
app.use(bodyParser.json());

// init XRay middleware, all controllers, DAOs, etc will append sub-segments
app.use(AWSXRay.express.openSegment('<%- apiName %> API'));

// IMPORTANT: all routes that do not require JWT authentication must be declared ahead of registering the middleware with app.use
app.get('/', cors(), function (req, res) {
    res.status(200).send('Hello World! I am the <%- apiName %> API ' +  process.env.API_VERSION);
});

const xssConfig = {
    stripIgnoreTag: true
};
app.use(/(\/v[0-9])?/, new XSSController(xssConfig).register());

//setup route for documents
app.use('/docs/', cors(), swaggerUi.serveWithOptions({ redirect: false }), swaggerUi.setup(swaggerDocument));

// JWT authentication
app.use(/(\/v[0-9])?/, new JWTController().register());

// define API routes

<%- routesDefs %>

// IMPORTANT: Must be last!
app.use(AWSXRay.express.closeSegment());

const wrapper = serverless (app, {callbackWaitsForEmptyEventLoop: false});
const handler = async (event, context, callback) => {
    return new Promise(async (resolve, reject) => {
        try {
            /** Immediate response for WarmUP plugin */
            if (event.source === 'serverless-plugin-warmup') {
                debug('WarmUP - Lambda is warm!');
                return resolve('Lambda is warm!');
            }
            const result = await wrapper(event, context);
            resolve(result);
        } catch (e) {
            reject(e);
        }
    });
};
module.exports.handler = handler;
