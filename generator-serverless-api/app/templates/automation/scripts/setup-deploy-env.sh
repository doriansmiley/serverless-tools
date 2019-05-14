#!/usr/bin/env bash

shopt -s nocasematch
###########################################################
#This if/else block will assign the correct credential
#for AWS account in order to deploy to the correct cluster
###########################################################

# default stage name is development
STAGE_NAME='dev'

if [[ ${CIRCLE_BRANCH} =~ develop ]]
then
        #This is for build from Dev branch
        AWS_ACCESS_KEY_ID="$DEV_AWS_ACCESS_KEY_ID"
        AWS_SECRET_ACCESS_KEY="$DEV_AWS_SECRET_ACCESS_KEY"
        AWS_DEFAULT_REGION="$DEFAULT_REGION_1"

elif [[ ${CIRCLE_BRANCH} =~ hotfix || ${CIRCLE_BRANCH} =~ release ]]
then
        #This is for build from Hotfix branch
        AWS_ACCESS_KEY_ID="$TEST_AWS_ACCESS_KEY_ID"
        AWS_SECRET_ACCESS_KEY="$TEST_AWS_SECRET_ACCESS_KEY"
        AWS_DEFAULT_REGION="$DEFAULT_REGION_1"
        STAGE_NAME='test'

elif [[ ${CIRCLE_BRANCH} =~ master || ! -z ${CIRCLE_TAG} ]]
then
        #This is for build from Release branch
        AWS_ACCESS_KEY_ID="$PROD_AWS_ACCESS_KEY_ID"
        AWS_SECRET_ACCESS_KEY="$PROD_AWS_SECRET_ACCESS_KEY"
        AWS_DEFAULT_REGION="$DEFAULT_REGION_1"
        STAGE_NAME='prod'

else
        #This is for build from feature KP branch or others
        AWS_ACCESS_KEY_ID="$DEV_AWS_ACCESS_KEY_ID"
        AWS_SECRET_ACCESS_KEY="$DEV_AWS_SECRET_ACCESS_KEY"
        AWS_DEFAULT_REGION="$DEFAULT_REGION_1"
fi

#########################################################
# Configure the env var for AWS
########################################################
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID --profile serverless
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY --profile serverless
aws configure set region $AWS_DEFAULT_REGION --profile serverless

# make the scripts directory if it doesn't exist
if [[ ! -d /scripts ]]; then mkdir /scripts; fi
export BASH_ENV=/scripts/bash-env

# disallow empty variables
set -euo pipefail

##########################################################
# Retrieve parameters from AWS for circleci build
##########################################################
# @todo: set up environment variables for this service from aws parameter store, default ones are already added
#JWT_SECRET=`aws ssm get-parameter --with-decryption --name /mfour/placeholder/jwt_secret --profile serverless --query "Parameter.Value" | tr -d '"' `
#AWS_ALERT_EMAIL=`aws ssm get-parameter --with-decryption --name /mfour/placeholder/aws_alert_email --profile serverless --query "Parameter.Value" | tr -d '"' `
#AWS_SECURITY_GROUP=`aws ssm get-parameter --with-decryption --name /mfour/placeholder/aws_security_group --profile serverless --query "Parameter.Value" | tr -d '"' `
#AWS_SUBNET_A=`aws ssm get-parameter --with-decryption --name /mfour/placeholder/aws_subnet_a --profile serverless --query "Parameter.Value" | tr -d '"' `
#AWS_SUBNET_B=`aws ssm get-parameter --with-decryption --name /mfour/placeholder/aws_subnet_b --profile serverless --query "Parameter.Value" | tr -d '"' `

####################################
# Export to env vars
####################################
# @todo: export any env variables you have resolved above, default ones are already exported
#echo "export JWT_SECRET='${JWT_SECRET}'" >> $BASH_ENV
#echo "export AWS_ALERT_EMAIL=${AWS_ALERT_EMAIL}" >> $BASH_ENV
#echo "export AWS_SECURITY_GROUP=${AWS_SECURITY_GROUP}" >> $BASH_ENV
#echo "export AWS_SUBNET_A=${AWS_SUBNET_A}" >> $BASH_ENV
#echo "export AWS_SUBNET_B=${AWS_SUBNET_B}" >> $BASH_ENV
echo "export STAGE_NAME=${STAGE_NAME}" >> $BASH_ENV
echo "export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> $BASH_ENV
echo "export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> $BASH_ENV
