#!/bin/bash

export NODE_OPTIONS=--openssl-legacy-provider && truffle compile

export cur_dir=$(pwd)

#export NODE_OPTIONS=--openssl-legacy-provider && truffle test ./test/cross_contract_man.test.js --compile-none && \
#export NODE_OPTIONS=--openssl-legacy-provider && truffle test ./test/dragon_mint.test.js --compile-none && \

for filename in ./test/*.test.js; do
   echo "$filename"
   export NODE_OPTIONS=--openssl-legacy-provider && truffle test "$filename" --compile-none
done
export NODE_OPTIONS=--openssl-legacy-provider && \
 rm /tmp/* -R -f ; \
#    truffle test test/token/ERC721/ERC721.test.js --compile-none && cd /tmp && rm * -R -f && cd $cur_dir \
    truffle test test/token/ERC721/ERC721Enumerable.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC721/utils/ERC721Holder.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC1155/ERC1155.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC1155/presets/ERC1155PresetMinterPauser.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC1155/extensions/ERC1155Supply.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC1155/utils/ERC1155Holder.test.js --compile-none && rm /tmp/* -R -f ; \
    truffle test test/token/ERC721-1155/ERC721_1155Enumerable.test.js --compile-none #&& rm /tmp/* -R -f && \
