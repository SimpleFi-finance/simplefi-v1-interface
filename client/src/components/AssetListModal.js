import styled from 'styled-components';

const OverlaySt = styled.div`
  position:absolute;
  top: 0;
  left: 0;
  opacity: 0.7;
  background-color: gray;
  z-index: 2;
  height: 100%;
  width: 100%;
`;

const ModalSt = styled.div`
  position: absolute;
  top: 25%;
  left: calc(25% - 10px);
  width: 50%;
  height: 60%;
  background-color: white;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 10px;
  z-index: 3;
`;

const AssetsList = ({closeModal, content}) => {
  return (
    <>
      <OverlaySt
        onClick={() => closeModal()}
      >
      </OverlaySt>
      <ModalSt>
        {content}
      </ModalSt>
    </>
  );
};

export default AssetsList;