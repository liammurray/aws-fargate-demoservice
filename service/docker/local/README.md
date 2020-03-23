# Local

## Running

See [AWS blog on running locally](https://aws.amazon.com/blogs/compute/a-guide-to-locally-testing-containers-with-amazon-ecs-local-endpoints-and-docker-compose/)

Run server with `--service-ports` when invoking via docker-compose (so exposed ports are actually exposed).

```bash
  docker-compose run --service-ports server
```

## Building

```bash
  docker-compose build
```

## CI/CD Build

Work in progress. Currently logic to build, test and push in `build.sh` (also exports BUILD_INFO).

This will move out (to github actions).

```bash
./build.sh
```
