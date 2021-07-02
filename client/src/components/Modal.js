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
`;

const Modal = ({closeModal, content}) => {
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

export default Modal;