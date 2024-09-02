const ACTIVE_CLASS = 'is-active';
const LOCKED_CLASS = 'is-locked';


const selectors = {
  openModal: '[js-modal-trigger]',
  closeModal: '[js-modal-close]',
  modal: '[js-modal]',
  modalContent: '[js-modal-content]'
};


const nodeElements = {
  modal: document.querySelector(selectors.modal),
};


function setEventListeners() {
  document.body.addEventListener('click', (e) => {
    if (!nodeElements.modal) return;

    const openPopupTarget = e.target.closest(selectors.openModal);
    const closePopupTarget = e.target.closest(selectors.closeModal);
    const modalContentTarget = e.target.closest(selectors.modalContent);

    const isOpened = Boolean(
      nodeElements.modal.classList.contains(ACTIVE_CLASS)
    );

    if (openPopupTarget && !isOpened) {
      openModal();
      return;
    }

    if (
      isOpened &&
      (closePopupTarget ||
      (!closePopupTarget && !modalContentTarget))
    ) {
      closeModal();
      return;
    }
  });
}


function openModal() {
  nodeElements.modal?.classList.add(ACTIVE_CLASS);
  document.body.classList.add(LOCKED_CLASS);

  setScrollBarWidth();
}


function closeModal() {
  nodeElements.modal?.classList.remove(ACTIVE_CLASS);
  document.body.classList.remove(LOCKED_CLASS);
}

function setScrollBarWidth() {

  const scrollbarWidth = window.innerWidth - document.body.clientWidth;

  document.documentElement.style.setProperty(
    '--body-scroll-bar-width',
    `${scrollbarWidth}px`
  );
}


window.addEventListener('DOMContentLoaded', () => {
  setScrollBarWidth();
  setEventListeners();
});