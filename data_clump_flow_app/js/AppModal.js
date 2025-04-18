// A modal for showing the Project Flow Manager (or other such modals in the future).
//
// Starting inspiration: https://www.w3schools.com/howto/howto_css_modals.asp
//
export default class AppModal {
  constructor(appModal, appModalBtn, modalCloseButton) {
    this.appModal = appModal;
    this.appModalBtn = appModalBtn;
    this.modalCloseButton = modalCloseButton;

    // Bind event listeners
    //
    // When the user clicks on the button, open the modal
    this.appModalBtn.onclick = () => {
      this.appModal.style.display = 'block';
    }

    // When the user clicks on <span> (x), close the modal
    this.modalCloseButton.onclick = () => {
      this.appModal.style.display = 'none';
    }

    // When the user clicks anywhere outside of the modal, close it
    // Using 'onclick' would overwrite any existing window event listeners.
    // window.onclick = function(event) {}
    window.addEventListener('click', (event) => {
      if (event.target === this.appModal) {
        this.appModal.style.display = 'none';
      }
    });
  }

  // Getter for if modal is open.
  get isOpen() {
    return this.appModal.style.display === 'block';
  }

  // Close the modal.
  close() {
    this.appModal.style.display = 'none';
  }

  // Get the modal.
  appModal;

  // Get the button that opens the modal.
  appModalBtn;

  // Get the element that closes the modal.
  // span = document.getElementsByClassName('close')[0];
  modalCloseButton;
}
