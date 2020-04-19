# Demoservice

Simple test express server:

- Demonstrates upstream service (deployed as express server running on Fargate) calling downstream service (orders-api)
- Uses CLS to map global context (correlation ids and logger)
- Enables XRay and hooks http (adds correlation ids to outgoing requests)
- Uses openapi-generator generated axios typescript client to call downstream service (orders-api)
- Uses OAuth2 client credentials to authenticate with downstream service
- Uses CDK to deploy
  - CodeBuild triggers on push to build and push image to ECR
  - CodePipeline triggers on ECR push and deploys to ECS dev environment automatically

## Setup

1.  Configure SSM

    Code looks for client credentials for a user named "FullUser". This is setup in orders api
    project (i.e. as Cognito application client id named "FullUser").

    Ensure an SSM parameter for "FullUser" exists as a secure string parameter. It should be in
    the format `<clientid>:<secret>` under `/api/clientcreds/FullUser`.

1.  Configure npm

    You should set NOD15C_NPM_TOKEN to access @liammurray (see .npmrc)

1.  Ensure values in .env are correct (particularly OAuth2 endpoint). For example:

```bash
ORDERS_AUTH_ENDPOINT=https://auth.nod15c.com/oauth2/token
ORDERS_API_ENDPOINT=https://dev-api.nod15c.com/orders
```

1.  There are also some global account dependencies for CDK (codebuild token, log group exists etc.)

1.  Currently there are some makefile dependencies to a project cloned alongside this one.

## Dependencies

```bash
npm i -g pino-pretty
```

## Develop

### Run tests

```bash
make utest
```

### Run server under nodemon

```bash
make develop
```

## Test commands

```bash
curl -sk localhost:3000/v1/orders/1 | jq
curl -sk localhost:3000/v1/healthcheck | jq
```

See `stack` directory for hitting live endpoints. Looks like:

```bash
curl -ks -i https://demoservice-dev.nod15c.com/v1/orders
```

## Build and run from dist

Using npm

```bash
make dist
./run
```
