#!/usr/bin/env bash
set -eu -o pipefail

# Catch errors. Assumes -e (so doesn't exit).
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 on line $2"
}

runtest=false
push=false

AWS_REGION=us-west-2
SERVICE_NAME=demoservice
TAG=latest

GIT_COMMIT=$(git rev-parse --short HEAD)
# git status -sb
GIT_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
: ${GIT_BRANCH:=<none>}
export BUILDINFO="${GIT_COMMIT} remotes/origin/${GIT_BRANCH} codebuild $(date +"%Y.%m.%d %r %Z")"
echo "BUILDINFO: ${BUILDINFO}"

# TODO: fix WARNING! Using --password via the CLI is insecure. Use --password-stdin
DOCKER_LOGIN_CMD=$(aws ecr get-login --region ${AWS_REGION} --no-include-email)
REPO=$(awk '{ print $7 }' <<<"$DOCKER_LOGIN_CMD")
REPO=${REPO#https://}
echo "Repo: $REPO"

# Login
$DOCKER_LOGIN_CMD

# User docker-compose to run "docker build"
cd ./local

echo "Docker config:"
docker-compose -f docker-compose.yml --no-ansi config

# Build
# NO_CACHE=--no-cache
docker-compose -f docker-compose.yml --no-ansi build

echo "Listing current images for $REPO:"
docker image ls ${REPO}/*

if [ "$runtest" = "true" ]; then
  # Test
  mkdir -p ./test-report && chmod -R 777 ./test-report
  docker-compose -f docker-compose.yml --no-ansi run servertest \
    npm run test:cov -- --reporter=xunit --reporter-options \
    output='$REPORTDIR'/mocha_unit.xml
fi

if [ "$push" = "true" ]; then
  docker push ${REPO}/${SERVICE_NAME}:${TAG}
fi
