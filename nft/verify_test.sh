#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && \
    truffle run verify Util --network bsc_test && \
    truffle run verify TagStorage --network bsc_test && \
    truffle run verify RNG --network bsc_test && \
    truffle run verify FireZardNFT --network bsc_test && \
    truffle run verify StatsDistrib --network bsc_test && \
    truffle run verify DragonStats --network bsc_test && \
    truffle run verify DragonMinter --network bsc_test && \
#    truffle run verify FLAME_MOCK --network bsc_test && \
    truffle run verify StatsView --network bsc_test && \
    truffle run verify DragonCardView --network bsc_test && \
    truffle run verify Treasury --network bsc_test && \
echo 'Done!'
