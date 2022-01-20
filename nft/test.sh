#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && truffle compile && \
#    truffle test test/token/ERC721/ERC721.test.js && \
    truffle test test/token/ERC721/ERC721Enumerable.test.js && \
    truffle test test/token/ERC1155/ERC1155.test.js && \
    truffle test test/token/ERC1155/presets/ERC1155PresetMinterPauser.test.js && \
    truffle test test/token/ERC1155/extensions/ERC1155Supply.test.js && \
    truffle test test/token/ERC1155/utils/ERC1155Holder.test.js && \    
    cd /tmp && rm * -R
