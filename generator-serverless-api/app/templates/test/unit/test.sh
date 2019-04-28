#!/bin/bash

# run tests
grunt --dbug --stack tslint mochaTest:unitTest
MOCHA_RESULT=$?

# wait for data to be written to the stream
sleep 5

echo "Exiting: $MOCHA_RESULT"
exit $MOCHA_RESULT
