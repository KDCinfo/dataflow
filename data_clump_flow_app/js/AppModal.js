// A modal for showing the Project Flow Manager (or other such modals in the future).
//
// Starting inspiration: https://www.w3schools.com/howto/howto_css_modals.asp
//
export default class AppModal {
  constructor({
    appModal,
    appModalBtn,
    modalCloseButton,
    newStorageNameInput = null,
    clumpNameInput = null,
    appModalBtnAlt = null,
  }) {
    this.appModal = appModal;
    this.appModalBtn = appModalBtn;
    this.appModalBtnAlt = appModalBtnAlt;
    this.modalCloseButton = modalCloseButton;
    this.newStorageNameInput = newStorageNameInput;
    this.clumpNameInput = clumpNameInput;

    // Bind event listeners
    //
    // Primary 'open modal' button.
    this.appModalBtn.onclick = () => {
      this.modalOpen();
    }
    // If an alternative 'open modal' reference is provided, bind it as well.
    if (this.appModalBtnAlt) {
      this.appModalBtnAlt.onclick = () => {
        this.modalOpen();
      };
    }

    // When the user clicks on <span> (x), close the modal.
    this.modalCloseButton.onclick = () => {
      this.modalClose();
    }

    // When the user clicks anywhere outside of the modal, close it
    // Using 'onclick' would overwrite any existing window event listeners.
    // window.onclick = function(event) {}
    window.addEventListener('click', (event) => {
      if (event.target === this.appModal) {
        this.modalClose();
      }
    });
  }

  // Toggle classes: modal-content-anim in/out.
  modalOpen() {
    this.appModal.classList.remove('modal-content-animout');
    this.appModal.style.display = 'block';
    this.appModal.classList.add('modal-content-animin');

    if (this.newStorageNameInput) {
      // Wait for animation to finish before opening.
      setTimeout(() => {
        this.newStorageNameInput.focus();
      }, 500);
    }
  }
  modalClose() {
    this.appModal.classList.remove('modal-content-animin');
    this.appModal.classList.add('modal-content-animout');
    // Wait for animation to finish before closing.
    const onAnimEnd = () => {
      this.appModal.style.display = 'none';
      this.appModal.removeEventListener('animationend', onAnimEnd);

      if (this.clumpNameInput) {
        this.clumpNameInput.focus();
      }
    };
    this.appModal.addEventListener('animationend', onAnimEnd);
  }

  // Getter for if modal is open.
  get isOpen() {
    return this.appModal.style.display === 'block';
  }

  // Get the modal.
  appModal;

  // Get the button that opens the modal.
  appModalBtn;
  appModalBtnAlt;

  // Get the element that closes the modal.
  // span = document.getElementsByClassName('close')[0];
  modalCloseButton;

  // Element to set focus on when the modal is opened.
  newStorageNameInput;
  clumpNameInput;
}
