import React, {useState} from "react";
import styled from "styled-components";
import {
  SearchBar
} from '../components/UI'
import {
  FilterProtocol,
  ProtocolInvestments,
  TokenInvestment
} from '../components'
const ModalTitleSectionSt = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  border-bottom: 1px solid #CCCCCC;

  div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  h3 {
    display: flex;
    flex-direction: row;
    margin: auto 2px;
  }
  h4 {
    font-size: 0.9em;
    margin: 4px;
  }
`;

const ModalContentSt = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 5px;
  margin-top: 5px;
`;

const SelectorSt = styled.h3`
  color: ${({ isActive }) => isActive ? 'red' : 'inherit'};
  text-decoration: ${({ isActive }) => isActive ? 'underline' : 'unset'};
  margin: auto 8px;
  cursor: pointer;
`;

const ModalTitleSt = styled.div`
  display: flex;
  font-size: 0.9em;
  flex-direction: row;
  margin: 5px 0 10px 0;
`;

const SelectionModal = ({investmentsData, setSwapAsset}) => {
  const [entity, setEntity] = useState('tokens')
  const [filter, setFilter] = useState({ protocol: [], search: '' })
  
  let subTitle = 'Available Protocols'
  let title = 'Select a Protocol'

  if (entity === 'tokens') {
    subTitle = 'Your Investments'
    title = 'Select an Investment'
  }

  const setProtocolFilter = (address) => {
    if (filter.protocol.length && filter.protocol.includes(address)) {
      setFilter({
        ...filter,
        protocol: [...filter.protocol.filter(prot => prot !== address)]
      })
    } else {
      setFilter({
        ...filter,
        protocol: [...filter.protocol, address]
      })
    }
  }

  let investments = [...investmentsData.investments];
  let protocols = [...investmentsData.protocols];
  let tokens = [...investmentsData.tokens];

  if (!!filter.search) {
    tokens = tokens.filter(token => token.name.toLowerCase().includes(filter.search.toLowerCase()));
    investments = investments.filter(inv => inv.name.toLowerCase().includes(filter.search.toLowerCase()))
  } else {
    investments = [...investmentsData.investments];
    tokens = [...investmentsData.tokens];
  }

  if (!!filter.protocol.length) {
    protocols = protocols.filter(prot => filter.protocol.includes(prot.address))
  } else {
    protocols = [...investmentsData.protocols]
  }

  // filter resulting asset here and send back cleared asset

  const selectAsset = (assetId) => {
    const asset = investmentsData[entity].find(asset => asset.id === assetId)
    setSwapAsset(asset)
  }

  return (
    <>
      <ModalTitleSectionSt>
        <ModalTitleSt>
          <h3> Select:  </h3>
          <SelectorSt
            isActive={entity === 'tokens'}
            onClick={() => setEntity('tokens')}>
            Token
          </SelectorSt>
            <h3> | </h3>
          <SelectorSt
            isActive={entity === 'investments'}
            onClick={() => setEntity('investments')}>
            Investment
          </SelectorSt>
        </ModalTitleSt>
        <SearchBar
          searchValue={filter.search}
          setSearchValue={(value) => setFilter({
            ...filter,
            search: value
          })}
          list={[]}
          placeholder={title}
        />
        {entity !== 'tokens' &&
          <>
            <h4>{subTitle}</h4>
            <div>
              {investmentsData.protocols.map((protocol, index) => (
                <FilterProtocol
                  key={protocol.address}
                  filterAction={(address) => setProtocolFilter(address)}
                  filterValue={filter.protocol}
                  protocol={protocol}
                  disabled={false}
                />
              ))}
            </div>
          </>
        }
      </ModalTitleSectionSt>
      <ModalContentSt>
        {entity !== 'tokens' && protocols.map(protocol => {
          const filteredInvestments = investments.filter(inv => protocol.investments.includes(inv.id))
          return (
            <ProtocolInvestments
              onSelect={(id) => selectAsset(id)}
              key={protocol.address}
              protocol={protocol}
              investments={filteredInvestments}
            />
          )
        })}
        {entity === 'tokens' && tokens.map(token => (
          <TokenInvestment
            key={token.address}
            onSelect={(id) => selectAsset(id)}
            investment={token}
          />
        ))
        }
      </ModalContentSt>
    </>
  )
}

export default SelectionModal;