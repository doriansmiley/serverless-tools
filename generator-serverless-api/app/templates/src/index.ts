// must occur first!!! Our client SDK requires global window object and DOM objects
import * as global from '../Globals.js';
global();
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

// IMPORTANT: API Gateway & Lambda can not be used as a web server to serve static content!!!
// If you run this API locally with:
// app.listen(3001, () => debug('Example app listening on port 3001!'));
// you can access the docs at /api-docs, otherwise the dependent files in the returned HMLT will fail to load.
// require OpenAPI spec
// const swaggerDocument = require('./apiSpec.json');
// add swagger docs
// app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// JWT authentication
app.use(/(\/v[0-9])?/, new JWTController().register());

const xssConfig = {
    stripIgnoreTag: true
};

app.use(/(\/v[0-9])?/, new XSSController(xssConfig).register());

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
