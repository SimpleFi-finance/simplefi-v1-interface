import styled from 'styled-components';
import React, { useEffect, useState } from 'react';

const FilterSt = styled.button`
  all: unset;
  border-radius: 10px;
  padding: 2px;
  margin: 5px;
  height: 30px;
  border: 1px solid ${({isActive}) => isActive ? '#FF5C79' : '#CCCCCC'};
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: min-content;
  cursor: pointer;
  img {
    height: 100%;
    width: 25px;
    margin: auto 4px;
    object-fit: contain;
  }
  p {
    margin: auto 4px;
  }
  &:hover {
    border: 1px solid #FF5C79;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    &:hover {
      border: 1px solid #CCCCCC;
    }
  }
`;

const ProtocolFilter = ({filterAction, filterValue, protocol, disabled}) => {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (protocol.logo) {
      import(`../assets/logos/${protocol.logo}`).then(img => {
        setImage(img.default)
      });
    }
  }, [protocol]);
  
  return (
    <FilterSt
      disabled={disabled}
      onClick={() => filterAction(protocol.address)}
      isActive={filterValue && filterValue.includes(protocol.address)}
    >
      <img src={image} alt=""/>
      <p>{protocol.name}</p>
    </FilterSt>
  );
};

export default ProtocolFilter;