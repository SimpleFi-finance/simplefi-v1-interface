/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { ReactComponent as ArrowDown } from '../assets/svgs/arrow_down.svg';
import React, { useEffect, useState } from 'react';

const AssetSelectorSt = styled.div`
  border-radius: 30px;
  background-color: ${({ isSelected }) => isSelected ? '#A9FBC3' : '#9646C1'};
  display: flex;
  flex-direction: row;
  box-shadow: 0px 6px 16px -4px rgba(0,0,0,0.69);
  height: 40px;
  padding: auto 40px;
  cursor: ${({ connected }) => connected ? 'pointer' : 'not-allowed'};
  opacity: ${({ connected }) => !connected ? '0.5' : '1'};
  span {
    margin: auto 20px;
    color: ${({ isSelected }) => isSelected ? 'black' : 'white'};
    font-weight: 500;
    img {
      margin: auto 2px;
      height: 25px;
      width: 25px;
      object-fit: contain;
      transform: unset;
    }
    svg {
      height: 16px;
      width: 16px;
      padding-top: 2px;
      margin: auto;
      margin-left: 15px;
      color: inherit;
      fill: currentColor;
    }
    p {
      color:  black;
      margin: auto 5px;
    }
  }
`;

const AssetSelector = ({ currentAsset, clickAction, provider }) => {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (currentAsset?.logo) {
      import(`../assets/logos/${currentAsset.logo}`).then(img => {
        setImage(img.default)
      });
    }
  }, [currentAsset]);

  const text = 'Select'
  return (
    <AssetSelectorSt
      connected={!!provider}
      isSelected={!!currentAsset?.name}
      onClick={() => { return provider ? clickAction() : null }}
    >
      {!currentAsset?.symbol
        ? <span> {text} <ArrowDown /></span>
        :
        <span>
          {currentAsset.logo && <img src={image} alt=""></img>}
          <p>{currentAsset.symbol}</p>
          <ArrowDown />
        </span>
      }
    </AssetSelectorSt>
  );
}

export default AssetSelector