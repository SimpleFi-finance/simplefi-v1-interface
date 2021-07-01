/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import SwitchIcon from '../../assets/svgs/swap.png';
import {
  ContainerSt,
  Button
} from '../../components/UI';
import investmentsData from '../../utils/helpers/chainDataSources.json';
import {
  AssetBalance,
  AssetsList,
  SelectionModal
} from '../../components';

import {
  FeatureSt,
} from './dashboard.style';

const initState = {
  from: {
    asset: {},
    value: null
  },
  to: {
    asset: {},
    value: null
  }
};

const Dashboard = ({ history, address, provider, userSigner }) => {
  const [modal, setModal] = useState({state: false, direction: null});
  const [swapSelection, setSwapSelection] = useState(initState);
  const [tokens, setTokens] = useState([]);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    if (address) {
      async function getBalances(data) {
        // query balance
        const balances = []
        for (let asset of data) {
          // TODO query user balances
          // attach contract and query balance => convert to number with right decimals
          asset['balance'] = 12
        }
        return balances;
      };
      const tokens = [...investmentsData.tokens];
      const investments = [...investmentsData.investments];
      getBalances(tokens)
      getBalances(investments)
      console.log(tokens)
      setTokens(tokens)
      setInvestments(investments)
    } else {
      history.push('/');
    }
  }, [address]);

  const setSwapAsset = (asset, direction) => {
    const swaps = {
      ...swapSelection,
      [direction]: {
        asset: asset,
        value: 0.0,
      }
    };
    setSwapSelection(swaps);
    setModal({ state: false, direction: 'null' });
  };

  const setSwapValue = (value, el) => {
    const swaps = {
      ...swapSelection,
      [el]: {
        asset: { ...swapSelection[el].asset },
        value: value,
      }
    }
    setSwapSelection(swaps);
  };

  const openSelector = (direction) => {
    setModal({state: true, direction: direction})
  };

  const fromSelected = !!(swapSelection.from.asset !== {} && swapSelection.from.value && swapSelection.from.value > 0)
  const toSelected = !!(swapSelection.to.asset !== {} && swapSelection.to.value && swapSelection.to.value > 0)
  const buttonDisabled = !(fromSelected && toSelected);

  return (
    <ContainerSt>
      {modal.state &&
        //TODO add transition here
        <AssetsList
          closeModal={() => setModal({ state: false, direction: null })}
        content={
          <SelectionModal
            investmentsData={{
              tokens: tokens,
              investments: investments,
              protocols: [...investmentsData.protocols]
            }}
            setSwapAsset={(asset) => setSwapAsset(asset, modal.direction)}
          />}
        />
      }
      <FeatureSt>
        <span> Tesser </span>
        <AssetBalance
          asset={swapSelection.from.asset}
          clickAction={() => openSelector('from')}
          swapAmount={swapSelection.from.value}
          setSwapAmount={(value) => setSwapValue(value, 'from')}
        />
        <img src={SwitchIcon} alt=""/>
        <AssetBalance
          asset={swapSelection.to.asset}
          clickAction={() => openSelector('to')}
          swapAmount={swapSelection.to.value}
          setSwapAmount={(value) => setSwapValue(value, 'to')}
        />
        <div style={{ height: '70px', width: 'calc(100% - 20px)', margin: '10px 10px 5px', fontSize:'24px' }}>
          {address
            ?
            <Button
              clickAction={() => { console.log('fire contract') }}
              disable={buttonDisabled}
            >
              {buttonDisabled ?
                "Enter an Amount"
                : "Tesser"
              }
            </Button>
            :
            <Button
              type='error'
              clickAction={() => { console.log('connect wallet')}}
            >
              Connect Wallet
            </Button>
          }
        </div>
      </FeatureSt>
    </ContainerSt>
  )
}

export default Dashboard;