# Demo service

## Quickstart

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

### Deploy service

```bash
aws ecr describe-repositories
aws logs describe-log-groups --query 'logGroups[].logGroupName' | grep 'services'
```

Push an image to the repo

```bash
cd ./service/docker
push
```

Deploy fargate service

```bash
cdk deploy demoservice
```

Test it out.

```bash
curl -ks https://demoservice.nod15c.com/v1/orders
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
