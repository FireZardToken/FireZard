#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && \
    truffle run verify Util --network bsc_main && \
    truffle run verify TagStorage --network bsc_main && \
    truffle run verify RNG --network bsc_main && \
    truffle run verify FireZardNFT --network bsc_main && \
    truffle run verify StatsDistrib --network bsc_main && \
    truffle run verify DragonStats --network bsc_main && \
    truffle run verify DragonMinter --network bsc_main && \
#    truffle run verify FLAME_MOCK --network bsc_test && \
    truffle run verify StatsView --network bsc_main && \
    truffle run verify DragonCardView --network bsc_main && \
    truffle run verify Treasury --network bsc_main && \
echo 'Done!'
