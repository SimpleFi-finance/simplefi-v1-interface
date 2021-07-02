import styled from 'styled-components'

const NavBar = styled.div`
  height: 70px;
  width: calc(100% - 40px);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 5px 20px;
  
  h2 {
    padding: 0;
    margin: auto 0;
    color: darkviolet;
    font-style: italic;
    letter-spacing: 1px;
    font-size: 1.6em;
  }

  img {
    height: 60px;
    object-fit: contain;
  }
`;

export default NavBar;