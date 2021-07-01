/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import Web3Modal from 'web3modal';
import WalletConnectProvider from "@walletconnect/web3-provider";
import React, { useCallback, useEffect, useState } from "react";
import { ethers } from 'ethers';
import { INFURA_ID, NETWORKS } from "./constants";
import { Account } from './components'
import {
  useUserSigner
} from './utils/hooks';
import {
  Switch,
  Route
} from "react-router-dom";
import { withRouter } from 'react-router';
import {
  Landing,
  Dashboard
} from './containers';
import {
  NavBar
} from './components/UI'

const AppSt = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(#f6eef4, #f5f4f6);
`;

const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
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

  useEffect(() => {
    if (address) {
      props.history.push(`/${address}`);
    } else {
      props.history.push(`/`)
    }
  }, [address])

  const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;
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

    // Subscribe to session disconnection
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
        <h2>
          Tesser
        </h2>
        {props.location.pathname !== '/' &&
          <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        }
      </NavBar>
        <Switch>
          <Route exact path={`/`}>
            <Landing
            history={props.history}
            loadWeb3Modal={loadWeb3Modal}
            />
          </Route>
          <Route path={`/${address}`}>
            <Dashboard
              history={props.history}
              address={address}
              userSigner={userSigner}
              provider={injectedProvider || mainnetProvider}
            />
          </Route>
        </Switch>
    </AppSt>
  );
}

export default withRouter(App);
