# -*- mode: shell-script -*-
#

[ "$0" == "${BASH_SOURCE[0]}" ] && echo "This script should be sourced" && exit 1

# Hardcode for now
SERVICE_NAME=demoservice
TAG=latest

# Catch errors. Assumes -e (so doesn't exit).
trap 'catch $? $LINENO' ERR
catch() {
  echo "Error $1 on line $2"
}

_ecr-login-account() {
  echo ${AWS_ECR_LOGIN_ACCOUNT:-$(aws sts get-caller-identity --query 'Account' --output text)}
}

ACCOUNT=$(_ecr-login-account)
AWS_REGION=${AWS_REGION:-us-west-2}
REPO="${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"

ecr-login() {
  local password=$(aws ecr get-login-password)
  docker login \
    --password-stdin \
    --username AWS \
    "$REPO" <<<$password
}
