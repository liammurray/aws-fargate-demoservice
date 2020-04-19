# Demo service

### Dependencies

Account global stack should be created first. (Creates common services log group and sets up codebuild token for account.)

SSM params and SystemManager secrets (see paths in CDK code)

There are some values in main.ts (will be moved to SSM)

### Deploy build environment (demoservice-build)

This creates:

- ECR repo for demoservice
- CodeBuild project that builds and pushes to ECR on push to master branch. Triggered by path changes under 'service'.
- CodePipeline that deploys when ECR image is pushed

```bash
cdk deploy demoservice-build
```

At this point you can commit something to `./service`. The webhook should trigger and eventually build and push an image to ECR.

If the pipeline runs it will deploy (or update) the `demoservice-service` stack.

### Deploy service (demoservice-service)

Creates VPC, ALB, NAT gateway, Fargate ECS cluster and service with task definition.

Warning: the resources are a bit pricey so don't leave running for days unused.

```bash
cdk deploy demoservice
```

Test it out.

```bash
curl -ks https://demoservice-dev.nod15c.com/v1/orders
```

When not in use destroy.

```bash
cdk destroy demoservice
```

### Manual build and push

Push an image to the repo. This will also trigger a build. You can use this to try out local changes right away in dev.

```bash
cd ./service/docker
./build.sh
./push.sh
```

### Hints

```bash
aws ecr describe-repositories
aws logs describe-log-groups --query 'logGroups[].logGroupName' | grep 'services'
```

### TODO

Notification rule
Move values in code to SSM and document
Pipeline
