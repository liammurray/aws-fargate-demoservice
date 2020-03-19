#!/usr/bin/env bash
if [ $# != 2 ]; then
  >&2 echo "Usage: ./localRequest.sh <method> <endpoint>"
  exit 1
fi
curl -sk -w "%{http_code}" -X $1 localhost:3000/v1/$2

