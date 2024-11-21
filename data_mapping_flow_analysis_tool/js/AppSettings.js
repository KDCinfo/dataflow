import AppConfig from './AppConfig.js';
import AppConstants from './AppConstants.js';
import AppData from './AppData.js';
import AppHelpers from './AppHelper.js';
import ClumpInfo from './ClumpInfo.js';
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

    // Initial render call
    this.renderMatrix();
  }

  resolveSelectors(selectors) {
    const resolved = {};
    const uiConfigKeys = Object.keys(selectors);
    for (const configKey of uiConfigKeys) {
      for (const [key, value] of Object.entries(selectors[configKey])) {
        resolved[key] = typeof value === 'string'
          ? document.querySelector(value)
          : this.resolveSelectors(value);
      }
    }
    return resolved;
  }

  getJsonSettingsFromStorageOrDefaults() {
    const dataFromStorage = localStorage.getItem(AppConstants.localStorageSettingsKey);
    const dataFromDefaults = JSON.stringify(dataDefaultApp.defaultAppSettings);
    return JSON.parse(
      dataFromStorage || dataFromDefaults

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
    });
    // }).bind(this);
    // AppSettings.js: Uncaught TypeError: Cannot read properties of undefined (reading 'bind')
    // Arrow functions (() => {}) automatically inherit the lexical 'this' context of the
    // enclosing scope. There’s no need to manually bind this when using arrow functions.
    this.uiElements.clumpCodeInput.addEventListener('input', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    });
    this.uiElements.linkTo.addEventListener('change', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.columnSelect.disabled = false;
      } else {
        this.uiElements.columnSelect.disabled = true;
      }
    });
    this.uiElements.columnSelect.addEventListener('change', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    });

    // Listener on 'newStorageNameInput' field to check if the 'New Storage' button should be bold.
    this.uiElements.newStorageNameInput.addEventListener('input', this.checkNewStorageButton.bind(this));
    this.uiElements.storageNameTag.addEventListener('change', this.toggleStorageButtons.bind(this));

    this.uiElements.exportDataButton.addEventListener('click', this.handleExportData.bind(this));
    this.uiElements.importDataButton.addEventListener('click', this.handleImportData.bind(this));

    this.uiElements.clumpFormId.addEventListener('submit', this.handleFormSubmit.bind(this));
    this.uiElements.clumpFormId.addEventListener('reset', this.handleFormReset.bind(this));
  }

  handleFormSubmit(event) {
    // clumpFormId.onsubmit = (event) => {
    event.preventDefault();

    // Clump cell placement has 3 options:
    //
    // [Linked]: 'Column to Add To' dropdown is irrelevant.
    // 1. Add to the same row as the linked clump, in the next column.
    //
    // [Unlinked]: 'Link to Clump' dropdown should be set to 'None'.
    // 2. When 'Last' is selected, add new clump to the last column that had a clump added to it.
    // 3. Add to a specific column.
    //
    const newLinkTo = parseInt(this.uiElements.linkTo.value, 10) || -1;
    const isLinked = !isNaN(newLinkTo) && newLinkTo > 0;
    let columnToAddTo;

    const columnRawValue = this.uiElements.columnSelect.options[this.uiElements.columnSelect.selectedIndex].value;

    if (this.dataManager.editingIndex === null) {
      //
      // ADDING A NEW CLUMP
      //
      const newClumpID = this.dataManager.lastAddedClumpId + 1;

      const addNewClump = new ClumpInfo();
      addNewClump.id = newClumpID;
      addNewClump.clumpName = this.uiElements.clumpNameInput.value;
      addNewClump.clumpCode = this.uiElements.clumpCodeInput.value;

      // Populate either the 'linkedClumpId' (if linked), or the given 'Column' (if not linked).
      //
      if (isLinked) {
        // [Linked]
        columnToAddTo = this.dataManager.lastAddedCol + 1;
        addNewClump.linkedClumpID = newLinkTo;
      } else {
        // [Unlinked]
        columnToAddTo = columnRawValue === 'last' ? lastAddedCol : parseInt(columnRawValue, 10);
        addNewClump.column = columnToAddTo;
      }

      // Add the new clump to the end of the 'clumps' 1D array.
      const clumpListToAdd = [...this.dataManager.getData('clumpList')];
      clumpListToAdd.push(addNewClump);
      this.dataManager.setData('clumpList', clumpListToAdd);

      // Inject the new clump to the 'clumpMatrix' 2D array.
      this.dataManager.addClumpToMatrix(addNewClump);

      // Update global variables.
      this.dataManager.setData('lastAddedClumpId', newClumpID);
      //
    } else {
      //
      // EDITING AN EXISTING CLUMP
      //
      const editedClump = this.dataManager.clumpList[this.dataManager.editingIndex];

      editedClump.clumpName = this.uiElements.clumpNameInput.value;
      editedClump.clumpCode = this.uiElements.clumpCodeInput.value;

      this.dataManager.editingIndex = null;
      this.updateDataInHtml();
      this.clearSelectedClumpNode();
    }

    this.storeClumps();
    this.renderMatrix();
    this.uiElements.clumpFormId.reset();

    const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
    this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
    this.uiElements.outputContainer.style.height = howManyExpanded > 0
      ? 'calc(100vh - 42px - 260px)'
      : 'calc(100vh - 42px)';
  };

  // When canceling an edit, reset the 'editingIndex' to null, and remove the
  // last 'Link to Clump' dropdown option if it is the same as the original 'linkedClumpID'.
  handleFormReset(event) {
    event.preventDefault();

    // This will reset the form fields, regardless of any nesting.
    // clumpFormId.reset();
    // Manually clear each input, textarea, and select within the form
    document.querySelectorAll("#clumpFormId input, #clumpFormId textarea, #clumpFormId select").forEach((field) => {
      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = field.defaultChecked;
      } else {
        field.value = field.defaultValue;
      }
    });

    this.dataManager.editingIndex = null;

    this.uiElements.saveClumpButton.disabled = this.uiElements.clumpNameInput.value.trim() === '';

    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();
    // This will clear the 'edit border' from the selected clump node.
    this.clearSelectedClumpNode();
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
        dataDefaultApp.lastAddedCol,
        dataDefaultApp.lastAddedClumpId
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

  //
  // @TODO: Extract these to an 'AppForm' class.
  //

  loadForEdit(index, event) {
    event.stopPropagation();

    AppConfig.debugConsoleLogs && console.log('Editing clump:', this.dataManager.clumpList[index]);

    this.dataManager.setData('editingIndex', index);
    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();
    this.selectClumpNode(event.target);

    const clump = this.dataManager.clumpList[index];
    this.uiElements.clumpNameInput.value = clump.clumpName;
    this.uiElements.clumpCodeInput.value = clump.clumpCode;

    // Update value and disable.
    this.uiElements.linkTo.value = isNaN(clump.linkedClumpID) ? '' : clump.linkedClumpID;
    this.uiElements.columnSelect.value = clump.column === -1 ? 'last' : clump.column;
  }

  // Clear the 'clump-node-selected' class from all clump nodes.
  clearSelectedClumpNode() {
    const clumpNodes = document.querySelectorAll('.clump-node');
    clumpNodes.forEach(node => node.classList.remove('clump-node-selected'));
  }

  selectClumpNode(eventTarget) {
    this.clearSelectedClumpNode();
    // Add class to selected clump node.
    eventTarget.parentElement.parentElement.classList.add('clump-node-selected');
  }

  // Deleting individual cells is not easily possible due to linked clumps. For instance,
  //   what happens when you delete a clump that has a clump linked to it from its right?
  // And the shifting involved for cells below, left and right, will require some complexity.
  // For now, we'll just provide the ability to remove the last clump added (an undo).
  deleteLastClump(event) {
    event.stopPropagation();

    if (confirm("Are you sure you want to delete this clump?")) {
      //
      //  C1R1 |  0    |  0
      //  C1R2 |  0    |  0
      //  C1R3 |< C2R1 |  0
      //  0    |  C2R2 |< C3R1
      //  0    |  0    |  C3R2
      //  0    |  C2R3 |  0
      //  0    |  C2R4 |< C3R3
      //  0    |  0    |  C3R4
      //  0    |  0    |  C3R5
      //  0    |  C2R5 |  0
      //  C1R4 |< C2R6 |  0
      //  0    |  C2R7 |< C3R6
      //  0    |  0    |  C3R7
      //  C1R5 |  0    |  0

      if (this.dataManager.editingIndex === this.dataManager.clumpList.length - 1) {
        this.dataManager.setData('editingIndex', null);
      }

      // Remove the clump from the clumps array.
      const clumpListToPop = [...this.dataManager.getData('clumpList')];
      clumpListToPop.pop();
      this.dataManager.setData('clumpList', clumpListToPop);

      // Clear matrix and re-add all clumps.
      this.dataManager.addClumpsToMatrix();

      // Update global variables.
      this.dataManager.setData(
        'lastAddedClumpId',
        this.dataManager.clumpList.length > 0
          ? this.dataManager.clumpList[this.dataManager.clumpList.length - 1].id
          : 0
      );

      // Cycle through 'clumpMatrix' in reverse by rows, then columns,
      // looking for the Column that the new last clump ID is in.
      // This will be the new 'lastAddedCol'.
      findLastAddedColLoop:
      for (let c = getColumnCount() - 1; c >= 0; c--) {
        for (let r = getRowCount() - 1; r >= 0; r--) {
          if (this.dataManager.clumpMatrix[r][c] === this.dataManager.lastAddedClumpId) {
            this.dataManager.setData('lastAddedCol', c + 1);
            break findLastAddedColLoop;
          }
        }
      }

      this.dataManager.storeClumps();
      this.updateDataInHtml();
      this.renderMatrix();

      const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
      this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
      this.uiElements.outputContainer.style.height = howManyExpanded > 0
        ? 'calc(100vh - 42px - 260px)'
        : 'calc(100vh - 42px)';
    }
  }

  showStorageError(errText) {
    if (
      this.uiElements.storageNamingError.classList.contains('hidden') ||
      this.uiElements.storageNamingError.classList.contains('error-hidden')
    ) {
      classListChain(this.uiElements.storageNamingError)
        .remove('hidden')
        .remove('error-hidden')
        .add('error-visible');
    }
    this.uiElements.storageNamingError.innerHTML = errText;
  }

  // const newStorageNameInput = document.getElementById("newStorageNameInput");
  createNewStorage() {
    // Temporarily disable the new storage button to prevent double-clicks.
    this.uiElements.newStorageNameButton.disabled = true;

    AppConfig.debugConsoleLogs &&
      console.log('Create new storage:', this.uiElements.newStorageNameInput.value);

    if (this.isValidKeyName(this.uiElements.newStorageNameInput.value)) {
      hideStorageError();
      setTimeout(() => {
        // Reset input field.
        this.uiElements.newStorageNameInput.value = '';
        // Reset error message.
        this.uiElements.storageNamingError.innerHTML = '';
        // Remove temporary disablement of the new storage button.
        this.uiElements.newStorageNameButton.disabled = false;
        // Reset CSS styling on the 'New Storage' button.
        this.checkNewStorageButton();
      }, 250);
      // From initialization above:
      //   const storageNames = settings.storageNames;
      // JavaScript is a pass-by-reference language for
      // non-primitives, so we can modify the original array.
      this.appSettingsInfo.storageNames.push(this.uiElements.newStorageNameInput.value);
      this.storeSettings();
      this.renderMatrix();
    } else {
      this.showStorageError(storageNameErrorText);
      // Remove temporary disablement of the new storage button.
      this.uiElements.newStorageNameButton.disabled = false;
      // Reset CSS styling on the 'New Storage' button.
      this.checkNewStorageButton();
    }
  }

  deleteSelectedStorage() {
    AppConfig.debugConsoleLogs &&
      console.log('Delete selected storage:', this.uiElements.storageNameTag.value);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    if (
      this.appSettingsInfo.storageNames.length > 1 &&
      this.uiElements.storageNameTag.value !== '0' &&
      this.uiElements.storageNameTag.value !== this.appSettingsInfo.storageIndex
    ) {
      if (confirm(`\nAre you sure you want to delete this storage?
            \nAny data within this storage will be lost.
            \nClick 'Cancel' and switch to this storage to export your data.\n`)) {

        this.hideStorageError();

        const selectedStorageIndex = parseInt(this.uiElements.storageNameTag.value, 10);
        const selectedStorageName = this.appSettingsInfo.storageNames[selectedStorageIndex];

        const newList = this.appSettingsInfo.storageNames.toSpliced(selectedStorageIndex, 1);
        this.appSettingsInfo.storageNames = [...newList];
        this.storeSettings();

        // Remove from local storage.
        localStorage.removeItem(selectedStorageName);

        this.renderMatrix();
      }
    } else {
      // This should never be hit because the button should be disabled when not allowed.
      this.showStorageError(storageNameErrDelText);
    }
  }

  // const storageName = document.getElementById("storageName");
  useSelectedStorage() {
    AppConfig.debugConsoleLogs &&
      console.log('Use selected storage:', this.uiElements.storageNameTag.value);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    if (this.uiElements.storageNameTag.value !== this.appSettings.storageIndex) {
      // Update Settings.
      this.appSettings.storageIndex = parseInt(this.uiElements.storageNameTag.value, 10);
      this.storeSettings();

      // Update data.
      this.dataManager.setData('editingIndex', null);
      this.dataManager.setData('lastAddedCol', dataDefaultApp.lastAddedCol);
      this.dataManager.setData('lastAddedClumpId', dataDefaultApp.lastAddedClumpId);
      this.dataManager.setClumpList(); // Default: getStorageNameFromSettings()

      // Clear matrix and re-add all clumps.
      this.dataManager.addClumpsToMatrix();

      // Update UI.
      this.uiElements.clumpFormId.reset();
      this.uiElements.outputContainer.style.marginBottom = '0';
      this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
      this.uiElements.storageNameLabelCurrent.textContent =
        this.appSettings.storageNames[this.appSettings.storageIndex];
      this.updateDataInHtml();
      this.renderMatrix();
    }
  }

  togglePanel(event) {
    event.stopPropagation();

    AppConfig.debugConsoleLogs && console.log('togglePanel');
    AppConfig.debugConsoleLogs && console.log(event.target.parentElement.parentElement);

    const panelToExpand = document.querySelector('.info-panel.export-import');
    const panelHotspot = document.querySelector('.panel-from-hotspot');

    if (panelToExpand.classList.contains('panel-from-expanded-to-collapsed')) {
      classListChain(panelToExpand)
        .remove('panel-from-expanded-to-collapsed')
        .add('panel-from-collapsed-to-expanded');
    } else {
      classListChain(panelToExpand)
        .remove('panel-from-collapsed-to-expanded')
        .add('panel-from-expanded-to-collapsed');
    }

    // ? panelHotspot.children[0].textContent = '▶' // right arrow
    panelToExpand.classList.contains('panel-from-expanded-to-collapsed')
      ? panelHotspot.children[0].textContent = '◀'
      : panelHotspot.children[0].textContent = '▼';
  }

  renderMatrix() {
    // Set CSS property dynamically to control number of columns.
    const columnCount = this.dataManager.getColumnCount();

    // Clear container before rendering
    if (this.dataManager.clumpList.length === 0) {
      let clumpContainerContent = '<div class="empty-notes">';
      clumpContainerContent += '<h2>Data Clump Flow App</h2>';
      clumpContainerContent += '<p>Tips:</p>';
      clumpContainerContent += '<ul>';
      clumpContainerContent += '  <li>Cell clumps flow from top down by default, and left to right when linked.</li>';
      clumpContainerContent += `  <li>To export, switch to the desired storage name (using the 'Use Selected' button), then click the 'Export Data' button.</li>`;
      clumpContainerContent += '</ul>';

      clumpContainerContent += '<ul>';
      clumpContainerContent += '  <li>Clicking cells will show clump contents in a window at the bottom of the screen.</li>';
      clumpContainerContent += '  <li>Multiple cell contents can be expanded, each will be layered on top of the previous.</li>';
      clumpContainerContent += '  <li>Closing the last, or topmost content window will reveal the content window below it.</li>';
      clumpContainerContent += '  <li>Any expanded cell content window can be collapsed, even those beneath the last opened.</li>';
      clumpContainerContent += '</ul>';

      clumpContainerContent += '<ul>';
      clumpContainerContent += `  <li>When a clump is shown, although a single click on either the cell or content window will close the content window, highlighting text within the content window will not close it (so long as text is highlighted).
          </li>`;
      clumpContainerContent += '</ul>';

      clumpContainerContent += `<p>
            <code>@TODO:</code> <small>(referenced in
            <a href='https://github.com/KDCinfo/dataflow/tree/main/data_mapping_flow_analysis_tool' target='_blank'>Readme</a>
            )</small>:</p>`;
      clumpContainerContent += '<ol>';
      clumpContainerContent += '  <li>Only the last clump can be deleted, then the next, and the next.</li>';
      clumpContainerContent += "  <li>When editing clumps, only 'clump names' and 'data clumps' can be updated.";
      clumpContainerContent += "    <ol>";
      clumpContainerContent += '      <li>Clump links cannot be changed.</li>';
      clumpContainerContent += '      <li>Clumps cannot be moved.</li>';
      clumpContainerContent += '    </ol>';
      clumpContainerContent += '  </li>';
      clumpContainerContent += `  <li>Bug: Sometimes 'Import Data' will fail silently*.`;
      clumpContainerContent += "    <ol>";
      clumpContainerContent += '      <li>*An error is shown in the dev tools console.</li>';
      clumpContainerContent += '      <li>Workaround: Try it again. Subequent attempts usually work.</li>';
      clumpContainerContent += '    </ol>';
      clumpContainerContent += '  </li>';
      clumpContainerContent += '</ol>';
      clumpContainerContent += '</div>';
      this.uiElements.clumpContainer.innerHTML = clumpContainerContent;
      this.uiElements.clumpContainer.style.color = '#ffffff';
    } else {
      this.uiElements.clumpContainer.innerHTML = '';
      // Set color to same as '.output-container'.
      this.uiElements.clumpContainer.style.color = '#000000';
    }

    // [ GRID REPEAT SLIDER ]

    // [1] Add ticks to the slider.
    // const gridRepeatSliderMarkers = document.getElementById('gridRepeatSliderMarkers');
    this.uiElements.gridRepeatSliderMarkers.innerHTML = '';
    this.uiElements.gridRepeatOptions.forEach((option, index) => {
      const marker = document.createElement('option');
      marker.value = index + 1;
      marker.label = option;
      this.uiElements.gridRepeatSliderMarkers.appendChild(marker);
    });

    // [2] Use value from: settings.gridRepeatRangeValue
    const cellWidth = this.convertGridRepeatSettingValueToCellWidth();
    this.uiElements.clumpContainer.style.gridTemplateColumns = `repeat(${columnCount}, ${cellWidth})`;

    // [3] Update the grid repeat slider.
    this.uiElements.gridRepeatRangeInput.value = this.appSettingsInfo.gridRepeatRangeValue;

    // [4] Update the grid repeat slider label.
    this.uiElements.gridRepeatHTMLSpan.textContent = `[${this.appSettingsInfo.gridRepeatRangeValue}] ${cellWidth}`;

    // [5] Update the 'storageName' dropdown from settings.storage
    this.updateStorageNameDropdownOptions();
    this.uiElements.storageNameLabelCurrent.textContent = this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex];

    // [6] Enable/disable storage buttons.
    this.toggleStorageButtons();

    // [ CLUMP NODE PLACEMENT ]
    //
    // Note: only the last-added clump should have a 'delete' icon.
    //
    // const cell = document.createElement('div');
    // cell.className = 'clump-node';
    // cell.style.gridColumnStart = col + 1;
    // cell.style.gridRowStart = row + 1;
    // cell.innerHTML = `<strong>${clump.name}</strong><br>${clump.code}
    //               <span class="edit-icon" onclick="loadForEdit(${clumps.indexOf(clump)}, event)">✏️</span>
    //               <span class="delete-icon" onclick="deleteClump(${clumps.indexOf(clump)}, event)">❌</span>`;
    // clumpContainer.appendChild(cell);
    //
    // lastAddedClumpId = clump.id;
    //
    //  C1R1 = Col 1, Row 1
    //  ---- - ----- - -----
    //  Col1 |  Col2 |  Col3
    //  ---- - ----- - -----
    //  C1R1 |    0  |    0  | Row 1
    //  C1R2 |    0  |    0  | Row 2
    //  C1R3 |< C2R1 |    0  | Row 3
    //    0  |  C2R2 |< C3R1 | Row 4
    //    0  |    0  |  C3R2 | Row 5
    //    0  |  C2R3 |    0  | Row 6
    //    0  |  C2R4 |< C3R3 | Row 7
    //    0  |    0  |  C3R4 | Row 8
    //    0  |    0  |  C3R5 | Row 9
    //    0  |  C2R5 |    0  | Row 10
    //  C1R4 |< C2R6 |    0  | Row 11
    //    0  |  C2R7 |< C3R6 | Row 12
    //    0  |    0  |  C3R7 | Row 13
    //  C1R5 |    0  |    0  | Row 14
    //
    // Cycle through 'clumpMatrix' placing a clump cell or empty cell in HTML.
    // - All the cells are on the right side of the screen.
    // - The right side should be scrollable either vertically or horizontally when needed.
    // - All cell heights and widths should be fixed.
    // - All rows have the same number of cells, and all columns the same number of cells.
    // - When a cell title is tapped, its contents expand into a small scrollable window.

    // const newClump = {
    //     id: newClumpID,
    //     clumpName: clumpNameInput.value,
    //     clumpCode: clumpCodeInput.value,
    //     column: -1,
    //     linkedClumpID: -1,
    //   };

    let clumpListIndex = -1;

    // Cycle through the clumpMatrix to render the clumps.
    //
    for (let r = 0; r < this.dataManager.clumpMatrix.length; r++) {
      for (let c = 0; c < this.dataManager.clumpMatrix[r].length; c++) {
        const curClumpId = this.dataManager.clumpMatrix[r][c];

        if (curClumpId === 0) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'clump-node empty';
          this.uiElements.clumpContainer.appendChild(emptyCell);
          continue;
        }

        const clumpFound = this.dataManager.clumpList.find(clump => clump.id === curClumpId);
        const clumpCell = document.createElement('div');
        clumpListIndex = this.dataManager.clumpList.indexOf(clumpFound);

        clumpCell.className = `clump-node collapsed clump-list-index-${clumpListIndex}`;

        // Create content span for clump name and code
        const contentSpan = document.createElement('div');
        contentSpan.className = 'content-span';
        contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
              <br>${clumpFound.clumpCode.split('\n')[0]}`;
        clumpCell.appendChild(contentSpan);

        // Apply linked/unlinked class based on the condition
        clumpCell.classList.add(clumpFound.linkedClumpID !== -1 ? 'linked' : 'unlinked');

        const iconSpan = document.createElement('div');
        iconSpan.className = 'icon-span';

        // Create and append the edit icon
        const editIcon = document.createElement('div');
        editIcon.className = 'edit-icon';
        editIcon.textContent = '✏️';
        editIcon.onclick = (event) => {
          event.stopPropagation(); // Prevent toggle when clicking edit
          this.loadForEdit(this.dataManager.clumpList.indexOf(clumpFound), event).bind(this);
        };
        iconSpan.appendChild(editIcon);

        // Conditionally create and append the delete icon
        if (this.dataManager.clumpList[this.dataManager.clumpList.length - 1].id === clumpFound.id) {
          const deleteIcon = document.createElement('div');
          deleteIcon.className = 'delete-icon';
          deleteIcon.textContent = '❌';
          deleteIcon.onclick = (event) => {
            event.stopPropagation(); // Prevent toggle when clicking delete
            this.deleteLastClump(event).bind(this);
          };
          iconSpan.appendChild(deleteIcon);
        }
        clumpCell.appendChild(iconSpan);

        // Toggle function to handle cell expansion/collapse
        const toggleCell = () => {
          clumpCell.classList.toggle('expanded');
          clumpCell.classList.toggle('collapsed');

          const isCellCollapsed = clumpCell.classList.contains('collapsed');
          const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;

          this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
          this.uiElements.outputContainer.style.height = howManyExpanded > 0
            ? 'calc(100vh - 42px - 260px)'
            : 'calc(100vh - 42px)';

          contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
                <br>${isCellCollapsed
              ? clumpFound.clumpCode.split('\n')[0]
              : '<pre>' + AppHelpers.unescapeHTML(clumpFound.clumpCode) + '</pre>'
            }`;

          if (!isCellCollapsed) {
            contentSpan.querySelector('pre').style.zIndex = howManyExpanded + 10;
          }
        };

        // Add toggle click listener to contentSpan but without any inner <pre> tags.
        contentSpan.addEventListener('click', (event) => {
          // event.stopPropagation(); // Prevent bubbling to avoid unintended behavior.
          if (window.getSelection().toString()) {
            // Prevent toggle if there's a selection.
            event.stopPropagation();
            return;
          }
          toggleCell().bind(this);
        });

        // Append cell to the container
        this.uiElements.clumpContainer.appendChild(clumpCell);
      }
    }

    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();

    // Re-highlight edited cell, if any.
    if (this.dataManager.editingIndex !== null) {
      const indexCell = document.querySelector(`.clump-list-index-${this.dataManager.editingIndex}`);
      indexCell && indexCell.classList.add('clump-node-selected');
    }
  }
}
