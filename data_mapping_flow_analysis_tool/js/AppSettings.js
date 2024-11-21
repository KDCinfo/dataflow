import AppConfig from './AppConfig.js';
import AppConstants from './appConstants.js';
import AppData from './AppData.js';
import { dataDefaultApp } from './dataDefaultApp.js';
import FileHandler from './FileHandler.js';

export default class AppSettings {
  //
  // Initialize class instance properties.
  //

  // The 'uiElements' object contains all the UI elements that the app interacts with.
  //
  uiElements;

  // These are the overall app settings, which allow for the retrieval of individual clumpLists.
  //
  // defaultAppSettings: {
  //   gridRepeatRangeValue: 2,
  //   storageNames: ['default'], // camelCase or snake_case.
  //   storageIndex: 0
  // }
  //
  appSettingsInfo;

  // The 'dataManager' maintains intrinsic properties based on which 'clumpList' is loaded.
  //
  // export default class AppData {
  //   #appSettingsInfo;
  //   editingIndex; // = null;  // Track if we’re editing an existing clump
  //   lastAddedCol; // = 1;
  //   lastAddedClumpId; // = 0;
  //   localStorageKeyForClumps; // = storageNames[settings.storageIndex] || 'dataClumpFlowAppClumps';
  //   clumpList; // = JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');
  //   clumpMatrix; // = [];
  //
  dataManager;

  constructor(uiSelectors) {
    this.uiElements = this.resolveSelectors(uiSelectors);
    this.appSettingsInfo = this.getJsonSettingsFromStorageOrDefaults();
    this.dataManager = new AppData(
      this.appSettingsInfo
    );

    // Initialize event listeners.
    //
    this.initEventListeners();
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

  getJsonSettingsFromStorageOrDefaults() {
    return JSON.parse(
      localStorage.getItem(AppConstants.localStorageSettingsKey) ||
      JSON.stringify(dataDefaultApp.defaultAppSettings)
    );
  }

  initEventListeners() {
    //
    // EVENT LISTENERS
    //

    // Add listeners to enable 'Save Clump' button when 'clump name' and 'code clump' are not empty.
    this.uiElements.clumpNameInput.addEventListener('input', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    }).bind(this);
    this.uiElements.clumpCodeInput.addEventListener('input', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    }).bind(this);
    this.uiElements.linkTo.addEventListener('change', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.columnSelect.disabled = false;
      } else {
        this.uiElements.columnSelect.disabled = true;
      }
    }).bind(this);
    this.uiElements.columnSelect.addEventListener('change', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    }).bind(this);

    // Listener on 'newStorageNameInput' field to check if the 'New Storage' button should be bold.
    this.uiElements.newStorageNameInput.addEventListener('input', this.checkNewStorageButton.bind(this));
    this.uiElements.storageNameTag.addEventListener('change', this.toggleStorageButtons.bind(this));

    this.uiElements.exportDataButton.addEventListener('click', this.handleExportData.bind(this));
    this.uiElements.importDataButton.addEventListener('click', this.handleImportData.bind(this));
  }

  handleExportData() {
    FileHandler.handleExportData(this.dataManager.getData('clumpList'));
  }

  handleImportData() {
    const importedDataArray = FileHandler.handleImportData();
    if (
      typeof importedDataArray !== 'undefined' &&
      Array.isArray(importedDataArray) &&
      importedDataArray.length > 0
    ) {
      // Update data.
      this.dataManager.importAppData(
        importedDataArray, // importedClumps
        null, // updatedEditingIndex
        this.dataDefaultApp.lastAddedCol,
        this.dataDefaultApp.lastAddedClumpId
      );

      // Update UI.
      this.uiElements.clumpFormId.reset();
      this.uiElements.outputContainer.style.marginBottom = '0';
      this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
      this.updateDataInHtml();
      this.renderMatrix();
    }
  }

  //
  // @TODO: Extract these into a base 'UIInterface' class that can be extended.
  //        May need to rethink how to shape these classes based on
  //        where the data should reside based on where it is used most.
  //

  // Regular expression (regex) to validate storage names.
  // Also checks if the name is already in the list.
  isValidKeyName(keyName) {
    // Validate the new storage name, and check new name isn't already in the list.
    if (keyName === '') {
      this.dataManager.setData('storageNameErrorText', AppConstants.storageNameErrTextNameEmpty);
    } else if (!AppConstants.keyNamePattern.test(keyName)) {
      this.dataManager.setData('storageNameErrorText', AppConstants.storageNameErrTextInvalid);
    } else if (this.checkIfStorageNameExists(keyName)) {
      this.dataManager.setData('storageNameErrorText', AppConstants.storageNameErrTextNameExists);
    } else {
      this.dataManager.setData('storageNameErrorText', '');
    }
    // return keyName !== '' && keyNamePattern.test(keyName) && !checkIfStorageNameExists(keyName);
    return this.dataManager.getData('storageNameErrorText') === '';
  }

  checkIfStorageNameExists(keyName) {
    // return storageNames.includes(keyName);
    // 'includes' is case-sensitive, so we need to lowercase all the names.
    return this.appSettingsInfo.storageNames.map(name => name.toLowerCase()).includes(keyName.toLowerCase());
  }

  hideStorageError() {
    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.classListChain(this.uiElements.storageNamingError)
        .remove('error-visible')
        .add('error-hidden');
    }
    setTimeout(() => {
      this.uiElements.storageNamingError.innerHTML = '';
    }, 250);
  }

  // Many thanks to: https://stackoverflow.com/a/29143197/638153 | user663031
  classListChain(htmlElement) {
    var elementClassList = htmlElement.classList;
    return {
      toggle: function (c) { elementClassList.toggle(c); return this; },
      add: function (c) { elementClassList.add(c); return this; },
      remove: function (c) { elementClassList.remove(c); return this; }
    };
  }

  storeSettings() {
    localStorage.setItem(
      AppConstants.localStorageSettingsKey,
      JSON.stringify(this.appSettingsInfo)
    );
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for the storage settings.
  //

  // Function to bold 'New Storage' button text if the 'newStorageNameInput' value is valid.
  checkNewStorageButton() {
    const newStorageNameValue = this.uiElements.newStorageNameInput.value.trim();
    const isValid = this.isValidKeyName(newStorageNameValue);
    // Make button text bold.
    this.uiElements.newStorageNameButton.style.fontWeight = isValid ? 'bold' : 'normal';
    // Change button's cursor.
    this.uiElements.newStorageNameButton.style.cursor = isValid ? 'pointer' : 'default';

    if (isValid) {
      this.hideStorageError();
    }
  }

  // - If the selected storage name is:
  // - 'default':
  //   - Disable 'Delete Selected'.
  // - the currently active storage name:
  //   - Disable both buttons.
  toggleStorageButtons() {
    const selectedIndex = this.uiElements.storageNameTag.selectedIndex;
    const selectedStorageName = this.appSettingsInfo.storageNames[selectedIndex];

    const isDefault = selectedStorageName === 'default';
    const isActive = selectedIndex === this.appSettingsInfo.storageIndex;

    this.uiElements.storageButtonDelete.disabled = isDefault || isActive;
    this.uiElements.storageButtonUse.disabled = isActive;
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for the grid repeat setting.
  //

  convertGridRepeatSettingValueToCellWidth(curGridRepeat = settings.gridRepeatRangeValue) {
    AppConfig.debugConsoleLogs && console.log('curGridRepeat:', curGridRepeat);

    // const gridRepeatOptions = ['auto', '1fr', '150px', '200px', '250px', '300px'];
    const curGridRepeatRangeValue = AppConstants.gridRepeatOptions[parseInt(curGridRepeat, 10) - 1];
    // const curGridRepeatRangeValue = curGridRepeat === "1"
    //   ? gridRepeatOptions[0] : curGridRepeat === "2"
    //     ? gridRepeatOptions[1] : `${50 * curGridRepeat}px`; // This was cool.
    AppConfig.debugConsoleLogs && console.log('curGridRepeatRangeValue:', curGridRepeatRangeValue);

    return curGridRepeatRangeValue;
  }

  // HTML Slider with options that will update the grid repeat:
  // > ['auto', '1fr', '150px', '200px', '250px', '300px']
  //
  updateGridRepeat(event) {
    const newGridRepeat = event.target.value;
    const cellWidth = this.convertGridRepeatSettingValueToCellWidth(newGridRepeat);
    const columnCount = this.dataManager.getColumnCount();

    // Make changes to the UI.
    this.uiElements.clumpContainer.style.gridTemplateColumns = `repeat(${columnCount}, ${cellWidth})`;

    // Update the grid repeat slider label.
    this.uiElements.gridRepeatHTMLSpan.textContent = `[${newGridRepeat}] ${cellWidth}`;

    // Store the new setting.
    this.appSettingsInfo.gridRepeatRangeValue = newGridRepeat;
    this.storeSettings();
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for the data output.
  //

  updateDataInHtml() {
    // Last added Clump ID.
    this.uiElements.lastAddedClumpIdTag.textContent = this.dataManager.lastAddedClumpId.toString();

    // Last column a clump was added to.
    this.uiElements.lastAddedColTag.textContent = this.dataManager.lastAddedCol.toString();

    // Currently edited clump index and ID.
    const currentEditingIndex = this.dataManager.editingIndex;
    this.uiElements.editingIndexTag.textContent = currentEditingIndex === null
      ? '_'
      : currentEditingIndex.toString();
    this.uiElements.editingIdTag.textContent = currentEditingIndex === null
      ? '_'
      : clumpList[currentEditingIndex].id.toString();
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for dropdowns.
  //

  updateLinkToDropdownOptions() {
    this.uiElements.linkTo.innerHTML = '<option value="">None</option>';

    // This loop extrapolates in-use linkTo IDs so they are not
    // shown in the dropdown (because they're already linked to).
    const thisDataManager = this.dataManager;
    const linkedClumpIDs = thisDataManager.clumpList.map(clump => clump.linkedClumpID);
    thisDataManager.clumpList.forEach((clump, index) => {
      // If the clump is not the one being edited, or it is not already linked.
      if (thisDataManager.editingIndex !== index || !linkedClumpIDs.includes(clump.id)) {
        const option = document.createElement('option');
        option.value = clump.id;
        option.textContent = clump.clumpName;
        this.uiElements.linkTo.appendChild(option);
      }
    });
    this.uiElements.linkTo.disabled = thisDataManager.editingIndex !== null;
  }

  updateColumnSelectDropdownOptions() {
    this.uiElements.columnSelect.innerHTML = '<option value="last">Last Column</option>';

    // Using 'clumpMatrix', this will yield a list of available columns
    // (which the UI uses for the 'Column to Add To' dropdown).
    const thisDataManager = this.dataManager;
    const columns = thisDataManager.clumpMatrix.length > 0
      ? Array.from({ length: thisDataManager.clumpMatrix[0].length }, (_, index) => index + 1)
      : [1];
    columns.forEach(column => {
      const option = document.createElement('option');
      option.value = column;
      option.textContent = `Column ${column}`;
      this.uiElements.columnSelect.appendChild(option);
    });
    this.uiElements.columnSelect.disabled = thisDataManager.editingIndex !== null;
  }

  updateStorageNameDropdownOptions() {
    this.uiElements.storageNameTag.innerHTML = '';

    this.appSettingsInfo.storageNames.forEach((storageName, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = storageName;
      if (index === settings.storageIndex) {
        option.selected = true;
      }
      this.uiElements.storageNameTag.appendChild(option);
    });
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
  //   // Assume we have data in 'dataManager' to display in the UI
  //   this.uiElements.label.textContent = this.dataManager.getData('labelContent') || 'Default content';
  // }
  // updateSetting(newSetting) {
  //   // Update the state and UI as necessary
  // }
}
