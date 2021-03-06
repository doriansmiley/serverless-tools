# serverless-tools
Tools and stub code for starting a new microservice using npm serverless, lamnda, node, and TypeScript

<!-- 
TODO: add badges
-->
## Setup
Be sure the latest versions of npm and node are installed. Also be sure NVM is installed and you install node version 8.10. This is a requirement of the lambda runtime. Then issue the following command from your working directory:
````
nvm use node 8.10
````

Install the code generator globally

```bash
npm install -g generator-serverless-api
```

**Important!:** Make sure you are on the same nodejs runtime as lambda. Currently its on **_v8.10_**.

## Usage

From your working directory where components will be installed run 
```bash
yo serverless-api
```
Follow the prompts. Please note Open API Spec 3.0 is required when supplying an API spec to the generator. All npm modules will be installed when running the generator.

## Testing
To test the stub API installed by the generator run:
````
npm test

````
TODO: add sample for running integration tests

## Docs
Once the API is started the docs can be served at /docs/index

## Health Check
The default route (/) contains a health check message.
You can create a controller top perform deep health checks if you want.

### Where to Go From Here

Update your application readme. Then proceed to code out your controllers. Be sure to update the corresponding unit tests.

### Offline Testing

Serverless can emulate a webserver and allow you to hit the gateway function using curl or Postman


```bash
serverless offline start --stage local \
    --host $TEST_API_GATEWAY_HOST \
    --port $TEST_API_GATEWAY_PORT \
    --alert-email $ALERT_EMAIL \
    --jwt-secret $JWT_SECRET
```

Your service will be accessible on `localhost:3000`.

## Deployment

You can deploy the API using the following command.
The `aws-profile` param informs the Serverless Framework what aws keypair to use.
Note this profile must be configured in your `.aws` directory as part of your AWS CLI setup.


```bash
serverless deploy -v \
    --aws-profile <profile> \
    --stage development \
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


### Tear Down

To take down a deployed stack, you can use the `remove` command with a stage name.

While at the root of the serverless application, run:

```bash
serverless remove --stage <stage_name>
```

Before removing the stack with serverless, you have to ensure that all S3 buckets in the stack are emptied.

This will include the main bucket serverless uses to upload the labmda function bundle in addition to any custom buckets you add in cloud formation.
