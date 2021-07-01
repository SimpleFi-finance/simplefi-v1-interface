import styled from "styled-components";
import AssetSelector from "./AssetSelector";

const AssetSt = styled.div`
  border-radius: 30px;
  background-color: #F7F8FA;
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  margin: 10px;
  height: 80px;
  width: calc(100% - 60px);
  border: 1px solid #F7F8F9;

  div { 
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const AmountSwap = styled.input`
  all: unset;
  width: 250px;
  text-align: right;
  height: 30px;
  color: black;
  font-size: 1.5em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  &::placeholder {
    color: #B5B8BD;
    letter-spacing: 1px;
  }
`;

const BalanceSelector = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  p {
    margin: 0px;
    margin-left: 10px;
    margin-top: 20px;
    color: #747782;
    font-size: 16px;
  }
  div {
    margin-top: 20px;
    button {
      all: unset;
      cursor: pointer;
      margin: auto 5px;
      color: #747782;
      font-size: 16px;
    }
    p {
      margin: auto 0;
      color: #747782;
      font-size: 16px;
    }
  }
`;

const AssetBalance = ({ asset, clickAction, swapAmount, setSwapAmount }) => {

  return (
    <AssetSt>
      <div>
        <AssetSelector
          currentAsset={asset}
          clickAction={clickAction}
        />
        <AmountSwap
          type='number'
          onChange={(e) => setSwapAmount(e.target.value)}
          value={swapAmount || '0.0'}
          min="0.00"
          max={asset.balance}
          placeholder="0.0"
        >
        </AmountSwap>
      </div>
      {asset?.name &&
        <BalanceSelector>
          <p>Balance: {asset.balance || '0.0'} {asset.symbol}</p>
          <div>
            <button onClick={() => setSwapAmount(asset.balance * 0.25) }>25%</button>
            <p>|</p>
            <button onClick={() => setSwapAmount(asset.balance * 0.50) }>50%</button>
            <p>|</p>
            <button onClick={() => setSwapAmount(asset.balance * 0.75) }>75%</button>
            <p>|</p>
            <button onClick={() => setSwapAmount(asset.balance * 1) }>max</button>
        </div>
        </BalanceSelector>
      }
    </AssetSt>
  );
}

export default AssetBalance;