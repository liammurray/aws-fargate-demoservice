# Codebuild

## Image

Determine docker image you need to run codebuild (STANDARD, PYTHON, etc).

```bash
aws codebuild list-curated-environment-images | jq '.platforms[]|select(.platform=="UBUNTU")|.languages[]|select(.language=="STANDARD")'
```

For Python3.7 use something like: `aws/codebuild/python:3.7.1`

For Node (and others) use something like: `aws/codebuild/standard:4.0-20.03.13`

## Local Codebuild

You can test/verify the `buildspec.yml` locally.

See [local build support announcement](https://aws.amazon.com/blogs/devops/announcing-local-build-support-for-aws-codebuild/)
See [codebuild local builds gitrepo](https://github.com/aws/aws-codebuild-docker-images/tree/master/local_builds)

1.  Install local codebuild runner

    See [dockerhub](https://hub.docker.com/r/amazon/aws-codebuild-local).

    ```bash
    docker pull amazon/aws-codebuild-local:latest --disable-content-trust=false
    wget https://raw.githubusercontent.com/aws/aws-codebuild-docker-images/master/local_builds/codebuild_build.sh
    chmod +x codebuild_build.sh
    # Optional: move to location in your path
    mv codebuild_build.sh /usr/local/bin
    ```

1.  Build codebuild runtime for image you are using

    Build codebuild runtime image from [aws codebuild curated images github](https://github.com/aws/aws-codebuild-docker-images)

    First clone the repo.

    ```bash
    cd some-local-dir
    git clone https://github.com/aws/aws-codebuild-docker-images.git
    ```

    Next go into image directory you want and build the image. (This takes time!)

    For Python3.7:

    ```bash
    cd aws-codebuild-docker-images/ubuntu/python/3.7.1
    docker build -t aws/codebuild/python:3.7.1 .
    ```

    For Ubuntu (has Node):

    ```bash
    cd aws-codebuild-docker-images/<path>
    docker build -t aws/codebuild/standard:4.0
    ```

1.  Run codebuild

    Python:

    ```bash
    # Output artifact to local temp directory
    codebuild_build.sh -i aws/codebuild/python:3.7.1 -a mytemp -c
    ```

    Node:

    ```bash
    codebuild_build.sh -i aws/codebuild/standard:4.0 -a .codebuild-artifacts -c
    ```

    See `run-local-codebuild` script. To use it create `.env-local-codebuild` with the following

    ```bash
    NPM_TOKEN_PARAM_KEY=/cicd/demoservice/github/npmtoken
    IMAGE_REPO=${account}.dkr.ecr.${region}.amazonaws.com
    ```
