#!/bin/sh -l

echo "Hello $1"

yarn danger ci --dangerfile $1

