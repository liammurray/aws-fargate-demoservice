#!/usr/bin/env bash
set -eu -o pipefail

source ./common.inc

runtest=false

GIT_COMMIT=$(git rev-parse --short HEAD)
# git status -sb
GIT_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
: ${GIT_BRANCH:=<none>}
export BUILDINFO="${GIT_COMMIT} remotes/origin/${GIT_BRANCH} codebuild $(date +"%Y.%m.%d %r %Z")"
echo "BUILDINFO: ${BUILDINFO}"

# User docker-compose to run "docker build"
cd ./compose

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
