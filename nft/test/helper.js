const { keccak256 } = require("@ethersproject/keccak256");

const hash = (nonce) => {
      return Buffer.from(keccak256(toHex(nonce)).replace('0x',''), 'hex');
}

const toHex = (num) => {
    var hexS = num.toString(16);
    const length = 32;

    while (hexS.length < length) hexS = '0'+hexS;
    return '0x'+hexS;
}

const generateNonce = () => {
    return hash(Math.floor(Math.random()*(10**12)));
}

const getRValue = async(rng, test_rng, commit_period) => {
        const nonce = generateNonce();
        const commitment = keccak256('0x'+nonce.toString('hex'));
        await rng.commit(commitment);

        for(j=0;j<=commit_period-1;j++)
            await test_rng.writeSomeData(generateNonce());
        await rng.lock(nonce);
        return await rng.read(commitment);
}

const checkTossCoinDistrib = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side0 = 0;
    var side1 = 0;
    for(var i=0;i<rounds;i++){
        const rvalue = await getRValue(rng, test_rng, commit_period);
        const coin_side = await test_rng.tossCoin(rvalue);
        if(coin_side == 0)side0++;
            else side1++;
    }
//    console.log("side0: "+side0);
//    console.log("side1: "+side1);

    assert.equal(Math.abs(side1-side0)<=rounds*0.3,true,"Unbalanced coin flip");
    return (side0<side1);
}

const checkTossCoinDistrib1 = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side0 = 0;
    var side1 = 0;
    for(var i=0;i<rounds;i++){
        const rvalue = await getRValue(rng, test_rng, commit_period);
        const coin_side = await test_rng.tossCoin1(rvalue);
        if(coin_side == 0)side0++;
            else side1++;
    }
//    console.log("side0: "+side0);
//    console.log("side1: "+side1);

//    assert.equal(Math.abs(side1-side0)<=rounds*0.3,true,"Unbalanced coin flip");
    assert.equal((side0>=0.4*(rounds/4))&&(side0<=1.4*(rounds/4)),true,"Unbalanced coin sides");
}

const checkTossCoinDistrib2 = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side0 = 0;
    var side1 = 0;
    for(var i=0;i<rounds;i++){
        const rvalue = await getRValue(rng, test_rng, commit_period);
        const coin_side = await test_rng.tossCoin2(rvalue);
        if(coin_side == 0)side0++;
            else side1++;
    }
//    console.log("side0: "+side0);
//    console.log("side1: "+side1);

//    assert.equal(Math.abs(side1-side0)<=rounds*0.3,true,"Unbalanced coin flip");
    assert.equal((side1>=0.4*(rounds/4))&&(side1<=1.4*(rounds/4)),true,"Unbalanced coin sides");
}

const checkDiceDistrib = async(rng, test_rng, util, commit_period, rounds) => {
    await rng.setCommitmentConfirmationCap(commit_period);
    var side = [];
    for(var i=0;i<6;i++)side[i]=0;
    for(var i=0;i<rounds;i++){
        const rvalue = await getRValue(rng, test_rng, commit_period);
        const dice_side = await test_rng.throwDice(rvalue);
        side[dice_side]++;
    }

    var max  = 0;
    var maxi = 0;
    for(var i=0;i<6;i++){
        console.log("side"+i+": "+side[i]);
        assert.equal((side[i]>=0.5*(rounds/6))&&(side[i]<=1.5*(rounds/6)),true,"Unbalanced dice side "+i);
        if(side[i]>max){
            max = side[i];
            maxi = i;
        }
    }
    return maxi;
}

const getSample512 = async(rng, test_rng, commit_period) => {
    const rvalue = await getRValue(rng, test_rng, commit_period);
    return await test_rng.getSample512(rvalue);
}

module.exports = { hash, toHex, generateNonce, getRValue, getSample512 }
