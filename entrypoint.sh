#!/bin/sh -l

# Install danger cli on the machine
yarn global add danger

# install needed dependencies
yarn

# Run danger
danger --dangerfile "./dangerfile.js" ci