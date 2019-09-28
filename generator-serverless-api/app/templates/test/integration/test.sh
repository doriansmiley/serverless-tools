#!/bin/bash
export LOCAL_TESTING=1

[[ -z $JWT_SECRET ]] && export JWT_SECRET='anything'
[[ -z $ALERT_EMAIL ]] && export ALERT_EMAIL='anything'
[[ -z $API_GATEWAY_HOST ]] && export API_GATEWAY_HOST='localhost'
[[ -z $API_GATEWAY_PORT ]] && export API_GATEWAY_PORT=3000
[[ -z $STAGE ]] && export STAGE=local

# Determine if testing locally
# if [ -z string ] True if the string is null (an empty string)
if [ -z $(echo "${API_GATEWAY_HOST}" | sed -n 's/^\(localhost\)/\1/p') ]; then
    LOCAL_TESTING=0
fi

printf "\nRunning integration tests on $API_GATEWAY_HOST\n"

if [ "$LOCAL_TESTING" = "1" ]; then

    printf "\nDoing local integration testing\n"

    # Make sure service port is available
    printf "\nChecking if port $API_GATEWAY_PORT is available\n"

    service_port_usage="$(lsof -i :$API_GATEWAY_PORT)"

    if ! [ -z "$service_port_usage" ]; then
        printf "Service port usage is:\n"
        printf "${service_port_usage}"
        printf "\n*** Port $API_GATEWAY_PORT is in use, unable to run test. Exiting. ***\n"
        exit 1;
    fi

    printf "\nStarting up service\n"

    # start the API using serverless
    nohup serverless offline start --host $API_GATEWAY_HOST --port $API_GATEWAY_PORT --stage $STAGE --alert-email $ALERT_EMAIL --jwt-secret $JWT_SECRET &
    echo $!

    # store the process ID
    serverless_pid=$!

    # wait for serverless
    # https://unix.stackexchange.com/questions/5277/how-do-i-tell-a-script-to-wait-for-a-process-to-start-accepting-requests-on-a-po
    while ! echo exit | nc $API_GATEWAY_HOST $API_GATEWAY_PORT; do sleep 5; done

    # Add exit handler to kill processes on termination of the script
    # trap "kill $kinesalite_pid && kill $stream_pid && kill $serverless_pid" EXIT
    # we are not currently utilizing kinesis, so for now, we are not capturing the $stream_pid
    # trap "kill $stream_pid && kill $serverless_pid" EXIT
    trap "kill $serverless_pid" EXIT
fi

# run tests
grunt --dbug --stack mochaTest:integrationTest
MOCHA_RESULT=$?

# wait for data to be written to the stream
sleep 5

printf "Finished running integration tests on $API_GATEWAY_HOST\n"

echo "Exiting: $MOCHA_RESULT"
exit $MOCHA_RESULT
