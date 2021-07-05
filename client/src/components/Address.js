import { Skeleton } from "antd";
import React from "react";
import Blockies from "react-blockies";
import { useLookupAddress } from "../utils/hooks";

const blockExplorerLink = (address, blockExplorer) =>
  `${blockExplorer || "https://etherscan.io/"}${"address/"}${address}`;

export default function Address(props) {
  const ens = useLookupAddress(props.ensProvider, props.address);
  if (!props.address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  let displayAddress = props.address.substr(0, 6);

  if (ens && ens.indexOf("0x") < 0) {
    displayAddress = ens;
  } else if (props.size === "short") {
    displayAddress += "..." + props.address.substr(-4);
  } else if (props.size === "long") {
    displayAddress = props.address;
  }

  const etherscanLink = blockExplorerLink(props.address, props.blockExplorer);

  if (props.minimized) {
    return (
      <span style={{ verticalAlign: "middle" }}>
        <a
          target="_blank"
          href={etherscanLink}
          rel="noopener noreferrer"
        >
          <Blockies seed={props.address.toLowerCase()} size={8} scale={2} />
        </a>
      </span>
    );
  }

  let text;
  if (props.onChange) {
    text = (
      <span>
        <a
          target="_blank"
          href={etherscanLink}
          rel="noopener noreferrer"
          style={{color: 'white'}}
        >
          {displayAddress}
        </a>
      </span>
    );
  } else {
    text = (
      <span>
        <a
          target="_blank"
          href={etherscanLink}
          rel="noopener noreferrer"
          style={{color: 'white'}}
        >
          {displayAddress}
        </a>
      </span>
    );
  }

  return (
    <>
      <span style={{ verticalAlign: "middle" }}>
        <Blockies
          seed={props.address.toLowerCase()}
          size={6}
          scale={props.fontSize
            ? props.fontSize / 7
            : 4
          }
        />
      </span>
      <span style={{
        verticalAlign: "middle",
        paddingLeft: 5,
        margin: 'auto',
        color: 'white',
        fontSize: props.fontSize
          ? props.fontSize
          : 28
      }}>
        {text}
      </span>
    </>
  );
}
