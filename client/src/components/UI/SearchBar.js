import styled from 'styled-components';

const SearchBarSt = styled.input`
  width: calc(100% - 20px);
  height: 40px;
  border-radius: 20px;
  border: 1px solid #FF5C79;
  font-size: 18px;
  padding: 0 10px;
  margin-bottom: 10px;
  &:focus{
    outline: none;
  }
`;

const SearchBar = ({searchValue, list, placeholder, setSearchValue}) => {
  return (
    <SearchBarSt
      type='text'
      list={list}
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      placeholder={placeholder.replace('Select', 'Search') + '...'}
    />
  );
};

export default SearchBar;