#!/usr/bin/env bash
set -eu -o pipefail

source ./common.inc

echo "Logging in to $REPO..."
ecr-login

echo "Pushing..."
set -x
docker push ${REPO}/${SERVICE_NAME}:${TAG}
