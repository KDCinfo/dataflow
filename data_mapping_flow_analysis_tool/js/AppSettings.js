import AppData from './AppData.js';
import AppHelpers from './AppHelpers.js';

export default class AppSettings {
  constructor(uiElements, initialData = {}, uiConfig) {
    // // this.label = uiElements.label;
    // this.button = uiElements.button;
    // this.button.addEventListener('click', this.handleButtonClick.bind(this));
    // // Other UI elements

    // this.clumpContainer = document.querySelector(uiConfig.clumpContainer);
    // this.clumpName = document.querySelector(uiConfig.clumpName);
    this.uiElements = uiElements;

    this.dataManager = new AppData(initialData); // Dependency injection
    this.initEventListeners();
  }

  initEventListeners() {
    this.uiElements.button.addEventListener('click', () => this.handleButtonClick());
  }

  handleButtonClick() {
    // Logic for button click
    // this.uiElements.label.textContent = 'Button clicked!';
    this.uiElements.label.textContent = AppHelpers.formatDate(new Date());
  }

  async loadData(url) {
    await this.dataManager.fetchData(url);
    this.updateUIWithData();
  }

  updateUIWithData() {
    // Assume we have data in `dataManager` to display in the UI
    this.uiElements.label.textContent = this.dataManager.getData('labelContent') || 'Default content';
  }

  updateSetting(newSetting) {
    // Update the state and UI as necessary
  }
}
