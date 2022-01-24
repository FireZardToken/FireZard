#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && truffle compile && truffle migrate -f 010 --to 080 --network bsc_test
export NODE_OPTIONS=--openssl-legacy-provider && truffle compile && truffle migrate -f 090 --to 110 --network bsc_test
