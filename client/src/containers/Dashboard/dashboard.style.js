import styled, {keyframes} from 'styled-components'

export const FeatureSt = styled.div`
  height: auto;
  min-height: 100px;
  width: 80%;
  max-width: 700px;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  margin: auto;
  padding: 20px;
  background-color: #FFFEFE;
  box-shadow: 0px 6px 16px -4px rgba(0,0,0,0.69);
  h3 {
    margin: 2px 10px 15px;
    letter-spacing: 1px;
    font-size: 1.5em;
  }
  span {
    display: flex;
    flex-direction: row;
    font-weight: bold;
    font-size: 1.1em;
  }
  img {
    height: 30px;
    width: 30px;
    object-fit: contain;
    margin: 10px auto;
    transform: rotate(90deg);
  }
`;

export const TitleSt = styled.h2`
  font-weight: bold;
  margin: auto 0 15px 15px;
  font-size: 1.4em;
`;
const drop = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0;
  }
  1% {
    opacity: 1;
  }
  90% {
    opacity: 0;
  }
  100% {
    transform: translateY(250px) rotate(360deg);
    opacity: 0;
  }
`
export const TesserModalSt = styled.div`
  position: relative;
  background-image: radial-gradient(circle, #5F40C4 0%, #9646C1 100%);
  height: 400px;
  width: 100%;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  span {
    z-index: 2;
    width: max-content;
    min-width: 50px;
    height: 40px;
    margin: auto;
    background-color: white;
    border-radius: 20px;
    padding: 10px;
    display: flex;
    justify-content: center;
    vertical-align: center;
    box-shadow: 0px 6px 16px -4px rgba(0,0,0,0.69);
    p {
      margin: auto;
      height: 20px;
    }
  }
`;

export const MovingIconSt = styled.div`
  position: absolute;
  z-index: 1;
  animation: ${drop} 2s ease-in infinite;
  height: max-content;
  width: max-content;
  top: ${({topValue}) => topValue}%;
  left: ${({leftValue}) => leftValue}%;
  animation-delay: ${({ delay }) => `${delay || 0}s`};
`;
