import styled from 'styled-components'

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



