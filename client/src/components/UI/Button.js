import React from 'react'
import styled from 'styled-components'
import { Tooltip } from 'antd'

const ButtonSt = styled.button`
  all: unset;
  border-radius: 30px;
  padding: 5px 20px;
  margin: 2px;
  background-color: ${({ type }) => type === 'error' ? 'red' : 'blue'};
  width: calc(100% - 44px);
  height: calc(100% - 14px);
  align-content: center;
  text-align: center;
  border: 1px solid lightgrey;
  cursor: pointer;
  color: white;
  font-size: inherit;
  &:hover{
    background-color: ${({ type }) => type === 'error' ? 'darkred' : 'darkblue'};;
    border: 1px solid white;
    color: white;
  }
  &:disabled {
    background-color: #CCCCCC;
    cursor: not-allowed;
  }
`;

export default function Button({
  clickAction,
  children,
  tooltip,
  type,
  disable
}) {
  return (
    <>
      {tooltip
        ?
        <Tooltip placement="Bottom" title={tooltip}>
          <ButtonSt
            disabled={disable}
            type={type}
            onClick={clickAction}
          >
            {children}
          </ButtonSt>
        </Tooltip>
        :
        <ButtonSt
          onClick={clickAction}
          type={type}
          disabled={disable}
        > 
          {children}
        </ButtonSt>
      }
    </>
  )
}