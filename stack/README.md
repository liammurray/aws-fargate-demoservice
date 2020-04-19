# Demo service

### Dependencies

Account global stack should be created first. (Creates common services log group and sets up codebuild token for account.)

SSM params and SystemManager secrets (see paths in CDK code)

### Deploy build environment

This creates:

- ECR repo for demoservice
- CodeBuild project that builds and pushes to ECR on push to master branch

```bash
cdk deploy demoservice-build
```

At this point you can commit something. The webhook should trigger and eventually build and push an image to ECR.

### Deploy service

Deploy fargate service

```bash
cdk deploy demoservice
```

Test it out.

```bash
curl -ks https://demoservice.nod15c.com/v1/orders
```

### Manual build and push

Push an image to the repo

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

Notifcation rule
Report build status not working
Build conditions to start build based on file path
