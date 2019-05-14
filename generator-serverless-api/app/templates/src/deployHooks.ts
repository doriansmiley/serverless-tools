'use strict';

import * as AWS from 'aws-sdk';
import {LambdaPreDeployUtils} from '@mfourmobile/mfour-node-sdk';
import {TestResultEnum} from '@mfourmobile/mfour-node-sdk';
const jwt = require('jsonwebtoken');
const lambda = new AWS.Lambda();
const codeDeploy = new AWS.CodeDeploy();
const serviceName = process.env.SERVICE_NAME || '<EMPTY_SERVICE_NAME>';
const stageName = process.env.STAGE || '<EMPTY_STAGE>';
const functionName = process.env.FUNCTION_NAME || '<EMPTY_FUNCTION_NAME>';
const jwtSecret = process.env.JWT_SECRET || '';

const getJwtToken = (): string => {
    return jwt.sign({ clientId: '0' }, jwtSecret, { algorithm: 'HS256', expiresIn: 120});
};

const getHeaders = (): any => {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getJwtToken(),
        'User-Agent': 'Pre-Deploy lambda',
    };
};

const deployUtils = new LambdaPreDeployUtils(lambda, codeDeploy);

<% routes.forEach(function(route){ %>
const pre<%- route.operationId %> = async (event, context, callback) => {
    // @todo: implement test for this route
    // @see: example gateway event - https://docs.aws.amazon.com/lambda/latest/dg/with-on-demand-https.html
    // const payload = {path: '<%- apiVersion + route.route %>', httpMethod: '<%- route.verb.toUpperCase() %>', headers: getHeaders(), body: '{}'};
    // const result = await deployUtils.invoke(functionName, payload, 500, 'Internal server error');
    const result = TestResultEnum.Succeeded;
    console.log('[INFO] Pre-deploy result: [' + result + ']');
    await deployUtils.updateCodeDeploy(event.DeploymentId, event.LifecycleEventHookExecutionId, result);
    return callback(null, '[INFO] Pre-Deploy completed');
};
<% }); %>

module.exports.pre = async (event, context, callback) => {
    switch (functionName) {
        <%- caseStatement %>
        default:
            callback(new Error('Could not find test for function: ' + functionName));
    }
};
