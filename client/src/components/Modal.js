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
  opacity: ${({ show }) => !!show ? '0.7' : '0'};
  transition: opacity 01s;
`;

const ModalSt = styled.div`
  position: absolute;
  top: 20%;
  left: calc(50% - 300px);
  width: 80%;
  max-width: 600px;
  height: max-content;
  max-height: 70%;
  background-color: white;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  z-index: 3;
  opacity: ${({ show }) => !!show ? '1' : '0'};
  transition: opacity 1s;
`;

const Modal = ({ show, closeModal, content }) => {
  
  return (
    <>
      <OverlaySt
        show={show}
        onClick={() => closeModal()}
      >
      </OverlaySt>
      <ModalSt show={show}>
        
        {content}
      </ModalSt>
    </>
  );
};

export default Modal;