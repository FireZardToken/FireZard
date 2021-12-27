## Modules

<dl>
<dt><a href="#module_backend/Dragon/Card">backend/Dragon/Card</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#toHex">toHex(num)</a> ⇒ <code>string</code></dt>
<dd><p>Internal helper function handling transformation of a JS number into its hexadecimal representation.
Suitable for passing as numeric parameter to a smart contract&#39;s method call</p>
</dd>
<dt><a href="#hash">hash(nonce)</a> ⇒ <code>string</code></dt>
<dd><p>Internal helper function handling generation of hash value from a nonce.
Using keccak256 as hash function.
The return value is suitable for passing as bytes32 parameter to a smart contract&#39;s method call.</p>
</dd>
<dt><a href="#generateNonce">generateNonce()</a> ⇒ <code>string</code></dt>
<dd><p>Internal helper function handling generation of a random byte sequence.
The return value is suitable for passing as bytes32 parameter to a smart contract&#39;s method call.</p>
</dd>
<dt><a href="#sleep">sleep(time)</a></dt>
<dd><p>Internal helper function.
Pauses thread execution for given time period.</p>
</dd>
<dt><a href="#waitBeforeLock">waitBeforeLock(web3, minter)</a></dt>
<dd><p>Internal helper function.
Waits for minimal number of blocks since client&#39;s entropy commitment, when the client&#39;s entropy can be revealed by
calling lockPackage.</p>
</dd>
<dt><a href="#sendLoop">sendLoop(method, tries)</a></dt>
<dd><p>Internal helper function.
Tries to send repeatedly a transaction into the blockchain until suceeds or fail after 
the max retries cap (10 times).
Suitable for situations with poor connection between the client and web3 endpoint.</p>
</dd>
<dt><a href="#lockPackage">lockPackage(minter, account, nonces)</a></dt>
<dd><p>Internal helper function.
Implements locking (writing into the blockchain) mix of client&#39;s and blockchain&#39;s entropies.
This is a (pseudo-)randomly generated number that is derived from the mis of client&#39;s and 
blockchain&#39;s entropies.</p>
</dd>
<dt><a href="#openPackage">openPackage(minter, account, commitments)</a></dt>
<dd><p>Internal helper function.
Implements openning (NFT minting) of a cards&#39; package by their commitments.
A (pseudo-)randomly generated number associated to a client&#39;s commitment is 
used as unique ID for the newly minted Dragon NFT card.
Initial mutable stats are derived from the ID and recored into the TAG storage smart contract</p>
</dd>
<dt><a href="#mint">mint(web3, minter, account, size)</a></dt>
<dd><p>Implements minting of Dragon card NFTs.
Implements protocol for mixing client&#39;s and blockchain&#39;s entropies for generating and recording
on-chain (pseudo-)randomly generated numbers. Uses these numbers as unique IDs for minting new NFT Dragon Cards.
Derives cards&#39; initial mutable stats and records those on-chain.</p>
</dd>
<dt><a href="#getView">getView(viewer, id)</a> ⇒ <code><a href="#View">View</a></code></dt>
<dd><p>Returns a comprehensive view of an NFT dragon card by its ID.</p>
</dd>
<dt><a href="#getDragonMinterInstance">getDragonMinterInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the DraconMinter contract instance.</p>
</dd>
<dt><a href="#getDragonViewerInstance">getDragonViewerInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the DraconCardView contract instance.</p>
</dd>
<dt><a href="#getRNGInstance">getRNGInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the RNG contract instance.</p>
</dd>
<dt><a href="#getNFTInstance">getNFTInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the FireZardNFT contract instance.</p>
</dd>
<dt><a href="#getStatsLibInstance">getStatsLibInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the DragonStats contract instance.</p>
</dd>
<dt><a href="#getStorageInstance">getStorageInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the TagStorage contract instance.</p>
</dd>
<dt><a href="#getViewerInstance">getViewerInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the StatsView contract instance.</p>
</dd>
<dt><a href="#getUtilInstance">getUtilInstance(web3)</a> ⇒ <code>Contract</code></dt>
<dd><p>Derives the Util contract instance.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#View">View</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="module_backend/Dragon/Card"></a>

## backend/Dragon/Card

* [backend/Dragon/Card](#module_backend/Dragon/Card)
    * [module.exports](#exp_module_backend/Dragon/Card--module.exports) ⏏
        * [.mint](#module_backend/Dragon/Card--module.exports.mint)
        * [.getView](#module_backend/Dragon/Card--module.exports.getView)
        * [.getDragonMinterInstance](#module_backend/Dragon/Card--module.exports.getDragonMinterInstance)
        * [.getDragonViewerInstance](#module_backend/Dragon/Card--module.exports.getDragonViewerInstance)
        * [.getRNGInstance](#module_backend/Dragon/Card--module.exports.getRNGInstance)
        * [.getNFTInstance](#module_backend/Dragon/Card--module.exports.getNFTInstance)
        * [.getStatsLibInstance](#module_backend/Dragon/Card--module.exports.getStatsLibInstance)
        * [.getStorageInstance](#module_backend/Dragon/Card--module.exports.getStorageInstance)
        * [.getViewerInstance](#module_backend/Dragon/Card--module.exports.getViewerInstance)
        * [.getUtilInstance](#module_backend/Dragon/Card--module.exports.getUtilInstance)

<a name="exp_module_backend/Dragon/Card--module.exports"></a>

### module.exports ⏏
This module provides access to Dragon Card NFT minting, manipulation and viewing functionality.

 - Minting new Dragon NFT cards with [mint](#mint). Requires Web3 instance, [DragonMinter](DragonMinter) smart contract instance and account 
	that will mint. Note that the Web3 instance must "know" the private key for the account. DragonMinter instance
	can be obtained by calling [getDragonMinterInstance](#getDragonMinterInstance).
 - Getting view for a Dragon NFT card with [getView](#getView) by its ID. Requires [DragonCardView](DragonCardView) smart contract instance.
	The contract instance can be obtained by calling [getDragonViewerInstance](#getDragonViewerInstance).

**Kind**: Exported member  
<a name="module_backend/Dragon/Card--module.exports.mint"></a>

#### module.exports.mint
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [mint](#mint)  
<a name="module_backend/Dragon/Card--module.exports.getView"></a>

#### module.exports.getView
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getView](#getView)  
<a name="module_backend/Dragon/Card--module.exports.getDragonMinterInstance"></a>

#### module.exports.getDragonMinterInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getDragonMinterInstance](#getDragonMinterInstance)  
<a name="module_backend/Dragon/Card--module.exports.getDragonViewerInstance"></a>

#### module.exports.getDragonViewerInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getDragonViewerInstance](#getDragonViewerInstance)  
<a name="module_backend/Dragon/Card--module.exports.getRNGInstance"></a>

#### module.exports.getRNGInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getRNGInstance](#getRNGInstance)  
<a name="module_backend/Dragon/Card--module.exports.getNFTInstance"></a>

#### module.exports.getNFTInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getNFTInstance](#getNFTInstance)  
<a name="module_backend/Dragon/Card--module.exports.getStatsLibInstance"></a>

#### module.exports.getStatsLibInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getStatsLibInstance](#getStatsLibInstance)  
<a name="module_backend/Dragon/Card--module.exports.getStorageInstance"></a>

#### module.exports.getStorageInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getStorageInstance](#getStorageInstance)  
<a name="module_backend/Dragon/Card--module.exports.getViewerInstance"></a>

#### module.exports.getViewerInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getViewerInstance](#getViewerInstance)  
<a name="module_backend/Dragon/Card--module.exports.getUtilInstance"></a>

#### module.exports.getUtilInstance
**Kind**: static property of [<code>module.exports</code>](#exp_module_backend/Dragon/Card--module.exports)  
**See**: [getUtilInstance](#getUtilInstance)  
<a name="toHex"></a>

## toHex(num) ⇒ <code>string</code>
Internal helper function handling transformation of a JS number into its hexadecimal representation.
Suitable for passing as numeric parameter to a smart contract's method call

**Kind**: global function  
**Returns**: <code>string</code> - Hexadecimal representation of num  

| Param | Type | Description |
| --- | --- | --- |
| num | <code>number</code> | A JS number |

<a name="hash"></a>

## hash(nonce) ⇒ <code>string</code>
Internal helper function handling generation of hash value from a nonce.
Using keccak256 as hash function.
The return value is suitable for passing as bytes32 parameter to a smart contract's method call.

**Kind**: global function  
**Returns**: <code>string</code> - Hexadecimal representation of hash(nonce)  

| Param | Type | Description |
| --- | --- | --- |
| nonce | <code>number</code> | (Pseudo-)randomly generated JS number |

<a name="generateNonce"></a>

## generateNonce() ⇒ <code>string</code>
Internal helper function handling generation of a random byte sequence.
The return value is suitable for passing as bytes32 parameter to a smart contract's method call.

**Kind**: global function  
**Returns**: <code>string</code> - Hexadecimal representation of 32 byte sequence.  
<a name="sleep"></a>

## sleep(time)
Internal helper function.
Pauses thread execution for given time period.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| time | <code>number</code> | Pause time in ms. |

<a name="waitBeforeLock"></a>

## waitBeforeLock(web3, minter)
Internal helper function.
Waits for minimal number of blocks since client's entropy commitment, when the client's entropy can be revealed by
calling lockPackage.

**Kind**: global function  
**See**

- Contract DragonMinter
- Contract RNG


| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |
| minter | <code>Contract</code> | DragonMinter contract instance |

<a name="sendLoop"></a>

## sendLoop(method, tries)
Internal helper function.
Tries to send repeatedly a transaction into the blockchain until suceeds or fail after 
the max retries cap (10 times).
Suitable for situations with poor connection between the client and web3 endpoint.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>function</code> | A JS function implementing transaction sending to the blockchain |
| tries | <code>numbere</code> | Number of tries so far |

<a name="lockPackage"></a>

## lockPackage(minter, account, nonces)
Internal helper function.
Implements locking (writing into the blockchain) mix of client's and blockchain's entropies.
This is a (pseudo-)randomly generated number that is derived from the mis of client's and 
blockchain's entropies.

**Kind**: global function  
**See**

- Contract DragonMinter
- Contract RNG


| Param | Type | Description |
| --- | --- | --- |
| minter | <code>Contract</code> | DragonMinter contract instance |
| account | <code>string</code> | On whose behalf the transaction is being sent |
| nonces | <code>Array.&lt;number&gt;</code> | Client's entropy - vector of (pseudo-)randomly generated numbers at client's side |

<a name="openPackage"></a>

## openPackage(minter, account, commitments)
Internal helper function.
Implements openning (NFT minting) of a cards' package by their commitments.
A (pseudo-)randomly generated number associated to a client's commitment is 
used as unique ID for the newly minted Dragon NFT card.
Initial mutable stats are derived from the ID and recored into the TAG storage smart contract

**Kind**: global function  
**See**

- Contract DragonMinter
- Contract RNG
- Contract FireZardNFT
- Contract TagStorage
- Contract Interface IStatsDerive


| Param | Type | Description |
| --- | --- | --- |
| minter | <code>Contract</code> | DragonMinter contract instance |
| account | <code>string</code> | On whose behalf the transaction is being sent |
| commitments | <code>Array.&lt;string&gt;</code> | Commitments of client's entropy - vector of hashes of client's nonces |

<a name="mint"></a>

## mint(web3, minter, account, size)
Implements minting of Dragon card NFTs.
Implements protocol for mixing client's and blockchain's entropies for generating and recording
on-chain (pseudo-)randomly generated numbers. Uses these numbers as unique IDs for minting new NFT Dragon Cards.
Derives cards' initial mutable stats and records those on-chain.

**Kind**: global function  
**See**

- Contract DragonMinter
- Contract RNG
- Contract FireZardNFT
- Contract TagStorage


| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |
| minter | <code>Contract</code> | DragonMinter contract instance |
| account | <code>string</code> | On whose behalf the transaction is being sent |
| size | <code>number</code> | Size of the package to mint |

<a name="getView"></a>

## getView(viewer, id) ⇒ [<code>View</code>](#View)
Returns a comprehensive view of an NFT dragon card by its ID.

**Kind**: global function  
**Returns**: [<code>View</code>](#View) - The view struct of the requested NFT  
**See**

- Contract FireZardNFT
- Contract TagStorage
- Contract DragonCardView
- Enum	 Util.CardRarity
- Enum	 Util.CardType


| Param | Type | Description |
| --- | --- | --- |
| viewer | <code>Contract</code> | DragonCardView contract instance |
| id | <code>number</code> | The NFT Dragon card ID |

<a name="getDragonMinterInstance"></a>

## getDragonMinterInstance(web3) ⇒ <code>Contract</code>
Derives the DraconMinter contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - DragonMinter contract instance  
**See**: Contract DragonMinter  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getDragonViewerInstance"></a>

## getDragonViewerInstance(web3) ⇒ <code>Contract</code>
Derives the DraconCardView contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - DragonCardView contract instance  
**See**: Contract DragonCardView  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getRNGInstance"></a>

## getRNGInstance(web3) ⇒ <code>Contract</code>
Derives the RNG contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - RNG contract instance  
**See**: Contract RNG  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getNFTInstance"></a>

## getNFTInstance(web3) ⇒ <code>Contract</code>
Derives the FireZardNFT contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - FireZardNFT contract instance  
**See**: Contract FireZardNFT  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getStatsLibInstance"></a>

## getStatsLibInstance(web3) ⇒ <code>Contract</code>
Derives the DragonStats contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - DragonStats contract instance  
**See**: Contract DragonStats  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getStorageInstance"></a>

## getStorageInstance(web3) ⇒ <code>Contract</code>
Derives the TagStorage contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - TagStorage contract instance  
**See**: Contract TagStorage  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getViewerInstance"></a>

## getViewerInstance(web3) ⇒ <code>Contract</code>
Derives the StatsView contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - StatsView contract instance  
**See**: Contract StatsView  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="getUtilInstance"></a>

## getUtilInstance(web3) ⇒ <code>Contract</code>
Derives the Util contract instance.

**Kind**: global function  
**Returns**: <code>Contract</code> - Util contract instance  
**See**: Contract Util  

| Param | Type | Description |
| --- | --- | --- |
| web3 | <code>Web3</code> | The web3 object serving the access to the blockchain |

<a name="View"></a>

## View : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| owner: | <code>string</code> | NFT's owner's address |
| stacked: | <code>number</code> | Number of stacked NFTs with the given ID. It must not exceed 1 at all times |
| nft_type: | <code>string</code> | For Dragon cards this is '0x37a3c4a2a635dedf6a4912ec5757511a1f2fa87cb349543d4751fc18c65e4273' |
| version: | <code>string</code> | Version of the view struct. Currently, this is '0x7ab7c2605e2baa16da31b02f4c7ad216783d7bd840f072b0df387745c3695dc2' |
| rarity: | <code>number</code> | The Dragon card's rarity. 0 - Common, 1 - Uncommon, 2 - Rare, 3 - Super rare, 4 - Ultra rare |
| card_type: | <code>number</code> | The Dragon card's type (do not confuse with the NFT type!). 0 - Fire, 1 - Ice, 2 - Grass, 3 - Electric, 4 - Water |
| health: | <code>BN</code> | The card's health level in the interval from 0 to 2**256-1 |
| attack: | <code>BN</code> | The card's attack level in the interval from 0 to 2**256-1 |
| defense: | <code>BN</code> | The card's defense level in the interval from 0 to 2**256-1 |

