#!/bin/bash

# Waits for CURL to server version endpoint succeed
#
# Server URL can be set in TEST_SERVER env var, or passed as argument (-s)
#
# Ansible you can run with script module this way:
#
# ansible "tag_Name_pg1:&us-west-1" -m script -a "scripts/wait_for_server.sh"
#

intervalSecs=5
serverUrl=${TEST_SERVER:="http://localhost:3005"}
max=18
pretty=
while getopts ":s:p:" opt; do
  case $opt in
  s) serverUrl=$OPTARG ;;
  p) pretty=$OPTARG ;; # py or jq
  \?) error "unrecognized option -$OPTARG" ;;
  esac
done
shift $((OPTIND - 1))

curlCommand="curl -s --connect-timeout 3 ${serverUrl}/version"

prettyJson() {
  case $pretty in
  py) echo "$1" | python -m json.tool ;;
  jq) echo "$1" | jq ;;
  esac
}

idx=0
while [ "$idx" -lt "$max" ]; do
  echo "[wait-for-server] Checking ($curlCommand)..."
  output=$($curlCommand)
  if [ "$?" -eq 0 ]; then
    echo "[wait-for-server] Server appears to be running"
    prettyJson "$output"
    exit 0
  fi
  echo "[wait-for-server] Sleeping $intervalSecs seconds..."
  sleep $intervalSecs
  idx=$((idx + 1))
done

echo "[wait-for-server] Max limit ($max) reached (giving up)"
exit 1
