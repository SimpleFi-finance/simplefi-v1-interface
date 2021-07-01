import React from 'react'
import { Button } from './UI'
import Address from './Address'
import styled from 'styled-components'

const AccountSt = styled.div`
  border: 1px solid darkviolet;
  width: max-content;
  height: min-content;
  border-radius: 40px;
  padding: 10px 20px;
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
          type="error"
          style={{ margin: 'auto' }}
        >
          logout
        </Button>,
      );
    } else {
      modalButtons.push(
        <Button
          key="loginbutton"
          clickAction={loadWeb3Modal}
          style={{ margin: 'auto' }}
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
    <div style={{ height: '40px', width: '100px', margin: 'auto' }}>
      {modalButtons}
    </div>
  </AccountSt>
  )
}