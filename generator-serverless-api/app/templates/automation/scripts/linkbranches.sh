#!/usr/bin/env bash

RESOLVED_BRANCH=$CIRCLE_BRANCH
WORKSPACE=$(pwd)

case $RESOLVED_BRANCH in
    "master")
        echo "Skipping link branch on master"
        exit 0;
esac

CLIENT_SDK_BRANCH='develop'
MFOUR_NODE_SDK_BRANCH='develop'

###########################################################
# see if there's matching branch names in each dependency #
###########################################################
echo "Checking dependencies for $RESOLVED_BRANCH branch"

if [ ! -z "$(git ls-remote --heads git@github.com:MFourMobile/client-sdk.git $RESOLVED_BRANCH)" ]; then
    echo "Found matching branch for client-sdk: $RESOLVED_BRANCH"
    CLIENT_SDK_BRANCH="$RESOLVED_BRANCH"
fi

if [ ! -z "$(git ls-remote --heads git@github.com:MFourMobile/mfour-node-sdk.git $RESOLVED_BRANCH)" ]; then
    echo "Found matching branch for mfour-node-sdk: $RESOLVED_BRANCH"
    MFOUR_NODE_SDK_BRANCH="$RESOLVED_BRANCH"
fi

#####################################
# add the dependencies through yarn #
#####################################
echo "installing mfour-client-sdk @$CLIENT_SDK_BRANCH"
yarn add git+ssh://git@github.com:MFourMobile/client-sdk.git#$CLIENT_SDK_BRANCH

echo "installing mfour-node-sdk @$MFOUR_NODE_SDK_BRANCH"
yarn add git+ssh://git@github.com:MFourMobile/mfour-node-sdk.git#$MFOUR_NODE_SDK_BRANCH

########################################################
# build and add dependencies as necessary for each repo #
########################################################
echo "building mfour-client-sdk"
cd node_modules/@mfourmobile/mfour-client-sdk
rm package-lock.json
yarn install
npm run build
cd $WORKSPACE

echo "building mfour-node-sdk"
cd node_modules/@mfourmobile/mfour-node-sdk
rm package-lock.json
yarn install
yarn add git+ssh://git@github.com:MFourMobile/client-sdk.git#$CLIENT_SDK_BRANCH
npm run build
cd $WORKSPACE
