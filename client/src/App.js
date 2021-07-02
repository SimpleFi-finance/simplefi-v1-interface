/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import Web3Modal from 'web3modal';
import WalletConnectProvider from "@walletconnect/web3-provider";
import React, { useCallback, useEffect, useState } from "react";
import { ethers } from 'ethers';
import { NETWORKS } from "./constants";
import { Account } from './components'
import {
  useUserSigner
} from './utils/hooks';

import SimplefiLogo from './assets/logos/simplefi-logotype.png'

import {
  Dashboard
} from './containers';

import {
  NavBar,
  Button
} from './components/UI'

const AppSt = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(#ED40A5, white);
`;

const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: process.env.REACT_APP_INFURA_PROJECT_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

const targetNetwork = NETWORKS.matic;
const localProviderUrl = targetNetwork.rpcUrl;
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrl);

const blockExplorer = targetNetwork.blockExplorer;

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const userSigner = useUserSigner(injectedProvider, localProvider);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + process.env.REACT_APP_INFURA_PROJECT_ID) : null;
  const mainnetProvider = mainnetInfura;

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  return (
    <AppSt>
      <NavBar>
        <img src={SimplefiLogo} alt="simplefi" />
        {injectedProvider
          ?
          <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={injectedProvider || mainnetProvider}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
          :
          <div style={{
            height: '50px',
            width: '250px',
            margin: '10px 10px 5px',
            fontSize: '20px'
          }}>
            <Button
              clickAction={() => loadWeb3Modal() }
            >
              Connect Wallet
            </Button>
          </div>
        }
      </NavBar>
      <Dashboard
        address={address}
        userSigner={userSigner}
        provider={injectedProvider}
        loadWeb3Modal={loadWeb3Modal}
      />
    </AppSt>
  );
}

export default App;
