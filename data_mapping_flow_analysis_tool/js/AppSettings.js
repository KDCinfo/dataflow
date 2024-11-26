import AppConfig from './AppConfig.js';
import AppConstants from './AppConstants.js';
import AppData from './AppData.js';
import AppHelpers from './AppHelper.js';
import AppStorage from './AppStorage.js';
import ClumpInfo from './ClumpInfo.js';
import DataDefaultMaps from './DataDefaultMaps.js';
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

    // This will override the 'Appsettings.storageIndex' with the 'sessionStorage' value,
    //   if present, else it falls back to using the 'localStorage' value.
    // It will then also be stored in 'localStorage' along with the other settings,
    //   Any other open tabs won't be affected by this 'localStorage' change
    //   because they will have their own 'sessionStorage' value.
    const sessionStorageIndex = AppStorage.getSessionStorageIndex(this.appSettingsInfo.storageIndex);
    if (sessionStorageIndex !== this.appSettingsInfo.storageIndex) {
      this.appSettingsInfo.storageIndex = sessionStorageIndex;
    }
    // storeSettings(false) => Don't update 'dataManager'
    //                         because it hasn't been initialized yet.
    this.storeSettings(false);

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
    const dataFromStorage = AppStorage.appStorageGetItem(AppConstants.localStorageSettingsKey);
    const dataFromDefaults = JSON.stringify(
      DataDefaultMaps.dataDefaultMap().defaultAppSettings
    );
    return JSON.parse(
      dataFromStorage || dataFromDefaults

    );
  }

  // Adding the '.popped' class to 'clump-form-form' will pop out the form.
  toggleClumpFormPopUp() {
    this.uiElements.clumpFormId.classList.toggle('popped');
    this.uiElements.clumpNameInput.focus();
  }

  removePopUp() {
    this.uiElements.clumpFormId.classList.remove('popped');
    this.uiElements.clumpNameInput.focus();
  }

  initEventListeners() {
    //
    // EVENT LISTENERS
    //

    // Listeners to toggle the form pop up.
    this.uiElements.popItIcon.addEventListener('click', this.toggleClumpFormPopUp.bind(this));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.toggleClumpFormPopUp();
      }
    });

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

    // this.uiElements.settingsPanelToggle
    // onclick="togglePanel(event)"
    this.uiElements.settingsPanelToggle.addEventListener('click', this.togglePanel.bind(this));
    // id="gridRepeatRangeInput"
    // oninput="updateGridRepeat(event)"
    this.uiElements.gridRepeatRangeInput.addEventListener('input', this.updateGridRepeat.bind(this));
    // id="storageButtonDelete"
    // onclick="deleteSelectedStorage()"
    this.uiElements.storageButtonDelete.addEventListener('click', this.deleteSelectedStorage.bind(this));
    // id="storageButtonUse"
    // onclick="useSelectedStorage()"
    this.uiElements.storageButtonUse.addEventListener('click', this.useSelectedStorage.bind(this));
    // id="newStorageNameButton"
    // onclick="createNewStorage()"
    this.uiElements.newStorageNameButton.addEventListener('click', this.createNewStorage.bind(this));

    window.addEventListener('storage', (event) => {
      if (event.key === AppConstants.localStorageSettingsKey) {
        const oldEventValues = JSON.parse(event.oldValue);
        const newEventValues = JSON.parse(event.newValue);

        const oldStorageNames = oldEventValues.storageNames;
        const newStorageNames = newEventValues.storageNames;
        const oldStorageNamesLength = oldStorageNames.length;
        const newStorageNamesLength = newStorageNames.length;

        let messageToDisplayOnOtherTabs = '';

        if (oldStorageNamesLength !== newStorageNamesLength) {
          let allowDismiss = true;

          if (oldStorageNamesLength < newStorageNamesLength) {
            // A new storage was added.
            //
            const addedName = newStorageNames.filter(name => !oldStorageNames.includes(name));
            messageToDisplayOnOtherTabs = `A storage was added:
                <br><br>
                - ${addedName}
                <br><br>
                Please refresh the page to see the changes,
                or tap this message to dismiss.`;

            // @TODO: Update the 'appSettingsInfo' and 'selectStorage' dropdown.

            //
          } else {
            // A storage was deleted.
            //
            const deletedNameList = oldStorageNames.filter(name => !newStorageNames.includes(name));
            const deletedName = deletedNameList.length > 0 ? deletedNameList[0].toLowerCase() : '';
            // If deleted name is same as currently active name,
            // inform the user their data is stale and to export before refreshing,
            // and do not allow the message to be dismissed.
            if (deletedName === this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex]) {
              allowDismiss = false;
              messageToDisplayOnOtherTabs = `The currently active storage was deleted:
                  <br><br>
                  - ${deletedName}
                  <br><br>
                  Please export this data before refreshing the page.
                  <strong>If changes are attempted without a refresh,
                  all the data in the next storage in the list could be lost.</strong>`;
            } else {
              messageToDisplayOnOtherTabs = `A storage was deleted:
                  <br><br>
                  - ${deletedName}
                  <br><br>
                  Please refresh the page to see the changes,
                  or tap this message to dismiss.`;
            }
          }

          // Run init on the new localStorage.
          this.appSettingsInfo.storageNames = newStorageNames;
          const sessionStorageIndex = AppStorage.getSessionStorageIndex(this.appSettingsInfo.storageIndex);
          if (sessionStorageIndex !== this.appSettingsInfo.storageIndex) {
            this.appSettingsInfo.storageIndex = sessionStorageIndex;
          }
          // 'localStorage' has already been updated via the other tab, but we
          // still need to update this app's 'AppSettingsInfo' and 'dataManager'.
          this.storeSettings();
          this.addTextToCrossTabWarning(
            allowDismiss,
            messageToDisplayOnOtherTabs
          );

          //
        } else {
          // Changing 'AppSettingsInfo':
          // - gridRepeatRangeValue | This is a local setting, so no need to message other tabs about it.
          // - storageNames | Changes to the storage names should notify other tabs about the change (i.e., adding or deleting).
          // - storageIndex | There's no need to message other tabs about changing the active storage selection.
          // Storage names length is checked above, so basically,
          // there's nothing to do here for the 'AppSettingsInfo' changes.
        }
      }
    });
  }

  addTextToCrossTabWarning(
    allowDismiss,
    messageToDisplayOnOtherTabs
  ) {
    this.uiElements.crossTabWarning.classList.remove('hidden');
    this.uiElements.crossTabWarning.innerHTML = messageToDisplayOnOtherTabs;
    if (allowDismiss) {
      this.uiElements.crossTabWarning.style.cursor = 'pointer';
      this.uiElements.crossTabWarning.onclick = (event) => {
        event.preventDefault();
        this.dismissWarningMessage();
      }
    } else {
      this.uiElements.crossTabWarning.style.cursor = 'default';
      this.uiElements.crossTabWarning.onclick = null;
    }
  }

  dismissWarningMessage() {
    this.uiElements.crossTabWarning.classList.add('hidden');
  }

  checkIfStorageNameStillExists() {
    // Check if AppSettingsInfo.storageIndex reflects
    // the same name as the currently active storage name.
    // If not, return. We DO NOT want to update a storage that
    // doesn't exist, else it will overwrite all the data in the
    // next storage in the list and replace it with this data.
    const currentStorageName = this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex].toLowerCase();
    const storageNameLabelTrimmed = storageNameLabelCurrent.textContent.trim().toLowerCase();
    if (currentStorageName !== storageNameLabelTrimmed) {
      alert('The currently active storage name has been deleted.\n\nPlease refresh the page.');
      return false;
    }
    return true;
  }


  handleFormSubmit(event) {
    // clumpFormId.onsubmit = (event) => {
    event.preventDefault();

    // Check if the currently active storage name has been deleted.
    if (!this.checkIfStorageNameStillExists()) {
      return;
    }

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

    if (this.dataManager.getData('editingIndex') === null) {
      //
      // ADDING A NEW CLUMP
      //
      const newClumpID = this.dataManager.getData('lastAddedClumpId') + 1;

      const addNewClump = new ClumpInfo();
      addNewClump.id = newClumpID;
      addNewClump.clumpName = this.uiElements.clumpNameInput.value;
      addNewClump.clumpCode = this.uiElements.clumpCodeInput.value;

      // Populate either the 'linkedClumpId' (if linked), or the given 'Column' (if not linked).
      //
      if (isLinked) {
        // [Linked]
        columnToAddTo = this.dataManager.getData('lastAddedCol') + 1;
        addNewClump.linkedClumpID = newLinkTo;
      } else {
        // [Unlinked]
        columnToAddTo = columnRawValue === 'last'
          ? this.dataManager.getData('lastAddedCol')
          : parseInt(columnRawValue, 10);
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
      AppConfig.debugConsoleLogs && console.log('clumpList before edit:', this.dataManager.getData('clumpList'));

      const editedClumpIndex = this.dataManager.getData('editingIndex');
      const editedClump = structuredClone(this.dataManager.getData('clumpList')[editedClumpIndex]);
      editedClump.clumpName = this.uiElements.clumpNameInput.value;
      editedClump.clumpCode = this.uiElements.clumpCodeInput.value;

      // Replace the clump in the array with the updated one.
      const updatedClumpList = this.dataManager.getData('clumpList').map((clump, index) =>
        index === editedClumpIndex ? editedClump : clump
      );

      AppConfig.debugConsoleLogs && console.log('clumpList after edit - before update:', this.dataManager.getData('clumpList'));

      this.removePopUp();
      this.dataManager.setData('editingIndex', null);
      this.dataManager.setData('clumpList', updatedClumpList);

      AppConfig.debugConsoleLogs && console.log('clumpList after edit - after update:', this.dataManager.getData('clumpList'));

      this.updateDataInHtml();
      this.clearSelectedClumpNode();
    }

    this.dataManager.storeClumps();

    // Reset the form fields.
    this.resetFormFields();

    this.renderMatrix();

    const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
    this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
    this.uiElements.outputContainer.style.height = howManyExpanded > 0
      ? 'calc(100vh - 42px - 260px)'
      : 'calc(100vh - 42px)';
  };

  resetFormFields() {
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
  }

  // When canceling an edit, reset the 'editingIndex' to null, and remove the
  // last 'Link to Clump' dropdown option if it is the same as the original 'linkedClumpID'.
  handleFormReset(event) {
    event.preventDefault();

    // Reset the form fields.
    this.resetFormFields();

    // Leaving the form popped open for additional adds, but will close for edits.
    this.removePopUp();
    this.dataManager.setData('editingIndex', null);

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

  async handleImportData() {
    const importedDataArray = await FileHandler.handleImportData();

    if (
      typeof importedDataArray !== 'undefined' &&
      Array.isArray(importedDataArray) &&
      importedDataArray.length > 0
    ) {
      // Update data.
      this.dataManager.importAppData(
        importedDataArray, // importedClumps
        null, // updatedEditingIndex
        // @TODO: Replace this with static map.
        DataDefaultMaps.dataDefaultMap().lastAddedCol,
        DataDefaultMaps.dataDefaultMap().lastAddedClumpId
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

  storeSettings(updateDataManager = true) {
    // The 'dataManager' is not yet initialized when this method is called from the constructor.
    if (updateDataManager) {
      this.dataManager.updateAppSettingsInfo(this.appSettingsInfo);
    }

    // Store the settings in local storage.
    AppStorage.appStorageSetItem(
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

  convertGridRepeatSettingValueToCellWidth(curGridRepeat = this.appSettingsInfo.gridRepeatRangeValue) {
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
    this.uiElements.gridRepeatHtmlSpan.textContent = `[${newGridRepeat}] ${cellWidth}`;

    // Store the new setting.
    this.appSettingsInfo.gridRepeatRangeValue = newGridRepeat;
    this.storeSettings();
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for the data output.
  //

  updateDataInHtml() {
    // Last added Clump ID.
    this.uiElements.lastAddedClumpIdTag.textContent = this.dataManager.getData('lastAddedClumpId').toString();

    // Last column a clump was added to.
    this.uiElements.lastAddedColTag.textContent = this.dataManager.getData('lastAddedCol').toString();

    // Currently edited clump index and ID.
    const currentEditingIndex = this.dataManager.getData('editingIndex');
    this.uiElements.editingIndexTag.textContent = currentEditingIndex === null
      ? '_'
      : currentEditingIndex.toString();
    this.uiElements.editingIdTag.textContent = currentEditingIndex === null
      ? '_'
      : this.dataManager.getData('clumpList')[currentEditingIndex].id.toString();
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for dropdowns.
  //

  updateLinkToDropdownOptions() {
    this.uiElements.linkTo.innerHTML = '<option value="">None</option>';

    // This loop extrapolates in-use linkTo IDs so they are not
    // shown in the dropdown (because they're already linked to).
    const linkedClumpIDs = this.dataManager.getData('clumpList').map(clump => clump.linkedClumpID);
    this.dataManager.getData('clumpList').forEach((clump, index) => {
      // If the clump is not the one being edited, or it is not already linked.
      if (this.dataManager.getData('editingIndex') !== index || !linkedClumpIDs.includes(clump.id)) {
        const option = document.createElement('option');
        option.value = clump.id;
        option.textContent = clump.clumpName;
        this.uiElements.linkTo.appendChild(option);
      }
    });
    this.uiElements.linkTo.disabled = this.dataManager.getData('editingIndex') !== null;
  }

  updateColumnSelectDropdownOptions() {
    this.uiElements.columnSelect.innerHTML = '<option value="last">Last Column</option>';

    // Using 'clumpMatrix', this will yield a list of available columns
    // (which the UI uses for the 'Column to Add To' dropdown).
    const columns = this.dataManager.getData('clumpMatrix').length > 0
      ? Array.from({ length: this.dataManager.getData('clumpMatrix')[0].length }, (_, index) => index + 1)
      : [1];
    columns.forEach(column => {
      const option = document.createElement('option');
      option.value = column;
      option.textContent = `Column ${column}`;
      this.uiElements.columnSelect.appendChild(option);
    });
    this.uiElements.columnSelect.disabled = this.dataManager.getData('editingIndex') !== null;
  }

  updateStorageNameDropdownOptions() {
    this.uiElements.storageNameTag.innerHTML = '';

    this.appSettingsInfo.storageNames.forEach((storageName, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = storageName;
      if (index === this.appSettingsInfo.storageIndex) {
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

    AppConfig.debugConsoleLogs &&
      console.log('Editing clump:', this.dataManager.getData('clumpList')[index]);

    this.dataManager.setData('editingIndex', index);
    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();
    this.selectClumpNode(event.target);

    const clump = this.dataManager.getData('clumpList')[index];
    this.uiElements.clumpNameInput.value = clump.clumpName;
    this.uiElements.clumpCodeInput.value = clump.clumpCode;

    // Update value and disable.
    this.uiElements.linkTo.value = isNaN(clump.linkedClumpID) ? '' : clump.linkedClumpID;
    this.uiElements.columnSelect.value = clump.column === -1 ? 'last' : clump.column;

    // Set focus to the 'clump name' input field.
    this.uiElements.clumpNameInput.focus();
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

    // Check if the currently active storage name has been deleted.
    if (!this.checkIfStorageNameStillExists()) {
      return;
    }

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

      const getClumpList = this.dataManager.getData('clumpList');

      if (this.dataManager.getData('editingIndex') === getClumpList.length - 1) {
        this.dataManager.setData('editingIndex', null);
      }

      // Remove the clump from the clumps array.
      const clumpListToPop = [...getClumpList];
      clumpListToPop.pop();
      this.dataManager.setData('clumpList', clumpListToPop);

      // Clear matrix and re-add all clumps.
      this.dataManager.addClumpsToMatrix();

      // Update global variables.
      this.dataManager.setData(
        'lastAddedClumpId',
        getClumpList.length > 0
          ? getClumpList[getClumpList.length - 1].id
          : 0
      );

      // Cycle through 'clumpMatrix' in reverse by rows, then columns,
      // looking for the Column that the new last clump ID is in.
      // This will be the new 'lastAddedCol'.
      findLastAddedColLoop:
      for (let c = this.dataManager.getColumnCount() - 1; c >= 0; c--) {
        for (let r = this.dataManager.getRowCount() - 1; r >= 0; r--) {
          if (this.dataManager.getData('clumpMatrix')[r][c] === this.dataManager.getData('lastAddedClumpId')) {
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
      this.classListChain(this.uiElements.storageNamingError)
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
      this.hideStorageError();
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
      this.showStorageError(this.dataManager.getData('storageNameErrorText'));
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
        AppStorage.appStorageRemoveItem(selectedStorageName);

        this.renderMatrix();
      }
    } else {
      // This should never be hit because the button should be disabled when not allowed.
      this.showStorageError(AppConstants.storageNameErrDelText);
    }
  }

  // const storageName = document.getElementById("storageName");
  useSelectedStorage() {
    AppConfig.debugConsoleLogs &&
      console.log('Use selected storage:', this.uiElements.storageNameTag.value);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    const newStorageIndex = parseInt(this.uiElements.storageNameTag.value, 10);
    if (newStorageIndex !== this.appSettingsInfo.storageIndex) {
      // Update Settings.
      this.appSettingsInfo.storageIndex = newStorageIndex;
      // Store Settings.
      this.storeSettings();
      AppStorage.updateSessionStorageIndex(newStorageIndex);

      // Update data.
      this.dataManager.setData('editingIndex', null);
      this.dataManager.setData('lastAddedCol', DataDefaultMaps.dataDefaultMap().lastAddedCol);
      this.dataManager.setData('lastAddedClumpId', DataDefaultMaps.dataDefaultMap().lastAddedClumpId);
      this.dataManager.setClumpList(); // Default: getStorageNameFromSettings()

      // Clear matrix and re-add all clumps.
      this.dataManager.addClumpsToMatrix();

      // Update UI.
      this.uiElements.clumpFormId.reset();
      this.uiElements.outputContainer.style.marginBottom = '0';
      this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
      this.uiElements.storageNameLabelCurrent.textContent =
        this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex];
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
      this.classListChain(panelToExpand)
        .remove('panel-from-expanded-to-collapsed')
        .add('panel-from-collapsed-to-expanded');
    } else {
      this.classListChain(panelToExpand)
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

    if (this.dataManager.getData('clumpList').length === 0) {
      // Show the empty page.
      //
      // The old way:
      // let clumpContainerContent = '<div class="empty-notes">';
      // clumpContainerContent += '<h2>Data Clump Flow App</h2>';
      // this.uiElements.clumpContainer.innerHTML = clumpContainerContent;
      // this.uiElements.clumpContainer.style.color = '#ffffff';
      //
      // The new way:
      AppHelpers.injectHtml(
        './htmlh/empty-page.htmlh',
        this.uiElements.clumpContainer,
        (target) => {
          console.log('Content injected into:', target);
          target.style.color = '#ffffff';
        }
      );
    } else {
      this.uiElements.clumpContainer.innerHTML = '';
      // Set color to same as '.output-container'.
      this.uiElements.clumpContainer.style.color = '#000000';
    }

    // [ GRID REPEAT SLIDER ]

    // [1] Add ticks to the slider.
    // const gridRepeatSliderMarkers = document.getElementById('gridRepeatSliderMarkers');
    this.uiElements.gridRepeatSliderMarkers.innerHTML = '';
    AppConstants.gridRepeatOptions.forEach((option, index) => {
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
    this.uiElements.gridRepeatHtmlSpan.textContent = `[${this.appSettingsInfo.gridRepeatRangeValue}] ${cellWidth}`;

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
    const getClumpMatrix = this.dataManager.getData('clumpMatrix');
    const getClumpList = this.dataManager.getData('clumpList');
    for (let r = 0; r < getClumpMatrix.length; r++) {
      for (let c = 0; c < getClumpMatrix[r].length; c++) {
        const curClumpId = getClumpMatrix[r][c];

        if (curClumpId === 0) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'clump-node empty';
          this.uiElements.clumpContainer.appendChild(emptyCell);
          continue;
        }

        const clumpFound = getClumpList.find(clump => clump.id === curClumpId);
        const clumpCell = document.createElement('div');
        clumpListIndex = getClumpList.indexOf(clumpFound);

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
          this.loadForEdit(getClumpList.indexOf(clumpFound), event);
        };
        iconSpan.appendChild(editIcon);

        // Conditionally create and append the delete icon
        if (getClumpList[getClumpList.length - 1].id === clumpFound.id) {
          const deleteIcon = document.createElement('div');
          deleteIcon.className = 'delete-icon';
          deleteIcon.textContent = '❌';
          deleteIcon.onclick = (event) => {
            event.stopPropagation(); // Prevent toggle when clicking delete
            this.deleteLastClump(event);
          };
          iconSpan.appendChild(deleteIcon);
        }
        clumpCell.appendChild(iconSpan);

        // Toggle function to handle cell expansion/collapse
        const toggleCell = () => {
          clumpCell.classList.toggle('expanded');
          clumpCell.classList.toggle('collapsed');

          const isCellCollapsed = clumpCell.classList.contains('collapsed');
          const expandedCellsContent = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded');
          const howManyExpanded = expandedCellsContent.length;

          // Provide a margin at the bottom of the screen when at least one cell is expanded.
          //
          this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
          this.uiElements.outputContainer.style.height = howManyExpanded > 0
            ? 'calc(100vh - 42px - 260px)'
            : 'calc(100vh - 42px)';

          // Update the content span with clump name and code.
          //
          let clumpCellContents = `<strong>${clumpFound.clumpName}</strong>
            <br>${isCellCollapsed
              ? clumpFound.clumpCode.split('\n')[0]
              : clumpFound.clumpCode.split('\n').slice(0, 2).join('<br>')}`;
          if (!isCellCollapsed) {
            clumpCellContents += `<pre>${AppHelpers.unescapeHTML(clumpFound.clumpCode)}</pre>`;
          }
          contentSpan.innerHTML = clumpCellContents;

          // Set z-index for expanded cells.
          //
          if (!isCellCollapsed) {
            let largestExpandedZIndex = 0;
            const elements = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded .content-span pre');
            for (const clumpCellPre of elements) {
              const zIndex = parseInt(clumpCellPre.style.zIndex, 10) || 0;
              if (zIndex > largestExpandedZIndex) {
                largestExpandedZIndex = zIndex;
              }
            }

            contentSpan.querySelector('pre').style.zIndex = largestExpandedZIndex + 10;
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
          toggleCell();
        });

        // Append cell to the container
        this.uiElements.clumpContainer.appendChild(clumpCell);
      }
    }

    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();

    // Re-highlight edited cell, if any.
    if (this.dataManager.getData('editingIndex') !== null) {
      const indexCell = document.querySelector(`.clump-list-index-${this.dataManager.getData('editingIndex')}`);
      indexCell && indexCell.classList.add('clump-node-selected');
    }

    // Set focus to the 'clump name' input field.
    this.uiElements.clumpNameInput.focus();
  }
}
