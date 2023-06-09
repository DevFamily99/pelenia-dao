require("dotenv").config();
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const models = require('../models');
const { getAddressFromPrivateKey, fromBech32Address, toBech32Address } = require('@zilliqa-js/crypto')
const axios = require('axios');
const cron = require('node-cron');

const { covertDecimal } = require('./../contract');
const { pelebalance } = require('./../models')

const _getVoteRate = async () => {

};

const updatePelebalance = async () => {
    console.log('update pele balance cron:')
    var net_url = process.env.TEST_STREAM;
    var contractAddr = process.env.PELE_TEST_BASE16;
    if (process.env.NET_TYPE == 'main') {
        net_url = process.env.MAIN_STREAM;
        contractAddr = process.env.PELE_MAIN_BASE16;
    }
    const zilliqa = new Zilliqa(net_url);
    const contract = zilliqa.contracts.at(contractAddr);

    const state = await contract.getState();

    for (var x in state.balances) {
        var bech32 = toBech32Address(x);
        var balance = covertDecimal(state.balances[x], process.env.DECIMAL, 'toNum');
        var tmp = await pelebalance.findOne({ bech32: bech32 });
        if (tmp == null) {
            tmp = new pelebalance({
                bech32: bech32,
                balance: balance
            })
        } else {
            tmp.balance = balance;
        }
        await tmp.save();
    }
}

const updateProposalStatus = async () => {
    console.log('update proposal status cron:')
    try {
        var net_url = process.env.TEST_STREAM;
        var contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TEST;
        if (process.env.NET_TYPE == 'main') {
            net_url = process.env.MAIN_STREAM;
            contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN;
        }
        const zilliqa = new Zilliqa(net_url);
        const contract = zilliqa.contracts.at(contractAddr);

        const contractState = await contract.getState();
        // let totalInsignias = 0;
        // for (let x in contractState.insignia_templates) {
        //     console.log(x, contractState.vote_access)
        //     if (contractState.vote_access[x] && contractState.vote_access[x].constructor == "True") {
        //         totalInsignias += Number(contractState.insignia_templates[x].arguments[3]);
        //     }
        // }
        let totalInsignias = contractState.total_votable;

        const balance_rows = await models.pelebalance.find({});
        let totalBalance;
        let balances = {};
        for (let x in balance_rows) {
            balances[balance_rows[x].bech32] = balance_rows[x].balance;
        }

        const updateProposals = await models.peleproposal.find({ deadline: { $lte: new Date().toISOString() }, state: 'active' });

        const proposalHashs = updateProposals.map(proposal => proposal.pinHash);

        for (let i = 0; i < proposalHashs.length; i++) {
            let url3 = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"proposal_id":{"value":"${proposalHashs[i]}","op":"eq"}, "step":{"value":"1","op":"eq"}}`
            let res3 = await axios.get(url3, {
                headers: {
                    pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                    pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                }
            })

            let proposalVoters = res3.data.rows.map(row => ({ address: row.metadata.keyvalues.proposer, vote: row.metadata.keyvalues.vote }));
            let sumVotersBalance = 0;
            totalBalance = 0;
            for (let j = 0; j < proposalVoters.length; j++) {
                totalBalance += Math.sqrt(balances[proposalVoters[j].address]);
                if (proposalVoters[j].vote == 1) sumVotersBalance += Math.sqrt(balances[proposalVoters[j].address]);
            }

            let voteRate1 = totalBalance === 0 ? 0 : sumVotersBalance / totalBalance * 100

            if (voteRate1 < 200 / 3) proposalStatus = 'failed'
            else {
                let url4 = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"proposal_id":{"value":"' + proposalHashs[i] + '","op":"eq"}, "step":{"value":"1","op":"gt"}, "vote":{"value":"1","op":"eq"}}';
                let res4 = await axios.get(url4, {
                    headers: {
                        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                    }
                });
                let insigniaVoters = res4.data.rows;
                let voteRate2 = totalInsignias === 0 ? 0 : insigniaVoters.length / totalInsignias * 100
                if (voteRate2 > 200 / 3) proposalStatus = 'success2';
                else proposalStatus = 'success1';
            }
            await models.peleproposal.findOneAndUpdate({ pinHash: proposalHashs[i] }, { state: proposalStatus });
            var url5 = `https://api.pinata.cloud/pinning/hashMetadata`;
            var body = {
                ipfsPinHash: proposalHashs[i],
                keyvalues: {
                    state: proposalStatus
                }
            };
            await axios.put(url5, body, {
                headers: {
                    pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                    pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                }
            })
        }
    }
    catch (err) {
        console.log('update proposal status error:', err);
    }
}

const updateProposalStatus0 = async () => {
    console.log('update proposal status cron:')
    try {
        var net_url = process.env.TEST_STREAM;
        var contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TEST;
        if (process.env.NET_TYPE == 'main') {
            net_url = process.env.MAIN_STREAM;
            contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN;
        }
        const zilliqa = new Zilliqa(net_url);
        const contract = zilliqa.contracts.at(contractAddr);

        const contractState = await contract.getState();
        // let totalInsignias = 0;
        // for (let x in contractState.insignia_templates) {
        //     console.log(x, contractState.vote_access)
        //     if (contractState.vote_access[x] && contractState.vote_access[x].constructor == "True") {
        //         totalInsignias += Number(contractState.insignia_templates[x].arguments[3]);
        //     }
        // }
        let totalInsignias = contractState.total_votable;

        const balance_rows = await models.pelebalance.find({});
        let totalBalance;
        let balances = {};
        for (let x in balance_rows) {
            balances[balance_rows[x].bech32] = balance_rows[x].balance;
        }

        const url1 = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=Pele_proposal';
        const res1 = await axios.get(url1, {
            headers: {
                pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
            }
        });

        const proposalPins = res1.data.rows;
        const proposalHashs = proposalPins.map(proposalPin => proposalPin.ipfs_pin_hash);
        for (let i = 0; i < proposalHashs.length; i++) {
            let res2 = await axios.get(process.env.NEXT_PUBLIC_PINATA_GATEWAY + proposalHashs[i]);
            let proposalData = res2.data;
            let proposalStatus;

            if (new Date(proposalData.deadline) < Date.now()) {
                let url3 = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"proposal_id":{"value":"${proposalHashs[i]}","op":"eq"}, "step":{"value":"1","op":"eq"}}`
                let res3 = await axios.get(url3, {
                    headers: {
                        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                    }
                })

                let proposalVoters = res3.data.rows.map(row => ({ address: row.metadata.keyvalues.proposer, vote: row.metadata.keyvalues.vote }));
                let sumVotersBalance = 0;
                totalBalance = 0;
                for (let j = 0; j < proposalVoters.length; j++) {
                    totalBalance += Math.sqrt(balances[proposalVoters[j].address]);
                    if (proposalVoters[j].vote == 1) sumVotersBalance += Math.sqrt(balances[proposalVoters[j].address]);
                }

                let voteRate1 = totalBalance === 0 ? 0 : sumVotersBalance / totalBalance * 100

                if (voteRate1 < 200 / 3) proposalStatus = 'failed'
                else {
                    let url4 = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"proposal_id":{"value":"' + proposalHashs[i] + '","op":"eq"}, "step":{"value":"1","op":"gt"}, "vote":{"value":"1","op":"eq"}}';
                    let res4 = await axios.get(url4, {
                        headers: {
                            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                        }
                    });
                    let insigniaVoters = res4.data.rows;
                    let voteRate2 = totalInsignias === 0 ? 0 : insigniaVoters.length / totalInsignias * 100
                    if (voteRate2 > 200 / 3) proposalStatus = 'success2';
                    else proposalStatus = 'success1';
                }
            }
            else proposalStatus = 'active'
            let url5 = `https://api.pinata.cloud/pinning/hashMetadata`;
            let body = {
                ipfsPinHash: proposalHashs[i],
                keyvalues: {
                    state: proposalStatus
                }
            };
            await axios.put(url5, body, {
                headers: {
                    pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
                    pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
                }
            });
        }
    }
    catch (err) {
        console.log('update proposal status error:', err);
    }
}

const runMaintainPeleBalance = () => {
    cron.schedule("*/10 * * * * *", function () {
        try {
            updatePelebalance();
        } catch (error) {
            console.log(error);
        }
    });
    cron.schedule("*/10 * * * * *", function () {
        try {
            updateProposalStatus();
        } catch (error) {
            console.log(error);
        }
    });
}

module.exports.runMaintainPeleBalance = runMaintainPeleBalance
