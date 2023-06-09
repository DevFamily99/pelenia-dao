import React from 'react';
import { useRouter } from 'next/router';
const axios = require('axios');

import { Navbar } from '../modules/Navbar';
import { Snipping } from '../modules/Snipping';

import { useSelector } from 'react-redux';
import { bech32, base16, contractState, myinsignias } from './../modules/ZilpaySlice';

import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Sanpshot() {
  const router = useRouter();

  const rdxbech32 = useSelector(bech32);
  const rdxbase16 = useSelector(base16);
  const rdxcontractState = useSelector(contractState);
  const rdxmyinsignias = useSelector(myinsignias);

  const [openSubmit, setOpenSubmit] = React.useState(false);
  const [submitAddress, setSubmitAddress] = React.useState('');
  const [submitAmount, setSubmitAmount] = React.useState('');
  const [submitTag, setSubmitTag] = React.useState('');
  const [submitDeadline, setSubmitDeadline] = React.useState('');
  const [ableToPropose, setAbleToPropose] = React.useState(false);

  const [option, setOption] = React.useState('active');
  const [proposals, setProposals] = React.useState([]);

  const [msgOpen, setMsgOpen] = React.useState(false);
  const [msgText, setMsgText] = React.useState('');
  const [isLoding, setIsLoding] = React.useState(false);

  const submitProposal = React.useCallback(() => {
    var ts = new Date();
    var JSONBody = {
      pinataMetadata: {
        name: 'Pele_proposal',
        keyvalues: {
          proposer: rdxbech32,
          proposal: submitTag,
          state: 'active',
          created: ts.getTime()
        }
      },
      pinataContent: {
        proposal: submitTag,
        deadline: submitDeadline,
        amount: submitAmount,
        receive_address: submitAddress
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
        var data = proposals;
        data.push({
          ipfs_pin_hash: response.data.IpfsHash,
          proposal: submitTag,
          proposer: rdxbech32,
          state: 'active'
        });

        var createProposalUrl = process.env.NEXT_PUBLIC_DIST_API + 'createProposal';
        axios.post(createProposalUrl, {
          pinHash: response.data.IpfsHash,
          proposal: submitTag,
          proposer: rdxbech32,
          deadline: submitDeadline,
          amount: submitAmount,
          receive_address: submitAddress
        })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
          
        setProposals(data);
        setIsLoding(false);
        setOpenSubmit(false);

        var url = `https://api.pinata.cloud/pinning/hashMetadata`;
        var body = {
          ipfsPinHash: response.data.IpfsHash,
          keyvalues: {
            pinHash: response.data.IpfsHash
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
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
        setIsLoding(false);
        setOpenSubmit(false);
      });
  }, [submitAddress, submitAmount, submitTag, submitDeadline, rdxbech32, proposals]);

  React.useEffect(() => {
    setAbleToPropose(false);
    for (var iid in rdxmyinsignias) {
      if (rdxmyinsignias[iid] && rdxmyinsignias[iid].length > 0) {
        if (rdxcontractState.proposal_access[iid] && rdxcontractState.proposal_access[iid].constructor == 'True') {
          setAbleToPropose(true);
        }
      }
    }
    if (rdxcontractState && rdxcontractState.contract_owner && rdxcontractState.contract_owner.toUpperCase() == rdxbase16.toUpperCase()) {
      setAbleToPropose(true);
    }
  }, [rdxmyinsignias, rdxcontractState]);

  React.useEffect(() => {
    const getProposal = async () => {
      var url = 'https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=Pele_proposal';
      if (option != 'all') {
        url += '&metadata[keyvalues]={"state":{"value":"' + option + '","op":"eq"}}';
      }
      try {
        const res = await axios.get(url, {
          headers: {
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
          }
        });
        var data = [];
        var rows = res.data.rows;
        for (var x in rows) {
          let res1 = await axios.get(process.env.NEXT_PUBLIC_PINATA_GATEWAY + rows[x].ipfs_pin_hash);
          let proposalData = res1.data;
          let deadline = new Date(proposalData.deadline);

          // if(option === 'active' && deadline < Date.now()) {
          //   var getRateUrl = process.env.NEXT_PUBLIC_DIST_API + 'calPeleVoteRate?pid=' + rows[x].ipfs_pin_hash;
          //   const res2 = await axios.get(getRateUrl);
          //   var url = `https://api.pinata.cloud/pinning/hashMetadata`;
          //   var body = {
          //     ipfsPinHash: rows[x].ipfs_pin_hash,
          //     keyvalues: {
          //       state: res2.data?.data > (2/3) ? 'success' : 'failed'
          //     }
          //   };
          //   axios.put(url, body, {
          //     headers: {
          //       pinata_api_key: process.env.NEXT_PUBLIC_PINATA_KEY,
          //       pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SEC
          //     }
          //   })
          //   continue;
          // }

          data.push({
            ipfs_pin_hash: rows[x].ipfs_pin_hash,
            proposal: rows[x].metadata.keyvalues.proposal,
            proposer: rows[x].metadata.keyvalues.proposer,
            state: rows[x].metadata.keyvalues.state
          });
        }
        setProposals(data);
      }
      catch (err) {
        console.log(err);
      }
    }
    getProposal();
  }, [option]);

  return (
    <div className='w-full h-screen bg-color overflow-y-auto'>
      <Navbar></Navbar>

      {isLoding &&
        <Snipping></Snipping>
      }
      <div className='grid grid-cols-2 md:flex pt-24 pb-2 p-10 place-items-center '>
        <div className={`fontbuttonsmall md:text-lg md:font-bold underline-selection mt-6 m-3 p-3 ${option == 'all' ? 'bgactivecyan underline-selection-active' : ''}`} onClick={() => setOption('all')}>All</div>
        <div className={`fontbuttonsmall md:text-lg md:font-bold underline-selection mt-6 m-3 p-3 ${option == 'active' ? 'bgactivecyan underline-selection-active' : ''}`} onClick={() => setOption('active')}>Active</div>
        <div className={`fontbuttonsmall md:text-lg md:font-bold underline-selection mt-6 m-3 p-3 ${option == 'success1' ? 'bgactivecyan underline-selection-active' : ''}`} onClick={() => setOption('success1')}>Success 1</div>
        <div className={`fontbuttonsmall md:text-lg md:font-bold underline-selection mt-6 m-3 p-3 ${option == 'success2' ? 'bgactivecyan underline-selection-active' : ''}`} onClick={() => setOption('success2')}>Success 2</div>
        <div className={`fontbuttonsmall md:text-lg md:font-bold underline-selection mt-6 m-3 p-3 ${option == 'failed' ? 'bgactivecyan underline-selection-active' : ''}`} onClick={() => setOption('failed')}>Failed/Cancelled</div>
        <div className='hidden md:block grow'></div>
        {ableToPropose ?
          <div className='w-45 border rounded-full m-6 mt-6 p-3 text-white text-center cursor-pointer button col-start-1 col-end-3 ' onClick={() => setOpenSubmit(true)}>Create Proposal</div>
          :
          <div className='w-45 border border-slate-500 rounded-full m-6 mt-6 p-3 text-slate-400 text-center button-disabled col-start-1 col-end-3 '>Create Proposal</div>
        }
      </div>

      <div className='flex lg:flex-nowrap flex-wrap container mx-auto'>
        <div className='w-full'>
          {proposals.map((item) =>
            <div key={item.ipfs_pin_hash} className='m-2 p-4 bg-cyan-200/10 rounded-3xl cursor-pointer hover:bg-cyan-200/30' onClick={() => router.push('/snapshot/' + item.ipfs_pin_hash)}>
              <div className='relative top-2 bg-purple-600 w-fit py-1 px-3 rounded-full text-white'>{item.state}</div>
              <div className='text-lg -mt-6 ml-24 text-white'>{item.proposal}</div>
              <div className='text-white text-left md:text-right'>Proposed by <span className='font-medium text-sm md:text-base address-italic text-white'>{item.proposer}</span></div>
            </div>
          )}
        </div>
      </div>

      <Dialog className='dialog-box' open={openSubmit} onClose={() => setOpenSubmit(false)}>
        <DialogTitle className='dialog-box-content text-white'>
          <DialogContent className='w-96'>
            <p className='text-lg mt-6'>Proposal Idea</p>
            <TextField onChange={(e) => setSubmitTag(e.target.value)} className='w-full mt-2' inputProps={{ style: { color: "#C0BFBD" } }} InputLabelProps={{ style: { color: '#C0BFBD' } }} label="What is your Proposal?" variant="filled" multiline rows={4} maxRows={8} />
            <p className='text-lg mt-6'>Deadline</p>
            <TextField
              onChange={(e) => setSubmitDeadline(e.target.value)} className='w-full mt-2 hideLabel' inputProps={{ style: { color: "#C0BFBD" } }} InputLabelProps={{ style: { color: '#C0BFBD' } }} label="When should be the Deadline?" variant="filled"
              type="date"
            />
            <p className='text-lg mt-6'>Amount</p>
            <TextField onChange={(e) => setSubmitAmount(e.target.value)} className='w-full mt-2' inputProps={{ style: { color: "#C0BFBD" } }} InputLabelProps={{ style: { color: '#C0BFBD' } }} label="How Much is the Amount?" variant="filled" />
            <p className='text-lg mt-6'>Receiving Address</p>
            <TextField onChange={(e) => setSubmitAddress(e.target.value)} className='w-full' inputProps={{ style: { color: "#C0BFBD" } }} InputLabelProps={{ style: { color: '#C0BFBD' } }} label="What is the Address?" variant="filled" />
          </DialogContent>
          <DialogActions>
            <div className='m-2 p-2 border rounded-lg font-weight-small opacity-70 button-disabled' onClick={() => setOpenSubmit(false)}>Cancel</div>
            <div className='m-2 p-2 border rounded-lg button fontbuttonlarge' onClick={() => submitProposal()}>Submit</div>
          </DialogActions></DialogTitle>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={msgOpen}
        autoHideDuration={6000}
        onClose={() => { setMsgOpen(false) }}
      >
        <Alert onClose={() => { setMsgOpen(false) }} severity="error" sx={{ width: '100%' }}>{msgText}</Alert>
      </Snackbar>
    </div>
  )
}
