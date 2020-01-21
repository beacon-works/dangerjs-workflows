#!/bin/sh -l

set -e

if [ -e node_modules/.bin/danger ]; then
  setup="" 
else
  echo "## Your environment is not ready yet. Installing modules..."
  if [ -f yarn.lock ]; then
    setup="yarn --ignore-scripts --production=false"
  else
    if [ -f package-lock.json ]; then
      setup="NODE_ENV=development npm ci --ignore-scripts"
    else
      setup="NODE_ENV=development npm install --no-package-lock --ignore-scripts"
    fi
  fi
fi

sh -c "$setup"

if [ -z "$1" ]; then
    dangerfile="$1"
else 
    dangerfile="$@"
fi

cat << EOF
Install complete.

## Attempting to run DangerJS using dangerfile: $dangerfile"
EOF

sh -c "./node_modules/.bin/danger ci --dangerfile $dangerfile"