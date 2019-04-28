#! /bin/bash
T_FILE=$1
ENVIRONMENT=$2
echo "[serverless]" > $T_FILE
if [ "$ENVIRONMENT" = "production" ]
then
    echo "aws_access_key_id = $AWS_PRODUCTION_ACCESS_KEY_ID" >> $T_FILE
    echo "aws_secret_access_key = $AWS_PRODUCTION_SECRET_ACCESS_KEY" >> $T_FILE
elif [ "$ENVIRONMENT" = "staging" ]
then
    echo "aws_access_key_id = $AWS_STAGING_ACCESS_KEY_ID" >> $T_FILE
    echo "aws_secret_access_key = $AWS_STAGING_SECRET_ACCESS_KEY" >> $T_FILE
else
    echo "aws_access_key_id = $AWS_ACCESS_KEY_ID" >> $T_FILE
    echo "aws_secret_access_key = $AWS_SECRET_ACCESS_KEY" >> $T_FILE
fi
