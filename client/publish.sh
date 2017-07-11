#!/bin/bash

export IXDS_SVC_PREFIX=$1

PKG_PATH=$2
DEPLOY_CONFIG_PATH=$3

echo "Service: $IXDS_SVC_PREFIX"
echo "Package: $PKG_PATH"
echo "Deploy config: $DEPLOY_CONFIG_PATH"

export IXDS_TOKEN=$(python3 login.py "$IXDS_SVC_PREFIX")

if [ -z "$IXDS_TOKEN" ]; then
    echo "Unable to get session token"
    exit 1
fi

echo "Uploading"
UPLOAD_ID=$(python3 upload.py "$PKG_PATH")

if [ -z "$UPLOAD_ID" ]; then
    echo "Unable to get upload id"
    exit 1
fi

echo "Deploying"
python3 deploy.py "$UPLOAD_ID" "$DEPLOY_CONFIG_PATH"
