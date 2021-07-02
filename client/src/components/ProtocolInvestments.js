/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components'
import React, { useEffect, useState } from 'react';

const ProtocolInvestmentsSt = styled.div`
  width: calc(100% - 10px);
  padding: 5px;
  margin-bottom: 10px;
`;

const ProtocolDataSt = styled.div`
  display: flex;
  flex-direction: row;
  color: #888888;
  margin-bottom: 15px;
  img {
    height: 20px;
    width: 20px;
    object-fit: contain;
    margin: auto 0px auto 2px;
  }
  p {
    font-size: 14px;
    margin: auto 4px;
  }
`;

const InvestmentSt = styled.div`
  width: calc(100% - 25px);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 10px 0px 0px 25px;
  cursor: pointer;
  div {
    display: flex;
    flex-direction: column;
    h4 {
      font-size: 18px;
      font-weight: 500;
      margin: 1px;
    }
    p{
      font-size: 12px;
      color: #888888;
      margin: 1px;
    }
  }
  h4 {
    font-size: 18px;
    font-weight: 500;
    margin: 1px;
    margin-right: 15px;
  }
`;

const ProtocolInvestments = ({ protocol, investments, onSelect }) => {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (protocol?.logo) {
      import(`../assets/logos/${protocol.logo}`).then(img => {
        setImage(img.default)
      });
    }
  }, []);

  return (
    <ProtocolInvestmentsSt>
      {protocol && protocol.name &&
        <ProtocolDataSt>
          <img src={image} alt="" />
          <p>{protocol.name}</p>
        </ProtocolDataSt>
      }
      {investments.map(inv => (
        <InvestmentSt
          key={inv.id}
          onClick={() => onSelect(inv.id)}
        >
          <div>
            <h4>{inv.name}</h4>
            {inv.description && <p>{inv.description}</p>}
          </div>
          <h4> {Number(inv.balance).toFixed(4) || '0.0'}</h4>
        </InvestmentSt>
      ))}
    </ProtocolInvestmentsSt>
  );
};

export default ProtocolInvestments;