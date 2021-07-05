import React from 'react'
import { Button } from './UI'
import Address from './Address'
import styled from 'styled-components'

const AccountSt = styled.div`
  border: 1px solid white;
  width: max-content;
  height: min-content;
  border-radius: 30px;
  padding: 5px 10px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
`;
export default function Account({
  address,
  mainnetProvider,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer
}) {
  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider) {
      modalButtons.push(
        <Button
          key="logoutbutton"
          clickAction={logoutOfWeb3Modal}
        >
          logout
        </Button>,
      );
    } else {
      modalButtons.push(
        <Button
          key="loginbutton"
          clickAction={loadWeb3Modal}
        >
          connect
        </Button>,
      );
    }
  }

  const display = minimized ? (
    ""
  ) : (
    <span style={{ margin: 'auto', marginRight: '20px' }}>
      {address ? ( 
          <Address
            address={address}
            ensProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            fontSize="18px"
            size="short"
          />
      ) : (
        ""
      )}
    </span>
  );

  return (
  <AccountSt>
    {display}
    <div style={{ height: '36px', width: '100px', margin: '0 auto' }}>
      {modalButtons}
    </div>
  </AccountSt>
  )
}