import { ethers } from 'ethers';

let provider = new ethers.providers.InfuraProvider('homestead', process.env.REACT_APP_INFURA_PROJECT_ID)
if (window.ethereum && window.ethereum.isMetaMask) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
}

export default provider;