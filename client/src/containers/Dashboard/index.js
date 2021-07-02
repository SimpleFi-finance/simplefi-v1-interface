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
  Modal,
  SelectionModal,
  AssetLogo
} from '../../components';

import {
  FeatureSt,
  TitleSt,
  TesserModalSt,
  MovingIconSt  
} from './dashboard.style';
import { ethers } from 'ethers';
import IERC20 from '../../utils/helpers/IERC20.json'

const initState = {
  from: {
    asset: {},
    value: null
  },
  to: {
    asset: {}
  }
};

const Dashboard = ({ address, provider, userSigner, loadWeb3Modal }) => {
  const [modal, setModal] = useState({ state: false, direction: null });
  const [swapSelection, setSwapSelection] = useState(initState);
  const [tokens, setTokens] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [tesserStarted, setTesser] = useState(false);

  useEffect(() => {
    if (address && !!provider) {
      async function getBalances(data, type) {
        const assets = [...data];
        for (let asset of assets) {
          if (!asset.balance) {
            try {
              const contract = new ethers.Contract(asset.outputToken || asset.address, IERC20, provider);
              const balance = await contract.balanceOf(address.toLowerCase());
              const formatBalance = ethers.utils.formatUnits(balance, asset.decimals)
              asset['balance'] = formatBalance;
            } catch (err) {
              console.log(err)
              alert('Check networks')
            }
          }
        }
        if (type === 'tokens') {
          setTokens(assets);
        } else {
          setInvestments(assets);
        }
      };
      const tokens = [...investmentsData.tokens];
      const investments = [...investmentsData.investments];
      getBalances(tokens, 'tokens')
      getBalances(investments, 'investments')
    }
  }, [address, provider]);

  const setSwapAsset = (asset, direction) => {
    let swaps = {}
    if (direction === 'from') {
      swaps = {
        ...swapSelection,
        [direction]: {
          asset: asset,
          value: 0.0,
        }
      };
    } else {
      swaps = {
        ...swapSelection,
        [direction]: {
          asset: asset
        }
      };
    }
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
    setModal({ state: true, direction: direction })
  };

  const fromSelected = !!(swapSelection.from.asset !== {} && swapSelection.from.value && swapSelection.from.value > 0)
  const toSelected = !!(swapSelection.to.asset !== {})
  const buttonDisabled = !(fromSelected && toSelected);

  const tesserInvestments = () => {
    console.log('tessering')
    // logic to approve connection and transaction goes here
    setTesser(!tesserStarted)
    setModal({ state: true })
  }

  const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  const tesseringModal = () => {
    let logoFrom = swapSelection.from.asset.logo;
    if (!logoFrom) {
      logoFrom = investmentsData.protocols.find(prot => prot.investments.includes(swapSelection.from.asset.id)).logo
    }
    
    let logoTo = swapSelection.to.asset.logo
    if (!logoTo) {
      logoTo = investmentsData.protocols.find(prot => prot.investments.includes(swapSelection.to.asset.id)).logo
    }
    
    const droppingLogos = [];
    for (let x = 0; x < 10; x++) {
      droppingLogos.push(
        <MovingIconSt
          key={x}
          delay={x / 10}
          topValue={getRandomIntInclusive(2, 30)}
          leftValue={getRandomIntInclusive(2, 90)}
        >
          <AssetLogo logo={logoFrom} height='45px' width='45px' />
        </MovingIconSt>
      );
    }

    return (
      <TesserModalSt>
        <span> <p>{swapSelection.from.asset.symbol}: {swapSelection.from.value}</p></span>
          {droppingLogos}
          <span><AssetLogo logo={logoTo} height='30px' width='30px'/><p style={{marginLeft: '5px'}}> {swapSelection.to.asset.name}</p></span>
      </TesserModalSt>
    );
  };

  const ModalContent = tesserStarted
    ? tesseringModal()
    : <SelectionModal
        investmentsData={{
          tokens: tokens,
          investments: investments,
          protocols: [...investmentsData.protocols]
        }}
        setSwapAsset={(asset) => setSwapAsset(asset, modal.direction)}
      />
  
  return (
    <ContainerSt>
      {modal.state &&
        //TODO add transition here
        <Modal
          closeModal={() => {setModal({ state: false, direction: null }); setTesser(false)}}
          content={ModalContent}
        />
      }
      <FeatureSt>
        <TitleSt> Tesser </TitleSt>
        <AssetBalance
          asset={swapSelection.from.asset}
          clickAction={() => openSelector('from')}
          swapAmount={swapSelection.from.value}
          setSwapAmount={(value) => setSwapValue(value, 'from')}
          direction={'from'}
          provider={provider}
        />
        <img src={SwitchIcon} alt=""/>
        <AssetBalance
          asset={swapSelection.to.asset}
          clickAction={() => openSelector('to')}
          direction={'to'}
          provider={provider}
        />
        <div style={{
          height: '70px',
          width: 'calc(100% - 20px)',
          margin: '10px 10px 5px',
          fontSize: '24px'
        }}>
          {provider
            ?
            <Button
              clickAction={() => tesserInvestments()}
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
              clickAction={() => loadWeb3Modal() }
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