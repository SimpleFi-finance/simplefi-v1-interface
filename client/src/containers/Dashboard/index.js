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

import TesserContract from '../../utils/helpers/Tesser.json';

import {
  FeatureSt,
  TitleSt,
  TesserModalSt,
  MovingIconSt  
} from './dashboard.style';
import { ethers } from 'ethers';
import IERC20 from '../../utils/helpers/IERC20.json'
import CURVE_ABI from '../../utils/helpers/curveGaugeAbi.json'
const initState = {
  from: {
    asset: {},
    value: null
  },
  to: {
    asset: {}
  }
};

const isMarket = (asset) => {
  return (asset.type === 'LP' || asset.type === 'Farm')
}
const TESSER_CONTRACT = "0x01cf58e264d7578D4C67022c58A24CbC4C4a304E"
const approveConn = async (token, user, amount, provider) => {
  const erc20 = new ethers.Contract(token, IERC20, provider);
  await erc20.approve(user, amount);
}

const Dashboard = ({ address, provider, userSigner, loadWeb3Modal, showStakeDao }) => {
  const [modal, setModal] = useState({ state: false, direction: null });
  const [swapSelection, setSwapSelection] = useState(initState);
  const [tokens, setTokens] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [tesserStarted, setTesser] = useState(false);

  const TesserController = new ethers.Contract(TESSER_CONTRACT, TesserContract, userSigner)
  
  const getBalances = async (data, type) => {
    const assets = [...data];
    for (let asset of assets) {
      if (asset.address === '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0') {
        const balance = await provider.getBalance(address)
        const formatBalance = ethers.utils.formatUnits(balance, asset.decimals);
        asset['balance'] = formatBalance
      } else if (asset.address === '0x19793B454D3AfC7b454F206Ffe95aDE26cA6912c') {
        const contractAddress = asset.address;
        const contract = new ethers.Contract(contractAddress, CURVE_ABI, userSigner);
        const balance = await contract.balanceOf(address);
        const formatBalance = ethers.utils.formatUnits(balance, asset.decimals);
        asset['balance'] = formatBalance || 0.0;
      } else if (!asset.balance) {
        const contractAddress = asset.outputToken || asset.address;
        const contract = new ethers.Contract(contractAddress, IERC20, provider);
        const balance = await contract.balanceOf(address);
        const formatBalance = ethers.utils.formatUnits(balance, asset.decimals);
        asset['balance'] = formatBalance;
      }
    }

    if (type === 'tokens') {
      setTokens(assets);
    } else {
      setInvestments(assets);
    }
  }

  useEffect(() => {
    // todo add loader
    if (address && !!provider) {
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
  const toSelected = swapSelection.to.asset !== {}
  const buttonDisabled = !(fromSelected && toSelected);
  //TODO transaction tracking 
  const tesserInvestments = async () => {
    let transaction
    setTesser(!tesserStarted)
    setModal({ state: true })
    const fromAddress = swapSelection.from.asset.outputToken || swapSelection.from.asset.address;
    const toAddress = swapSelection.to.asset.outputToken || swapSelection.to.asset.address
    if (isMarket(swapSelection.to.asset)) {
      if (isMarket(swapSelection.from.asset)
        && !swapSelection.to.asset.inputTokens.includes(fromAddress)
        && !swapSelection.from.asset.inputTokens.includes(toAddress)
      ) {
        // migrate
        const adapterAddressFrom = await TesserController.getAdapterAddressForMarket(fromAddress);
        const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
        await approveConn(fromAddress, adapterAddressFrom, bigInt, userSigner)
        transaction = await TesserController.migrate(
          fromAddress,
          swapSelection.to.asset.address,
          [bigInt],
          false,
          false
        )
      } else if (swapSelection.from.asset.inputTokens?.includes(toAddress)) {
        console.log('withdraw')
        //withdraw
        const adapterAddressFrom = await TesserController.getAdapterAddressForMarket(fromAddress);
        const toAddress = swapSelection.from.asset.outputToken || swapSelection.from.asset.address;
        const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
        await approveConn(toAddress, adapterAddressFrom, bigInt, userSigner)
        transaction = await TesserController.withdraw(toAddress, [bigInt], false)
      } else if (swapSelection.from.asset.address === "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"){
        const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
        transaction = await TesserController.depositETH(
          toAddress,
          false,
          {
            value: bigInt
          }
        )
      } else {
        console.log('deposit')
        // deposit or depositOtherTokens
        if (swapSelection.to.asset.inputTokens.includes(fromAddress)) {
          const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
          const adapterAddressTo = await TesserController.getAdapterAddressForMarket(toAddress);
          await approveConn(fromAddress, adapterAddressTo, bigInt, userSigner)
          transaction = await TesserController.deposit(
            toAddress,
            [bigInt],
            false
          )
        } else {
          console.log('depositOtherToken')
          const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
          const adapterAddressTo = await TesserController.getAdapterAddressForMarket(toAddress);
          await approveConn(fromAddress, adapterAddressTo, bigInt, userSigner)
          transaction = await TesserController.deposit(
            toAddress,
            [bigInt],
            false
          )
        }
      }
    } else {
      // withdraw
      const adapterAddressFrom = await TesserController.getAdapterAddressForMarket(fromAddress);
      const toAddress = swapSelection.from.asset.outputToken || swapSelection.from.asset.address;
      const bigInt = '' + (swapSelection.from.value * (10 ** swapSelection.from.asset.decimals))
      await approveConn(toAddress, adapterAddressFrom, bigInt, userSigner)
      transaction = await TesserController.withdraw(toAddress, [bigInt], false)
    }

    const receipt = await transaction.wait()
    if (receipt.status === 1) {
      setTimeout(() => {
        getBalances(tokens, 'tokens')
        getBalances(investments, 'investments')
        setSwapSelection(initState)
      }, 2000);
      
      setTimeout(() => {
        setTesser(false)
        setModal({ state: false })
      }, 1000);
      // refresh data
      
    } else {
      getBalances(tokens, 'tokens')
      getBalances(investments, 'investments')
      setTesser(false)
      setModal({ state: false })
      // refresh data
      setTimeout(() => {
        setSwapSelection(initState)
        
      }, 500);
    }
  }

  const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  const tesseringModal = () => {
    let logoFrom = swapSelection.from.asset?.logo;
    if (!logoFrom) {
      logoFrom = investmentsData.protocols.find(prot => prot.investments.includes(swapSelection.from?.asset?.id))?.logo
    }
    
    let logoTo = swapSelection.to.asset?.logo
    if (!logoTo) {
      logoTo = investmentsData.protocols.find(prot => prot.investments.includes(swapSelection.to.asset?.id))?.logo
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
  const selectionModal = () => {
    return <SelectionModal
        investmentsData={filteredData}
        setSwapAsset={(asset) => setSwapAsset(asset, modal.direction)}
    />
  }
  const filteredData = showStakeDao
    ? {
      tokens: [...tokens],
      protocols: [...investmentsData.protocols].filter(prot => prot.address !== "0x361a5a4993493ce00f61c32d4ecca5512b82ce90"),
      investments: [...investments]
    }
    : {
      tokens: [...tokens],
      protocols: [...investmentsData.protocols],
      investments: [...investments]
    }
  
  const ModalContent = tesserStarted
    ? tesseringModal()
    : selectionModal()
  
  const closeModal = () => {
    if (!tesserStarted) {
      setModal({ state: false, direction: null });
    }
  }

  return (
    <ContainerSt>
      {modal.state && 
        <Modal
          show={modal.state}
          closeModal={() => closeModal()}
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