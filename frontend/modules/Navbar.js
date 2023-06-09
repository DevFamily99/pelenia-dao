import React from "react";
import Image from "next/image"
import { useRouter } from 'next/router';

import { Zilliqa } from '@zilliqa-js/zilliqa';
const { bytes } = require('@zilliqa-js/util');

import cusStyle from './style.module.css'

import { useDispatch, useSelector } from 'react-redux'
import { setWalletAddress, setContract, setContractState, setVersion, setMyInsignias, setTreasury } from "./ZilpaySlice";
import { bech32 } from './ZilpaySlice';
import { contractState,  myinsignias } from './../modules/ZilpaySlice';
import swal from 'sweetalert';

import useStorage from './hook.ts';

export const Navbar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const rdxbech32 = useSelector(bech32);
  const { getItem, setItem, removeItem } = useStorage();
  const rdxmyinsignias = useSelector(myinsignias);
  const rdxcontractState = useSelector(contractState);

  const [openPopup, togglePopup] = React.useState(false);
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [insignias, setInsignias] = React.useState([]);

  const onWallet = async () => {
    if (walletConnected) {
      togglePopup(!openPopup)
    }
    else {
      if (window.zilPay) {
        const zilPay = window.zilPay;
        const result = await zilPay.wallet.connect();
        if (result) {
          dispatch(setWalletAddress({
            base16:zilPay.wallet.defaultAccount.base16,
            bech32:zilPay.wallet.defaultAccount.bech32
          }));

          setWalletConnected(true);
          setItem('zilpay', zilPay.wallet.defaultAccount.base16);
        }
      }
      else {
        swal("Please install Zilpay");
      }
    }
  }

  const logout = () => {
    dispatch(setWalletAddress({
      base16:'',
      bech32:''
    }));

    setWalletConnected(false);
    togglePopup(false);
    removeItem('zilpay');
  }

  React.useEffect(() => {
    const run = async () => {
      var rpc = process.env.NEXT_PUBLIC_RPC_MAIN;
      var contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAIN;
      var chainId = process.env.NEXT_PUBLIC_CHAINID_MAIN;
      if (process.env.NEXT_PUBLIC_NETWORK_TYPE == 'test') {
        rpc = process.env.NEXT_PUBLIC_RPC_TEST;
        contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TEST;
        chainId = process.env.NEXT_PUBLIC_CHAINID_TEST;
      }
      var zilliqa = new Zilliqa(rpc);
      if (walletConnected) {
        const zilPay = window.zilPay;
        const result = await zilPay.wallet.connect();
        if (result) {
          zilliqa = zilPay;
        }
      }
      const contract = zilliqa.contracts.at(contract_address);
      const version = bytes.pack(Number(chainId), Number(process.env.NEXT_PUBLIC_MSG_VERSION));
      const state = await contract.getState();
      const treasury_address = state.treasury_address.arguments[0]?state.treasury_address.arguments[0]:'';
      dispatch(setVersion(version));
      dispatch(setContract(contract_address));
      dispatch(setContractState(state));
      dispatch(setTreasury(treasury_address));

      if (walletConnected) {
        var myInsignias = {}
        var holders = state.insignia_owners;
        for (var tid in holders) {
          myInsignias[tid] = [];
          for (var iid in holders[tid]) {
            if (holders[tid][iid].toUpperCase() == window.zilPay.wallet.defaultAccount.base16.toUpperCase()) {
              myInsignias[tid].push(iid);
            }
          }
        }
        dispatch(setMyInsignias(myInsignias))
      }
    };
    run();
  }, [walletConnected]);

  React.useEffect(() => {
    if (rdxcontractState != null) {
      var data = [];
      var index = 1;
      for (var x in rdxmyinsignias) {
        for (var y in rdxmyinsignias[x]) {
          data.push({
            id: index,
            tid: x,
            iid: rdxmyinsignias[x][y],
            name: rdxcontractState.insignia_templates[x].arguments[0],
            url: rdxcontractState.insignia_templates[x].arguments[1]
          });
          index ++;
          if (index > 3) break;
        }
      }
      setInsignias(data);
    }
  }, [rdxcontractState, rdxmyinsignias])

  React.useEffect(() => {
    if (getItem('zilpay') != undefined && getItem('zilpay') != '') {
      onWallet();
    }
  }, []);

  return (
    <div className={`fixed w-full h-20 top-0 ${cusStyle.nav_bg} flex justify-between z-10`}>
      <div className={`h-full w-60 p-1 cursor-pointer`} onClick={() => router.push("/")}>
        <Image
          src="/logo.svg"
          layout="responsive"
          width={160}
          height={48}
          className="w-full"
          priority={true}
        />
      </div>
      <div className="hidden md:flex mx-8 my-5 flex">
        <div
          className="button fontbuttonlarge ml-4"
          onClick={() => onWallet()}
        >
          { rdxbech32 == "" ?
            `Connect Wallet`
            : rdxbech32.substr(0, 6)+"..."+rdxbech32.substr(rdxbech32.length - 6)
          }
        </div>
        <div
          className="button fontbuttonlarge p-2 ml-4 "
          onClick={() => router.push('/snapshot')}
        >Proposals</div>
        { openPopup ?
          <div className="absolute mt-4 ml-40">
            <div className="relative inline-block text-left">
                <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-lg bg-fuchsia-200 dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1 " role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/myinsignia')}}>
                      <span className="flex flex-col">
                        <span>
                          <div className="flex items-center">
                            <div>My Insignias</div>
                            { insignias.length ?
                              <div className='w-10 h-10 mx-auto rounded-full ml-3' style={{backgroundImage:`url('/insigniabg.png')`, backgroundSize:'100% 100%'}}></div>
                              : <div className='w-10 h-10 mx-auto rounded-full ml-3'></div>
                            }
                          </div>
                        </span>
                      </span>
                    </span>
                    {/* <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/treasury')}}>
                      <span className="flex flex-col">
                        <span>
                          Treasury Wallet
                        </span>
                      </span>
                    </span> */}
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/treasurypele')}}>
                      <span className="flex flex-col">
                        <span>
                          Treasury
                        </span>
                      </span>
                    </span>
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => logout()}>
                      <span className="flex flex-col">
                        <span>
                          Logout
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
            </div>
          </div>
          : ""
        }
      </div>
      <button className="hover:bg-gray-400 block md:hidden py-3 px-4 mx-2 rounded focus:outline-none group">
        <div className="w-5 h-1 bg-gray-600 mb-1"></div>
        <div className="w-5 h-1 bg-gray-600 mb-1"></div>
        <div className="w-5 h-1 bg-gray-600"></div>
        <div className="rounded-xl absolute -right-full h-fit w-3/5 sm:w-2/5 opacity-0 group-focus:right-0 group-focus:opacity-100 transition-all duration-300">
          <div className="absolute ml-48 mb-1">
            <div className="relative inline-block text-left">
                <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-lg bg-fuchsia-200 dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1 " role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem">
                      <span className="flex flex-col">
                        <span>
                          <div className="flex items-center">
                            <div onClick={() => onWallet()}>
                                { rdxbech32 == "" ?
                                  `Connect Wallet`
                                  : rdxbech32.substr(0, 6)+"..."+rdxbech32.substr(rdxbech32.length - 6)
                                }
                            </div>
                          </div>
                        </span>
                      </span>
                    </span>
                    { walletConnected ? 
                    <>
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/snapshot')}}>
                      <span className="flex flex-col">
                        <span>
                          Proposals
                        </span>
                      </span>
                    </span>
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/myinsignia')}}>
                      <span className="flex flex-col">
                        <span>
                          <div className="flex items-center">
                            <div>My Insignias</div>
                            { insignias.length ?
                              <div className='w-10 h-10 mx-auto rounded-full ml-3' style={{backgroundImage:`url('/insigniabg.png')`, backgroundSize:'100% 100%'}}></div>
                              : <div className='w-10 h-10 mx-auto rounded-full ml-3' ></div>
                            }
                          </div>
                        </span>
                      </span>
                    </span> 
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/treasurypele')}}>
                      <span className="flex flex-col">
                        <span>
                          Treasury
                        </span>
                      </span>
                    </span>
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => logout()}>
                      <span className="flex flex-col">
                        <span>
                          Logout
                        </span>
                      </span>
                    </span>
                    </>
                    : 
                    <span className="block block px-4 py-2 text-md rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-gray-600 cursor-pointer" role="menuitem" onClick={() => {router.push('/snapshot')}}>
                      <span className="flex flex-col">
                        <span>
                          Proposals
                        </span>
                      </span>
                    </span>
                    }
                    
                    
                  </div>
                </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

