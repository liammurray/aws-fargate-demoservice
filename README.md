# clsdemo

cls experiment by Joe Blow

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
