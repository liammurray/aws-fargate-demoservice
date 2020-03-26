# Demoservice

Simple demo service built using Node.js and Express.

The service makes API calls to a [simple orders API](https://github.com/liammurray/aws-orders-api.git) running on API GW. The API calls are made using a client auto-generated with openapi-generator using the OpenAPI (Swagger) exported from the API GW.

## Features

- Uses openapi-generator generated axios typescript client

- Uses OAuth2 client credentials to authenticate with the orders api. The credentials are stored in SSM.

- Deployes as a Fargate service with the CDK.

- Typescript

- Docker multistage build creates two images: dist image for deployment; test image to run tests inside a docker container

## Quickstart

[Deploy](./stack/README.md)

[Develop](./stack/README.md)

## TODO

- make demoservice-test docker work

  - npm run test doesn't work because it runs ts-node pointing to test source (not dist)

- x-ray and http client

- auth endpoint from api client
