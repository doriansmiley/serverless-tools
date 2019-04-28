#!/usr/bin/env bash

WORKSPACE=$(pwd)

CLIENT_SDK_BRANCH='develop'
NODE_SDK_BRANCH='develop'

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --client-sdk-branch)
    CLIENT_SDK_BRANCH="$2"
    shift # past argument
    shift # past value
    ;;
    --node-sdk-branch)
    NODE_SDK_BRANCH="$2"
    shift # past argument
    shift # past value
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

#echo "Restoring package.json"
git checkout -- package.json

# Re-install packages completely to avoid any odd behaviors
echo "Re-installing packages"
rm -rf node_modules/ yarn.lock package-lock.json
yarn unlink @mfourmobile/mfour-client-sdk @mfourmobile/mfour-node-sdk 2>&1 >/dev/null # don't care about the output for this command
yarn install

###########################################################
# see if there's matching branch names in each dependency #
###########################################################
if [ -z "$(git ls-remote --heads git@github.com:MFourMobile/client-sdk.git $CLIENT_SDK_BRANCH)" ]; then
    echo "Requested client-sdk branch ${CLIENT_SDK_BRANCH} not found, using develop"
    CLIENT_SDK_BRANCH='develop'
fi

if [ -z "$(git ls-remote --heads git@github.com:MFourMobile/mfour-node-sdk.git $NODE_SDK_BRANCH)" ]; then
    echo "Requested client-sdk branch ${NODE_SDK_BRANCH} not found, using develop"
    NODE_SDK_BRANCH='develop'
fi

#####################################
# add the dependencies through yarn #
#####################################
echo "Installing mfour-client-sdk@$CLIENT_SDK_BRANCH"
yarn add git+ssh://git@github.com:MFourMobile/client-sdk.git#$CLIENT_SDK_BRANCH

echo "Installing mfour-node-sdk@$NODE_SDK_BRANCH"
yarn add git+ssh://git@github.com:MFourMobile/mfour-node-sdk.git#$NODE_SDK_BRANCH

#########################################################
# build and add dependencies as necessary for each repo #
#########################################################
echo "Building mfour-client-sdk@${CLIENT_SDK_BRANCH}"
cd node_modules/@mfourmobile/mfour-client-sdk
rm package-lock.json
yarn install
npm run build
cd $WORKSPACE

echo "Building mfour-node-sdk@${NODE_SDK_BRANCH}"
cd node_modules/@mfourmobile/mfour-node-sdk
rm package-lock.json
yarn install
yarn add git+ssh://git@github.com:MFourMobile/client-sdk.git#$CLIENT_SDK_BRANCH
npm run build
cd $WORKSPACE

# Restore package.json
 git checkout -- package.json
