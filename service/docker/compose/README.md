# Docker compose

## Running

See [AWS blog on running locally](https://aws.amazon.com/blogs/compute/a-guide-to-locally-testing-containers-with-amazon-ecs-local-endpoints-and-docker-compose/)

Run server with `--service-ports` when invoking via docker-compose (so exposed ports are actually exposed).

```bash
  docker-compose run --service-ports server
```

## Debugginng

Pass `sh` or another command to `run`

```bash
docker-compose run  servertest sh
```

Then you can run commands in shell.

## Building images (server and servertest)

### Local

```bash
  docker-compose build
```

### CI/CD

Work in progress. In addition to building creates BUILD_INFO to embed in build (version, git hash, etc.).

Currently logic to build, test and push in `build.sh` (also exports BUILD_INFO).

This will move out (to github actions).

```bash
./build.sh
```
