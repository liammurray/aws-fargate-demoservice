# Express server test

Simple test express server:

- Uses CLS
- Uses openapi-generator generated axios typescript client
- Uses OAuth2 client credentials

## Setup

1. Configure SSM

   Code looks for client credentials for a user named "FullUser". This is setup in orders api project (i.e. as Cognito application client id named "FullUser").

   Ensure an SSM parameter for "FullUser" exists as a secure string parameter. It should be in the format `<clientid>:<secret>` under `/api/clientcreds/FullUser`.

1. Configure npm

   You should set GITHUB_PERSONAL_PACKAGE_TOKEN to access @liammurray (see .npmrc)

1. For development while actively making changes to client use `npm link` to link the local orders api client (generated in the orders api service project):

   ```bash
   npm link /path/to/ordersService/generated/orders-client-axios
   ```

   This links: @liammurrayc/orders-client-axios

1. Ensure values in .env are correct (particularly OAuth2 endpoint)

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

## Build and run from dist

Using npm

```bash
make dist
./run
```
