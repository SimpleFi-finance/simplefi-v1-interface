import React from 'react';
import {
  ContainerSt
} from '../../components/UI';
import styled from 'styled-components'

const ButtonSt = styled.button`
  all: unset;
  width: 300px;
  height: 60px;
  border-radius: 40px;
  font-size: 1.3em;
  border: 1px solid darkviolet;
  background-color: white;
  text-align: center;
  color: darkviolet;
  transition: 0.6s all;

  &:hover {
    border: 1px solid white;
    background-color: darkviolet;
    color: white;
  }
`;

const Landing = ({ history, loadWeb3Modal }) => {
  return (
    <ContainerSt>
      <ButtonSt style={{ margin: 'auto', cursor: 'pointer' }} onClick={() => loadWeb3Modal() }>Enter dApp</ButtonSt>
    </ContainerSt>
  )
}

export default Landing;