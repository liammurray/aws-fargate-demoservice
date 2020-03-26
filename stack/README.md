# Demo service

## Quickstart

Deploy log-group and ECR repo

```bash
cdk deploy services-common
```

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
