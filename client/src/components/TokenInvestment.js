/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components'
import React, { useEffect, useState } from 'react';

const ProtocolInvestmentsSt = styled.div`
  width: calc(100% - 10px);
  padding: 5px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  cursor: pointer;
  h4 {
    font-size: 18px;
    font-weight: 500;
    margin: 1px;
    margin-right: 15px;
    margin: auto 10px;
  }
`;

const ProtocolDataSt = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 15px;
  
  img {
    height: 25px;
    width: 25px;
    object-fit: contain;
    margin: auto 0px auto 2px;
  }

  h4 {
    font-size: 18px;
    font-weight: 500;
    margin: 1px;
    margin-right: 15px;
    margin: auto 10px;
  }
`;

const TokenInvestment = ({ investment, onSelect }) => {
  const [image, setImage] = useState(null)
  useEffect(() => {

    if (investment?.logo) {
      import(`../assets/logos/${investment.logo}`).then(img => {
        setImage(img.default)
      });
    }
  }, []);

  return (
    <ProtocolInvestmentsSt
      onClick={() => onSelect(investment.id)}
    >
      {investment && investment.name &&
        <ProtocolDataSt>
          <img src={image} alt="" />
          <h4>{investment.name}</h4>
        </ProtocolDataSt>
      }
      <h4> {Number(investment?.balance).toFixed(4) || '0.0'}</h4>
    </ProtocolInvestmentsSt>
  );
};

export default TokenInvestment;