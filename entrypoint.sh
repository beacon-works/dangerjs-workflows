#!/bin/sh -l

echo "Hello $1"

# Install danger cli on the machine
yarn global add danger

# install needed dependencies
yarn

# Run danger
danger --dangerfile "dangerfile.ts" ci

