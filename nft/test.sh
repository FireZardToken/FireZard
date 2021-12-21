#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && truffle compile && truffle test
