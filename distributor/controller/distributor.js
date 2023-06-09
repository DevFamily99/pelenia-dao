require("dotenv").config();
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const axios = require("axios");
var net_url = process.env.TEST_STREAM;
if (process.env.NET_TYEP == 'main') {
  net_url = process.env.MAIN_STREAM;
}
const zilliqa = new Zilliqa(net_url);

const models = require('../models');

const { covertDecimal, winningVote } = require('./../contract');

exports.setDistributor = async (req, res) => {
  var nowDate = new Date();
  var tgtDate = new Date(req.body.deadline);
  var tsSrc = nowDate.getTime();
  var tsTgt = tgtDate.getTime();

  if (tsSrc >= tsTgt) {
    res.send({ status: 'err', message: 'overlap deadline' })
  }
  else {
    var deltaMs = tsTgt - tsSrc;
    var { result } = await zilliqa.blockchain.getTxBlockRate();
    var time_period = result;
    var { result } = await zilliqa.blockchain.getNumTxBlocks();

    var weekBN = time_period * 7 * 24 * 3600;
    var tgtBN = Number(result) + Number(deltaMs / 1000 * time_period);
    tgtBN = Math.round(tgtBN);
    weekBN = Math.round(weekBN);
    var epoch = Math.ceil(deltaMs / 1000 / 7 / 24 / 3600);
    var amount = covertDecimal(req.body.amount / epoch, process.env.DECIMAL, 'toBN');
    var last_called = tgtBN - epoch * weekBN;

    var obj = new models.distributer({
      account: req.body.address,
      amount: amount,
      epoch: epoch,
      period: weekBN,
      ellipsed: epoch,
      timestamp: tsSrc,
      last_called: last_called,
      registerd: 0
    });
    await obj.save();

    winningVote(req.body.address, process.env.DISTRIBUTOR_TEST_BECH32, process.env.BRONZE, req.body.amount);

    res.send({ status: 'ok' })
  }
}

exports.calPeleVoteRate = async (req, res) => {
  try {
    var url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"proposal_id":{"value":"${req.query.pid}","op":"eq"}, "step":{"value":"1","op":"eq"}}`
    var ret = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })

    var balances = await models.pelebalance.find({});
    var bal_obj = {}
    for (var x in balances) {
      bal_obj[balances[x].bech32] = balances[x].balance
    }

    var rows = ret.data.rows;
    var total = 0;
    var sum = 0;
    var sum_pele = 0;
    var total_pele = 0;
    // for (var x in bal_obj) {
    //   total += Math.sqrt(bal_obj[x]?bal_obj[x]:0)
    //   total_pele += bal_obj[x]?bal_obj[x]:0
    // }
    for (var x in rows) {
      var proposer = rows[x].metadata.keyvalues.proposer;
      total += Math.sqrt(bal_obj[proposer] ? bal_obj[proposer] : 0)
      total_pele += bal_obj[proposer] ? bal_obj[proposer] : 0;
      if (rows[x].metadata.keyvalues.vote == 1) {
        sum += Math.sqrt(bal_obj[proposer] ? bal_obj[proposer] : 0)
        sum_pele += bal_obj[proposer] ? bal_obj[proposer] : 0;
      }
    }

    var percent = total != 0 ? (sum / total * 100).toFixed(2) : 0;

    res.send({
      state: 'ok',
      data: percent,
      balances,
      rows,
      sum,
      sum_pele: covertDecimal(sum_pele, 5, 'toZil'),
      total,
      total_pele: covertDecimal(total_pele, 5, 'toZil'),
    })
  } catch (error) {
    console.log(error)
    res.send({
      state: 'err',
      code: error
    })
  }
}

exports.createPeleProposal = async (req, res) => {
  try {
    const { pinHash, proposal, proposer, deadline, amount, receive_address } = req.body;
    const peleproposal = new models.peleproposal({
      pinHash, proposal, proposer, deadline, amount, receive_address
    })
    await peleproposal.save();

    res.send({ status: 'ok' });
  }
  catch (err) {
    res.status(400).send({ status: 'failed', err })
  }
}