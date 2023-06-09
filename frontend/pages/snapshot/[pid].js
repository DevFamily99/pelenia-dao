import React from 'react';
import { useRouter } from 'next/router';
const axios = require('axios');

import { Navbar } from '../../modules/Navbar';
import { Snipping } from '../../modules/Snipping';

import { useSelector, useDispatch } from 'react-redux';
import { setContractState, setMyInsignias } from "./../../modules/ZilpaySlice";
import { bech32, base16, contract, contractState, version, myinsignias } from './../../modules/ZilpaySlice';

const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { MessageType } = require('@zilliqa-js/subscriptions');
const { toBech32Address, fromBech32Address } = require('@zilliqa-js/crypto')
import hash from 'hash.js';

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OutputIcon from '@mui/icons-material/Output';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2">{`${props.value.toFixed(2)}%`}</Typography>
      </Box>
    </Box>
  );
}

function NewlineText(props) {
  const text = props.text;
  var i = 0;
  return text.split('\n').map(str => <p key={i++}>{str}</p>);
}


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const { BN, Long, bytes, units } = require('@zilliqa-js/util');

export default function Snapshot() {
  const router = useRouter();
  const { pid } = router.query;
  const dispatch = useDispatch();

  const rdxcontract = useSelector(contract);
  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxversion = useSelector(version);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [proposal, setProposal] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [amount, setAmount] = React.useState(0);
  const [proposalState, setProposalState] = React.useState('');
  const [voteStep, setVoteStep] = React.useState(0);
  const [peleVoter, setPeleVoter] = React.useState([]);
  const [peleHolder, setPeleHolder] = React.useState({});
  const [peleRate, setPeleRate] = React.useState(0);
  const [sum, setSum] = React.useState(0);
  const [sumPele, setSumPele] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [totalPele, setTotalPele] = React.useState(0);
  const [insigniaVoter, setInsigniaVoter] = React.useState(0);
  const [insigniaHolder, setInsigniaHolder] = React.useState(0);
  const [insigniaRate, setInsigniaRate] = React.useState(0);
  const [votablePele, setVotablePele] = React.useState(false);
  const [votableInsignia, setVotableInsignia] = React.useState(false);
  const [cancelProposal, setCancelProposal] = React.useState(false);
  const [myPeleVoteSate, setMyPeleVoteSate] = React.useState(-1);
  const [myInsigniaVoteSate, setMyInsigniaVoteSate] = React.useState(-1);

  const [openDelete, setOpenDelete] = React.useState(false);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgType, setMsgType] = React.useState('error');
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const getPeleState = async () => {
    var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
    var contract_address = process.env.NEXT_PUBLIC_PELE_ADDRESS_MAIN;
    if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
      rpc = process.env.NEXT_PUBLIC_RPC_TEST;
      contract_address = process.env.NEXT_PUBLIC_PELE_ADDRESS_TEST;
    }
    var zilliqa = new Zilliqa(rpc);
    if (window && window.zilPay) {
      const zilPay = window.zilPay;
      const result = await zilPay.wallet.connect();
      if (result) {
        zilliqa = zilPay;
      }
    }
    const contract = zilliqa.contracts.at(contract_address);
    const state = await contract.getState();

    if (Object.keys(state.balances).includes(rdxbase16.toLowerCase()) && parseFloat(state.balances[rdxbase16.toLowerCase()]) > 0) setVotablePele(true)

    setPeleHolder(state.balances)
  }

  const getPeleVoter = (proposal_id) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"' + proposal_id + '","op":"eq"}, "step":{"value":"1","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (res) {
        setPeleVoter(res.data.rows);
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  const getPeleVotingRate = (proposal_id) => {
    var url = process.env.NEXT_PUBLIC_DIST_API + 'calPeleVoteRate?pid=' + proposal_id;
    axios.get(url)
      .then(function (response) {
        var res = response.data;
        if (res.state == 'ok') {
          setPeleRate(Number(res.data));
          setSum(Number(res.sum).toFixed(2));
          setSumPele(Number(res.sum_pele).toFixed(0));
          setTotal(Number(res.total).toFixed(2));
          setTotalPele(Number(res.total_pele).toFixed(0));
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  const getMyPeleVoteState = (proposal_id, myaddress) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"' + proposal_id + '","op":"eq"}, "step":{"value":"1","op":"eq"}, "proposer":{"value":"' + myaddress + '","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (res) {
        if (res.data.rows.length > 0) {
          setMyPeleVoteSate(res.data.rows[0].metadata.keyvalues.vote)
        }
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  const getInsigniaVoter = (proposal_id) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"' + proposal_id + '","op":"eq"}, "step":{"value":"2","op":"eq"}, "vote":{"value":"1","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (res) {
        setInsigniaVoter(res.data.rows.length);
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  const getMyInsigniaVoteState = (proposal_id, myaddress) => {
    var url = 'https://api.pinata.cloud/data/pinList?status=pinned&';
    url += '&metadata[keyvalues]={"proposal_id":{"value":"' + proposal_id + '","op":"eq"}, "step":{"value":"2","op":"eq"}, "proposer":{"value":"' + myaddress + '","op":"eq"}}';
    axios.get(url, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (res) {
        if (res.data.rows.length > 0) {
          setMyInsigniaVoteSate(res.data.rows[0].metadata.keyvalues.vote)
        }
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  const fCancelProposal = () => {
    var url = `https://api.pinata.cloud/pinning/hashMetadata`;
    var body = {
      ipfsPinHash: pid,
      keyvalues: {
        state: 'cancelled'
      }
    };
    axios.put(url, body, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (response) {
        console.log(response);
        setMsgType("error");
        setMsgText('Proposal is cancelled');
        setMsgOpen(true);
        setOpenDelete(false);
      })
      .catch(function (error) {
        console.log(error);
        setOpenDelete(false);
      });
  }

  const winningAction = React.useCallback(() => {
    var url = `https://api.pinata.cloud/pinning/hashMetadata`;
    var body = {
      ipfsPinHash: pid,
      keyvalues: {
        state: 'success'
      }
    };
    axios.put(url, body, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (response) {
        console.log(response);
        setMsgType("success");
        setMsgText('Proposal is successed');
        setMsgOpen(true);
      })
      .catch(function (error) {
        console.log(error);
      });

    url = process.env.NEXT_PUBLIC_DIST_API + 'setDistributor';
    body = {
      address: address,
      deadline: deadline,
      amount: amount
    };
    axios.post(url, body)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, [deadline, address, amount]);

  const fVote = async (dir, step, addr, amount, pv, iv, ih) => {
    var base16_address = fromBech32Address(addr);
    const candidate = base16_address.replace('0x', '');
    const template_id = amount;

    const template_id_bn = new BN(template_id);
    const uint_ti = Uint8Array.from(template_id_bn.toArrayLike(Buffer, undefined, 4));

    const candidate_hash = hash.sha256().update(bytes.hexToByteArray(candidate)).digest('hex');
    const ti_hash = hash.sha256().update(uint_ti).digest('hex');
    var msg = candidate_hash + ti_hash;

    const { signature, message, publicKey } = await window.zilPay.wallet.sign(msg);

    var ts = new Date();
    var JSONBody = {
      pinataMetadata: {
        name: 'Pele_vote_' + pid,
        keyvalues: {
          proposal_id: pid,
          proposer: rdxbech32,
          vote: dir,
          step: step,
          created: ts.getTime()
        }
      },
      pinataContent: {
        proposal_id: pid,
        publicKey: publicKey,
        signature: signature,
        vote: dir,
        step: step,
        created: ts.getTime()
      }
    }
    setIsLoding(true);
    var url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    axios.post(url, JSONBody, {
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
      }
    })
      .then(function (response) {
        if (dir == 1) {
          setMsgType("success");
          setMsgText("Vote Successfull");
          if (step == 2) {
            setInsigniaVoter(1 + iv);
            var rate2 = Number(1 + iv) / Number(ih) * 100;
            if (rate2 >= (2 / 3)) {
              winningAction();
            }
          }
          else {
            getPeleVotingRate(pid);
          }
        }
        else {
          setMsgType("success");
          setMsgText("Against Successfull");
        }
        setMsgOpen(true);
        setIsLoding(false);
      })
      .catch(function (error) {
        console.log(error);
        setIsLoding(false);
      });
  }

  const vote = React.useCallback((dir) => {
    for (let key in rdxcontractState['insignia_owners']['1']) {
      console.log(rdxcontractState['insignia_owners']['1'][key].toUpperCase(), rdxbase16.toUpperCase(), rdxcontractState['insignia_owners']['1'][key].toUpperCase() == rdxbase16.toUpperCase(), voteStep);
    }
    if (proposalState == 'cancelled') {
      setMsgType("error");
      setMsgText('This proposal is cancelled.');
      setMsgOpen(true);
      return;
    }

    if (voteStep == 1 || voteStep == 2) {
      // in case of voter is not a pele holder in active stage
      if (voteStep == 1 && votablePele == false) {
        setMsgType("error");
        setMsgText('You are not PELE holder.');
        setMsgOpen(true);
        return;
      }
      // in case of voter is not a insignia holder when stage 1 success
      if (voteStep == 2 && votableInsignia == false) {
        setMsgType("error");
        setMsgText('You are not insignia holder.');
        setMsgOpen(true);
        return;
      }
      // in case of pele holder has already voted in active stage
      if (voteStep == 1 && myPeleVoteSate > -1) {
        if (myPeleVoteSate == 1) {
          setMsgType("error");
          setMsgText('You already voted in Stage 1.');
        }
        else {
          setMsgType("error");
          setMsgText('You already againsted in Stage 1.');
        }
        setMsgOpen(true);
        return;
      }
      // in case of insignia holder has already voted in stage 1 success
      if (voteStep == 2 && myInsigniaVoteSate > -1) {
        if (myInsigniaVoteSate == 1) {
          setMsgType("error");
          setMsgText('You already voted in Stage 2.');
        }
        else {
          setMsgType("error");
          setMsgText('You already againsted in Stage 2.');
        }
        setMsgOpen(true);
        return;
      }

      // in case of gold insignia holder is gonna vote in active stage
      for (let key in rdxcontractState['insignia_owners']['1']) {
        console.log(rdxcontractState['insignia_owners']['1'][key].toUpperCase(), rdxbase16.toUpperCase(), rdxcontractState['insignia_owners']['1'][key].toUpperCase() == rdxbase16.toUpperCase(), voteStep);
        if (rdxcontractState['insignia_owners']['1'][key].toUpperCase() == rdxbase16.toUpperCase() && voteStep == 1) {
          setMsgType("error");
          setMsgText('Sorry, you cannot vote now since you are golden insignia holder.');
          setMsgOpen(true);
          return;
        }
      }

      fVote(dir, voteStep, address, amount, peleVoter, insigniaVoter, insigniaHolder);
    }
    else {
      setMsgType("error");
      setMsgText('This proposal is not able to vote.');
      setMsgOpen(true);
    }
  }, [proposalState, voteStep, votablePele, votableInsignia, address, amount, myPeleVoteSate, myInsigniaVoteSate, insigniaVoter, peleVoter, insigniaHolder]);

  React.useEffect(() => {
    let step, status;
    if (proposalState == 'active' || proposalState == 'success1' || proposalState == 'success2') {
      if (peleRate < 200 / 3) {
        setVoteStep(1);
      }
      if (insigniaHolder > 0 && new Date(deadline) <= Date.now()) {
        var rate2 = Number(insigniaVoter) / Number(insigniaHolder) * 100;
        setInsigniaRate(rate2);
        if (peleRate >= 200 / 3) {
          if (rate2 >= (200 / 3)) {
            step = 3;
            status = 'success2'
          }
          else {
            step = 2;
            status = 'success1'
          }
        }
        else {
          status = 'failed'
        }
        setVoteStep(step);
        var url = `https://api.pinata.cloud/pinning/hashMetadata`;
        var body = {
          ipfsPinHash: pid,
          keyvalues: {
            state: status
          }
        };
        axios.put(url, body, {
          headers: {
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
          }
        })
      }
    }
    // else if (proposalState == 'success') {
    //   setVoteStep(3);
    // }
  }, [proposalState, peleRate, insigniaVoter, insigniaHolder, deadline]);

  React.useEffect(() => {
    setCancelProposal(false);
    setVotableInsignia(false);
    if (rdxcontractState) {
      for (var iid in rdxcontractState['insignia_owners']) {
        if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
          if (rdxcontractState.vote_access[iid] && rdxcontractState.vote_access[iid].constructor == 'True') {
            setVotableInsignia(true);
          }
        }
      }
      if (rdxcontractState != null && rdxcontractState.insignia_templates) {
        var sum = 0;
        for (var x in rdxcontractState.insignia_templates) {
          if (rdxcontractState.vote_access[x] && rdxcontractState.vote_access[x].constructor == "True") {
            sum += Number(rdxcontractState.insignia_templates[x].arguments[3]);
          }
        }
        setInsigniaHolder(sum);
      }
      if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
        setCancelProposal(true);
        setVotableInsignia(true);
      }
      for (var iid in rdxcontractState['insignia_owners']) {
        for (var ownerId in rdxcontractState['insignia_owners'][iid]) {
          if (ownerId.toUpperCase() === rdxbase16.toUpperCase()) setVotableInsignia(true);
        }
      }
    }
  }, [rdxcontractState]);

  React.useEffect(() => {
    setIsLoding(true);
    if (pid) {
      console.log('pid', pid);
      axios.get(process.env.NEXT_PUBLIC_PINATA_GATEWAY + pid)
        .then((cb) => {
          setProposal(cb.data.proposal)
          setDeadline(cb.data.deadline)
          setAddress(cb.data.receive_address)
          setAmount(cb.data.amount)
          setIsLoding(false);
        })
        .catch((err) => {
          setIsLoding(false);
        });

      var url = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=Pele_proposal';
      url += '&metadata[keyvalues]={"pinHash":{"value":"' + pid + '","op":"eq"}}';
      axios.get(url, {
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
        }
      })
        .then(function (res) {
          setProposalState(res.data.rows[0].metadata.keyvalues.state);
        })
        .catch(function (error) {
          console.log(error)
        });

      getPeleState();
      getPeleVoter(pid);
      getPeleVotingRate(pid);
      getInsigniaVoter(pid);
      getMyPeleVoteState(pid, rdxbech32);
      getMyInsigniaVoteState(pid, rdxbech32);
    }
  }, [pid]);

  return (
    <div>
      <Navbar></Navbar>

      {isLoding &&
        <Snipping></Snipping>
      }
      <div className='pt-24 px-4 pb-4 grid grid-cols-2 md:flex h-screen'>
        <div className={'flex-grow col-start-1 col-end-3 '}>
          <div className='mb-4 p-4 rounded-3xl text-white bg-cyan-200/10'>
            <div className='mb-4'>
              <div className='flex w-full justify-between'>
                <div>
                  <ArrowBackIcon className='cursor-pointer' onClick={() => router.push('/snapshot')}></ArrowBackIcon>
                </div>
                <div className={`mx-2 w-fit px-2 border rounded-full ${proposalState == 'success' ? 'border-green-700 bg-green-700' : ''} ${proposalState == 'active' ? 'border-purple-800 bg-purple-800' : ''} ${proposalState == 'cancelled' ? 'border-red-800 bg-red-800' : ''} text-white`}>{proposalState}</div>
              </div>
            </div>
            <div className='text-xl glowing-text'>
              <NewlineText text={proposal} />
            </div>
            <div className='m-2 '>Deadline: {deadline}</div>
            <div className='m-2 flex'><div>Receiver Address: </div><div className='elliptxt address-italic'>{address}</div><div>{address.substr(-4)}</div></div>
            <div className='m-2'>Amount: {amount}</div>
            <div className='mt-6'>
              <div className='text-lg'>PELE Holders ({sumPele} / {totalPele})</div>
              <div className='md:flex'>
                <div className='flex-grow'><LinearProgressWithLabel className='progress-bar' value={peleRate} /></div>
                <div className={`w-32 mx-2 w-fit px-2 border rounded-full ${voteStep == 1 ? 'bg-purple-800 border-purple-800' : ''} ${voteStep > 1 ? 'bg-green-700 border-green-700' : ''} text-white`}>
                  {voteStep == 1 &&
                    `In Progress`
                  }
                  {voteStep > 1 &&
                    `Passed`
                  }
                </div>
              </div>
            </div>
            <div className='mt-6'>
              <div className='text-lg'>Insignia Holders ({insigniaVoter} / {insigniaHolder})</div>
              <div className='md:flex'>
                <div className='flex-grow'><LinearProgressWithLabel className='progress-bar' value={insigniaRate} /></div>
                <div className={`w-32 mx-2 w-fit px-2 border rounded-full ${voteStep > 1 ? 'bg-purple-800 border-purple-800' : 'bg-green-700 border-green-700'} text-white`}>
                  {voteStep == 1 &&
                    `Not Started`
                  }
                  {voteStep == 2 &&
                    `In Progress`
                  }
                  {voteStep > 2 &&
                    `Passed`
                  }
                </div>
              </div>
            </div>
          </div>
          <TableContainer component={Paper} style={{ order: 3 }} className='!bg-cyan-200/10 mb-0 md:mb-4 p-4 rounded-3xl !text-white '>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell className='!text-white glowing-text-small' colSpan={4} align={'left'} style={{ fontSize: 20, borderBottomColor: "rgba(255, 255, 255, 0.3)" }}>Votes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  peleVoter.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell className='!text-white address-italic' component="th" scope="row" style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)" }}>
                        {row.metadata.keyvalues.proposer}
                      </TableCell>
                      <TableCell align="center" style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)" }}>
                        {
                          row.metadata.keyvalues.vote == 1 ? <ThumbUpIcon style={{ color: 'green' }} /> : <ThumbDownIcon style={{ color: 'red' }} />
                        }
                      </TableCell>
                      <TableCell className='!text-white' align="center" style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)" }}>
                        {
                          Number(peleHolder[fromBech32Address(row.metadata.keyvalues.proposer).toLowerCase()] / 100000).toFixed(0)
                        }
                      </TableCell>
                      <TableCell style={{ borderBottomColor: "rgba(255, 255, 255, 0.3)" }}>
                        <a className='!text-white' href={'https://gateway.pinata.cloud/ipfs/' + row.ipfs_pin_hash} target={'blank'}>
                          <OpenInNewIcon />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className='m-2 rounded-3xl w-80 md:w-80 '>
          <div>
            <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer vote-button' onClick={() => vote(1)}>FOR</div>
            <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer vote-button' onClick={() => vote(0)}>AGAINST</div>
            {cancelProposal &&
              <div className='border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer hover:text-rose-100' onClick={() => setOpenDelete(true)}>Cancel</div>
            }
            <a className='block border rounded-full m-3 p-2 text-white text-2xl text-center cursor-pointer vote-button' href="https://t.me/getyousomepele">Discuss</a>
          </div>

          <Card className='!bg-cyan-200/10 mb-4 p-4 rounded-3xl !text-white '>
            <CardHeader title={<p className='glowing-text-small'>Information</p>} />
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <b>IPFS: </b>
                </div>
                <div>
                  <a href={'https://gateway.pinata.cloud/ipfs/' + pid} target={'blank'}>
                    {pid ? pid.substr(0, 10) : ''}...
                    <OutputIcon />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Do you want to cancel this proposal?</DialogTitle>
        <DialogActions>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => fCancelProposal()}>Yes, Cancel!</div>
          <div className='m-2 p-2 border rounded-lg cursor-pointer hover:font-medium' onClick={() => setOpenDelete(false)}>Close</div>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={msgOpen}
        autoHideDuration={6000}
        onClose={() => { setMsgOpen(false) }}
      >
        <Alert onClose={() => { setMsgOpen(false) }} severity={msgType} sx={{ width: '100%' }}>{msgText}</Alert>
      </Snackbar>
    </div>
  )
}
