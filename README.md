[![codebuild](https://codebuild.us-west-2.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiYWVIMThIUkN4NmhRTW9nbU01U2N1c212d1BoeUpRWHhTaktlekIwTFlRV2RiZk4yelF0WGJmVTRsNXBrUEJIVlhFWDNRcDVJSGcvR3B6OC9HY01nVmRJPSIsIml2UGFyYW1ldGVyU3BlYyI6InIwRzlKQWdHZFZBK1JHSUciLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://us-west-2.console.aws.amazon.com/codebuild/home?region=us-west-2#/projects/DemoServiceMaster/view)

# Demoservice

Simple demo service built using Node.js and Express.

The service makes API calls to a [simple orders API](https://github.com/liammurray/aws-orders-api.git) running on API GW. The API calls are made using a client auto-generated with openapi-generator using the OpenAPI (Swagger) exported from the API GW.

## Features

- Uses openapi-generator generated axios typescript client

- Uses OAuth2 client credentials to authenticate with the orders api. The credentials are stored in SSM.

- Deployes as a Fargate service with the CDK.

- Typescript

## Quickstart

[Deploy](./stack/README.md)

[Develop](./stack/README.md)

## TODO

- make demoservice-test docker work
  - npm run test doesn't work because it runs ts-node pointing to test source (not dist)
- obtain auth endpoint from api client (swagger security schema thing?)
- alb target group use docker healthcheck instead of healthcheck endpoint
