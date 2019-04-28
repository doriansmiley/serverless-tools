# mfour-serverless-tools
Tools and stub code for starting a new microservice using npm serverless, lamnda, node, and TypeScript

<!-- 
TODO: add badges
# <a href="https://circleci.com/gh/MFourMobile/mfour-auto-complete-service">
# <img src="https://circleci.com/gh/MFourMobile/mfour-auto-complete-service.svg?style=shield&circle-token=6ade52254f840a128823978162dd02efdde393f6" alt="Build Status"></a>
-->
## Setup
Be sure the latest versions of npm and node are installed. Also be sure NVM is installed and you install node version 8.10. This is a requirement of the lambda runtime. Then issue the following command from your working directory:
````
nvm use node 8.10
````

Install the code generator globally

```bash
npm install -g @mfourmobile/generator-serverless-api
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

### Where to Go From Here

Update your application readme. Then proceed to code out your controllers. Be sure to update the corresponding unit tests.

### Using Yarn for Transitive Dependency Management
You can use [yarn link](https://yarnpkg.com/lang/en/docs/cli/link/) to link dependencies.
```bash
cd ~/workspace/client-sdk && yarn link
cd ~/workspace/mfour-node-sdk/ && yarn link && yarn link @mfourmobile/mfour-client-sdk
cd ~/workspace/mfour-survey-service/ && yarn link @mfourmobile/mfour-client-sdk @mfourmobile/mfour-node-sdk
```
To remove linked dependencies use `yarn unlink`:
```
yarn unlink @mfourmobile/mfour-client-sdk
```

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

We deploy to AWS using serverless directly. You will need the AWS Credentials setup on your machine. Check with DevOps if you need help with this

```bash
serverless deploy -v \
    --profile <profile> \
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
