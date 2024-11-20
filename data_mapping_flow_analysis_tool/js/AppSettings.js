import AppConstants from './appConstants.js';
import AppData from './AppData.js';
import { dataDefaultApp } from './dataDefaultApp.js';

export default class AppSettings {
  constructor(uiSelectors) {
    // // this.label = uiElements.label;
    // this.button = uiElements.button;
    // this.button.addEventListener('click', this.handleButtonClick.bind(this));
    // // Other UI elements

    // this.clumpContainer = document.querySelector(uiConfig.clumpContainer);
    // this.clumpName = document.querySelector(uiConfig.clumpName);

    // this.uiElements = uiElements;
    this.uiElements = this.resolveSelectors(uiSelectors);

    let appSettings = this.getJsonSettingsFromStorage();

    this.dataManager = new AppData(appSettings);
    this.initEventListeners();
  }

  getJsonSettingsFromStorage() {
    return JSON.parse(
      localStorage.getItem(AppConstants.localStorageSettingsKey) ||
      JSON.stringify(dataDefaultApp.defaultAppSettings)
    );
  }

  initEventListeners() {
    // this.uiElements.button.addEventListener('click', () => this.handleButtonClick());
  }

  resolveSelectors(selectors) {
    const resolved = {};
    for (const [key, value] of Object.entries(selectors)) {
      resolved[key] = typeof value === 'string'
        ? document.querySelector(value)
        : this.resolveSelectors(value);
    }
    return resolved;
  }

  // handleButtonClick() {
  //   // Logic for button click
  //   // this.uiElements.label.textContent = 'Button clicked!';
  //   this.uiElements.label.textContent = AppHelpers.formatDate(new Date());
  // }
  // async loadData(url) {
  //   await this.dataManager.fetchData(url);
  //   this.updateUIWithData();
  // }
  // updateUIWithData() {
  //   // Assume we have data in `dataManager` to display in the UI
  //   this.uiElements.label.textContent = this.dataManager.getData('labelContent') || 'Default content';
  // }
  // updateSetting(newSetting) {
  //   // Update the state and UI as necessary
  // }
}
