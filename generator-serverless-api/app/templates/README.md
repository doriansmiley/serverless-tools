# <%- apiName %> - <%- apiVersion %>
<%- apiDescription %>

<!-- 
TODO: add badges
-->

## Dependencies
#### TODO: Add your dependencies
```

```

## Setup

You will need npm to manage packages
```bash
npm install npm -g
```

```bash
npm install
```

Global npm packages are optional but recommended

```bash
npm install grunt serverless -g
```

**Important!:** Make sure you are on the same nodejs runtime as lambda. Currently its on **_v8.10_**.

### Environment Variables

The following environment variables are required by the functions.

```bash
# Testing
export JWT_SECRET=anything
export ALERT_EMAIL=<email>
export API_GATEWAY_HOST=localhost
export API_GATEWAY_PORT=3000
export STAGE=local
export AWS_XRAY_CONTEXT_MISSING=LOG_ERROR
```

## Building

You will need to build the app when making changes and before testing.
```bash
npm run build
```

## Testing

Make sure you have the environment variables setup from the previous step.

There are two test suites: unit and integration

To run all test suites you can simply run this command:
```bash
npm run test
```

To run only the unit test suite:
```bash
npm run unit-test
```

To run only the integration test suite
```bash
npm run integration-test
```

### Offline Testing

Serverless can emulate a webserver and allow you to hit the gateway function using curl or Postman


```bash
serverless offline start --stage local \
    --host $API_GATEWAY_HOST \
    --port $API_GATEWAY_PORT \
    --alert-email $ALERT_EMAIL \
    --jwt-secret $JWT_SECRET
```

Your service will be accessible on `localhost:3000`.

## API Gateway Permissions

IMPORTANT: Before you deploy read: https://forum.serverless.com/t/knowledge-sharing-enable-cloud-watch-logs-for-api-gateway-using-serverless/3287

You need to manually setup permissions in API Gateway to allow it to push to CloudWatch logs.
Be sure to go through the steps to setup the `apigateway-cloudwatch-logs-role` and attach
to API Gateway settings. ONLY SET UP THE ROLE. The API is already configured with the required plugin.

## API Gateway Stage Variables

IMPORTANT: if you have not setup a custom domain for your API then 
you must set the `API_GATEWAY_STAGE` variable! For example:
```
export API_GATEWAY_STAGE=dev
```

## Deployment

We deploy to AWS using serverless directly. You will need the AWS Credentials setup on your machine. Check with DevOps if you need help with this

```bash
serverless deploy -v \
    --profile <profile> \
    --stage dev \
    --alert-email "<email>" \
    --jwt-secret "<jwtsecret>" \
    --max-suggestion-file-size 50000 \
    --vpc-security-group <vpcsecuritygroup> \
    --vpc-subnet-a <vpcsubneta> \
    --vpc-subnet-b <vpcsubnetb>
```

Serverless will deploy the following:
* API Gateway setup
* Lambda Function triggered by API Gateway
* IAM roles and permissions
* Cloudwatch Alarms

Please note, not all alarms are setup automatically. The following alarms need to be added manually or through CloudFormation:
* 400 errors on API gateway
    * metric: 4xxError
    * rule: >= 5 errors in 5 minutes
    * statistic: Sum
* 500 errors on API gateway
    * metric: 5xxError
    * rule: >= 5 errors in 5 minutes
    * statistic: Sum

For staging, you can set the following variables:

* AWS Profile: `serverless`
* Pilgrim Secret: obtain from team members or DevOps

### Tear Down

To take down a deployed stack, you can use the `remove` command with a stage name.

While at the root of the serverless application, run:

```bash
serverless remove --stage <stage_name>
```

Before removing the stack with serverless, you have to ensure that all S3 buckets in the stack are emptied.

This will include the main bucket serverless uses to upload the labmda function bundle in addition to any custom buckets you add in cloud formation.
