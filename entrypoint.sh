#!/bin/sh -l

echo "Hello $1"

# Run danger
danger ci --dangerfile $1

