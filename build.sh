#!/usr/bin/env bash

# Assuming the following variable
# IMAGE_TAG=$(git branch | grep \* | cut -d ' ' -f2-)`

IMAGE_HASH=$(git log -1 --pretty="format:%H")
REMOTE_BASE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME

echo "Building started $(date)"
echo "Building tag $IMAGE_TAG from $IMAGE_HASH"

docker pull $REMOTE_BASE:$IMAGE_TAG || true
docker build \
	--cache-from $REMOTE_BASE:$IMAGE_TAG \
        -t $IMAGE_REPO_NAME:$IMAGE_TAG .

docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REMOTE_BASE:$IMAGE_TAG
docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REMOTE_BASE:$IMAGE_HASH      

docker push $REMOTE_BASE:$IMAGE_TAG
docker push $REMOTE_BASE:$IMAGE_HASH
