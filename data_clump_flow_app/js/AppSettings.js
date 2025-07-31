import AppConfig from './AppConfig.js';
import AppConstants from './AppConstants.js';
import AppData from './AppData.js';
import AppHelpers from './AppHelper.js';
import AppModal from './AppModal.js';
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
  //   showIds: false,
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

  // The 'appModal' is setup to show the 'Project Flow Manager' form.
  appModal;
  tipsModal;

  constructor(uiSelectors) {
    const date = new Date();
    AppConfig.debugConsoleLogs && console.log('AppSettings initialized on:', date.toLocaleString());

    this.uiElements = this.resolveSelectors(uiSelectors);

    // Population of 'appSettingsInfo':
    // 1) Check and retrieve from storage
    // 2) If storage doesn't exist, grab defaults from DataDefaultMaps.
    // 3) Check for and add any missing/new properties
    //    (primarily in the case settings were restored from storage).
    this.appSettingsInfo = AppStorage.getJsonSettingsFromStorageOrDefaults();

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

    // Update page title.
    document.title = this.getAppTitle();

    // Initial render call
    this.renderMatrix();

    AppHelpers.injectHtml(
      './htmlh/tips-page.htmlh',
      this.uiElements.tipsModalContent.querySelector('.modal-body'),
      (target) => {
        AppConfig.debugConsoleLogs && console.log('Content injected into:', target);
        target.style.color = '#ffffff';
      }
    );

    // Initialize AppModal -- moved to 'renderMatrix()' inside 'injectHtml().then()'.

    // Uncomment the trigger below when debugging the Flow Manager modal.
    // this.triggerAppModalBtnClick();

    // Show the welcome alert only once.
    // Removing this popup: If anyone is using the tool they will have seen this by now.
    // this.showOneTimeAlert();
  }

  getAppTitle() {
    // If the active flow is 'default', show the full app title.
    return this.appSettingsInfo.storageIndex === 0
        ? `${AppConstants.appFullName}`
        : `${AppConstants.dynamicAppTitlePrefix} [${this.getCurrentFlowName()}]`;
  }

  getCurrentFlowName() {
    return this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex];
  }

  // Future function to trigger appModalBtn click.
  async triggerAppModalBtnClick() {
    // Delay the click for 'n' seconds.
    await new Promise(resolve => setTimeout(resolve, 500));
    this.appModal.appModalBtn.click();
  }

  async triggerTipsModalBtnClick() {
    // Delay the click for 'n' seconds.
    await new Promise(resolve => setTimeout(resolve, 500));
    this.tipsModal.tipsModalBtn.click();
  }

  // [Tested]
  showOneTimeAlert() {
    const alertText = `Welcome to the Data Clump Flow App!\n
    NOTE: Important Update for 2025\n
TL;DR: Please EXPORT ALL YOUR STORAGE FLOWS\n
There was a major refactor to this app in March
that allows for clump movement, as well as more
clump deletions (other than just the last cell).\n
Due to the complexities of the update, although
tested extensively, in the chance an edge-case
was missed, please take a second to export all
your flows as soon as you dimiss this dialog.\n
There is an 'Export All' button to help with this.\n
There is also a new 'one-step-back' auto-
backup/restore feature to help mitigate any
potential data issues. Also to note this app
is open source and PRs are welcome. Thank you
for visiting, and I hope the app is helpful!\n
P.S. This dialog will not show again.`;

    const getInitMessageOriginal = AppStorage.appStorageGetItem('initMessage');
    const getInitMessage = AppStorage.appStorageGetItem('dataflowInitMessage');
    // If one OR the other isn't null, don't show the alert.
    if (getInitMessageOriginal === null && getInitMessage === null) {
      alert(alertText);
      AppStorage.appStorageSetItem('dataflowInitMessage', 'seen');
    }
  }

  // [Tested]
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

  // Adding the '.popped' class to 'clump-form-form' will pop out the form.
  // [Tested]
  toggleClumpFormPopUp() {
    this.uiElements.clumpFormId.classList.toggle('popped');
    this.uiElements.clumpNameInput.focus();
  }

  // [Tested]
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
        // If modal is open, close it. Else, toggle the clump form pop up.
        if (this.appModal.isOpen) {
          this.appModal.modalClose();
        } else if (this.tipsModal.isOpen) {
          this.tipsModal.modalClose();
        } else {
          this.toggleClumpFormPopUp();
        }
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
    this.uiElements.linkToId.addEventListener('change', (evt) => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
      // A cell is either linked to an existing cell, or it needs to be added to a specific column.
      // So if the 'Link to Clump' dropdown is used, the 'Column to Add To' dropdown cannot.
      // This is already happening in the submit, but this visual disabling is a better UX.
      if (evt.target.value !== '') {
        this.uiElements.columnSelect.disabled = true;
      } else {
        this.uiElements.columnSelect.disabled = false;
      }
    });
    this.uiElements.linkedToLeft.addEventListener('change', () => {
      // Refresh 'linkToId' dropdown options.
      // function(event) => if (event.target.checked) { }
      this.updateLinkToDropdownOptions();
      this.updateColumnSelectDropdownOptions();
    });
    this.uiElements.linkedToAbove.addEventListener('change', () => {
      this.updateLinkToDropdownOptions();
      this.updateColumnSelectDropdownOptions();
    });
    this.uiElements.columnSelect.addEventListener('change', () => {
      if (this.uiElements.clumpNameInput.value.trim() !== '') {
        this.uiElements.saveClumpButton.disabled = false;
      } else {
        this.uiElements.saveClumpButton.disabled = true;
      }
    });

    //
    // 'uiElements' are configured in [data_clump_flow_app/js/uiConfig.js]
    //

    // Listener on 'newStorageNameInput' field to check if the 'New Storage' button should be bold.
    this.uiElements.newStorageNameInput.addEventListener('input', () => {
      this.toggleStorageButtons(this.uiElements.storageNameTagModal);
    });
    // onEnter, submit form.
    this.uiElements.newStorageNameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.createNewStorage();
      }
    });

    // Listeners for <select> dropdowns: 'storageNameTag' and 'storageNameTagModal'.
    this.uiElements.storageNameTag.addEventListener('change', (event) => {
      // Set this.uiElements.storageNameTagModal to the same value as this.
      this.uiElements.storageNameTagModal.value = event.target.value;
      this.toggleStorageButtons();
    });
    this.uiElements.storageNameTagModal.addEventListener('dblclick', (event) => {
      if (event.target.tagName === 'OPTION') {
        this.copyStorageName();
      }
    });
    this.uiElements.storageNameTagModal.addEventListener('change', (event) => {
      // Set this.uiElements.storageNameTag to the same value as this.
      this.uiElements.storageNameTag.value = event.target.value;
      this.toggleStorageButtons(this.uiElements.storageNameTagModal);
    });

    this.uiElements.exportDataButton.addEventListener('click', this.handleExportData.bind(this));
    this.uiElements.exportAllDataButton.addEventListener('click', this.handleExportAllData.bind(this));
    this.uiElements.importDataButton.addEventListener('click', this.handleImportData.bind(this));
    this.uiElements.importBulkButton.addEventListener('click', this.handleBulkImportData.bind(this));

    this.uiElements.clumpFormId.addEventListener('submit', this.handleFormSubmit.bind(this));
    this.uiElements.clumpFormId.addEventListener('reset', this.handleFormReset.bind(this));

    // this.uiElements.settingsPanelToggle
    this.uiElements.settingsPanelToggle.addEventListener('click', this.togglePanel.bind(this));
    this.uiElements.exportPanelToggle.addEventListener('click', this.togglePanel.bind(this));
    // id="showIdsCheckbox"
    this.uiElements.showIdsCheckbox.addEventListener('change', this.toggleShowIds.bind(this));
    // id="exportReminderInput"
    this.uiElements.exportReminderInput.addEventListener('change', this.updateExportReminder.bind(this));
    // id="gridRepeatRangeInput" | Slider
    this.uiElements.gridRepeatRangeInput.addEventListener('input', this.updateGridRepeat.bind(this));
    // id="storageButtonDelete"
    this.uiElements.storageButtonDelete.addEventListener('click', this.deleteSelectedStorage.bind(this));
    // id="storageButtonUse"
    this.uiElements.storageButtonUse.addEventListener('click', this.useSelectedStorage.bind(this));
    // id="storageButtonUseModal"
    this.uiElements.storageButtonUseModal.addEventListener('click', this.useSelectedStorage.bind(this));
    // id="restoreBackupButton"
    this.uiElements.restoreBackupButton.addEventListener('click', this.restoreSelectedStorage.bind(this));
    // id="newStorageNameButton"
    this.uiElements.newStorageNameButton.addEventListener('click', () => {
      this.createNewStorage();
    });
    // id="newStorageRenameButton"
    this.uiElements.newStorageRenameButton.addEventListener('click', this.renameStorage.bind(this));
    // id="newStorageRenameCopy"
    this.uiElements.newStorageRenameCopy.addEventListener('click', this.copyStorageName.bind(this));
    this.uiElements.newStorageRenameCopy.setAttribute('title', AppConstants.storageNameCopyFlowNameText);

    // [Q] What's the purpose of this listener?
    // [A] It listens for changes to the 'AppSettingsInfo' in other tabs.
    window.addEventListener('storage', (event) => {
      // The event.key is the key of the storage item that was changed.
      if (event.key === AppConstants.localStorageSettingsKey) {
        const oldEventValues = JSON.parse(event.oldValue);
        const newEventValues = JSON.parse(event.newValue);

        const oldStorageNames = oldEventValues.storageNames;
        const newStorageNames = newEventValues.storageNames;
        const oldStorageNamesLength = oldStorageNames.length;
        const newStorageNamesLength = newStorageNames.length;

        let messageToDisplayOnOtherTabs = '';

        // [Q] Why are we only interested when storage names are added or deleted?
        // [A] My guess is this was the quickest check to see if changes were made to another tab.
        //     If so, we could potentially add checks for other 'AppSettingsInfo' values as well.
        if (oldStorageNamesLength !== newStorageNamesLength) {
          // Allows for the message to be dismissed.
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
            if (deletedName === this.getCurrentFlowName()) {
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
          this.addTextToCrossTabMessage(
            messageToDisplayOnOtherTabs,
            allowDismiss
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

  // [Tested]
  addTextToCrossTabMessage(
    messageToDisplayOnOtherTabs,
    allowDismiss = true
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

  // [Tested: No]
  dismissWarningMessage() {
    this.uiElements.crossTabWarning.classList.add('hidden');
  }

  // Check if 'AppSettingsInfo.storageIndex' reflects the same name as the currently active
  // storage name. If not, return. We DO NOT want to update a storage that doesn't exist, else
  // it will overwrite all the data in the next storage in the list and replace it with this data.
  // [Tested: No]
  checkIfStorageNameStillExists() {
    const currentStorageName = this.getCurrentFlowName().toLowerCase();
    const storageNameLabelTrimmed = this.uiElements.storageNameLabelCurrent.textContent.trim().toLowerCase();
    if (currentStorageName !== storageNameLabelTrimmed) {
      alert('The currently active storage name has been deleted.\n\nPlease refresh the page.');
      return false;
    }
    return true;
  }

  // [Tested: No]
  handleFormSubmit(event) {
    // clumpFormId.onsubmit = (event) => {
    event.preventDefault();

    // Ensure the currently active storage name is valid (prevent updating a non-existent storage).
    if (!this.checkIfStorageNameStillExists()) {
      // Show an error.
      alert('The currently active storage name has been deleted.\n\nPlease refresh the page.');
      return;
    }

    const currentClumpList = this.dataManager.getData('clumpList');
    let newClumpList = [];
    let newClump;

    const editIndex = this.dataManager.getData('editingIndex');
    const isNew = editIndex === null || editIndex === undefined;
    const isEdit = !isNew && editIndex > -1;

    if (
      this.uiElements.linkToId.selectedIndex === 0 &&
      this.uiElements.columnSelect.selectedIndex === -1
    ) {
      alert('Please select a clump to link to, or a column to add to.');
      return;
    }

    // Determine linking info based on the selected "Add to Column" option and link inputs.
    // If no option was selected due to there being no viable options enabled, just use 'last'.
    const columnRawValue = this.uiElements.columnSelect.selectedIndex === -1
        ? 'last'
        : this.uiElements.columnSelect.options[
            this.uiElements.columnSelect.selectedIndex
          ].value;
    const { isLinkedLeft, linkId } = currentClumpList.length === 0 || (isEdit && editIndex === 0)
        ? { isLinkedLeft: false, linkId: -1 }
        : this.getLinkInfo(columnRawValue);

    if (isNew) {
      //
      // **ADDING A NEW CLUMP**
      //
      const newClumpID = this.dataManager.getData('highestClumpId') + 1;

      newClump = new ClumpInfo();
      newClump.id = newClumpID;
      newClump.clumpName = this.uiElements.clumpNameInput.value;
      newClump.clumpCode = this.uiElements.clumpCodeInput.value;

      // Assign the parent link based on selection (linkedToLeft or linkedToAbove).
      if (isLinkedLeft) {
        newClump.linkedToLeft = linkId;
        newClump.linkedToAbove = -1;  // Ensure the alternate link field is cleared
      } else {
        newClump.linkedToAbove = linkId;
        newClump.linkedToLeft = -1;   // Clear the unused link field
      }

      // Handle cell insertion logic.
      // The helper will adjust any other clumps as needed when the structure is changed.
      // const newClumpList = [...currentClumpList, newClump]; // Append new clump immutably.
      newClumpList = this.handleClumpMovement(currentClumpList, newClump);

      // Note: lastAddedCol will be updated in renderMatrix based on the new matrix state.
      this.dataManager.setData('lastAddedClumpId', newClumpID);
      this.dataManager.setData('highestClumpId', newClumpID);

      this.dataManager.setData('clumpList', newClumpList);  // Save new list to 1D clumpList.
      this.dataManager.resetClumpListConverted();
      this.dataManager.addClumpsToMatrix();
      //
    } else {
      //
      // **EDITING AN EXISTING CLUMP**
      //
      AppConfig.debugConsoleLogs && console.log('clumpList before edit:', this.dataManager.getData('clumpList'));

      const editIndex = this.dataManager.getData('editingIndex');
      // Clone the targeted clump data to avoid mutating state directly, then apply form changes.
      const originalClump = this.dataManager.getData('clumpList')[editIndex];

      // > structuredClone | https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
      const newClumpObj = structuredClone(originalClump);
      newClump = ClumpInfo.fromJSON(newClumpObj);
      newClump.clumpName = this.uiElements.clumpNameInput.value;
      newClump.clumpCode = this.uiElements.clumpCodeInput.value;

      // Determine new parent link based on user selection and update the edited clump.
      if (isLinkedLeft) {
        newClump.linkedToLeft = linkId;
        newClump.linkedToAbove = -1; // Clear the above link if switching to a left link.
      } else {
        newClump.linkedToAbove = linkId;
        newClump.linkedToLeft = -1;  // Clear the left link if switching to an above link.
      }

      // Handle re-insertion logic if the link relationships changed.
      // The helper will adjust any other clumps as needed when the structure is changed.
      newClumpList = this.handleClumpMovement(currentClumpList, newClump, originalClump);

      AppConfig.debugConsoleLogs && console.log('clumpList after edit - before update:', this.dataManager.getData('clumpList'));

      // Update the data store with the edited clump and refreshed list.
      this.removePopUp();                                  // Close the edit form popup UI.
      this.dataManager.setData('editingIndex', null);      // Clear editing mode.
      this.dataManager.setData('clumpList', newClumpList);  // Save new list to 1D clumpList.
      this.dataManager.resetClumpListConverted();
      this.dataManager.addClumpsToMatrix();

      AppConfig.debugConsoleLogs && console.log('clumpList after edit - after update:', this.dataManager.getData('clumpList'));

      // Refresh UI elements related to data and selection.
      this.updateDataInHtml();       // Update debug info display (lastAddedClumpId, lastAddedCol, etc.)
      this.clearSelectedClumpNode(); // Remove highlight from the previously selected clump node.
    }

    // **Finalize: Persist data and refresh UI**
    this.dataManager.storeClumps(); // Save the clumps data to local storage (or backend)
    this.resetFormFields();         // Clear out the form inputs for next use
    this.renderMatrix();            // Re-render the clump matrix in the UI to reflect changes

    const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
    this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
    this.uiElements.outputContainer.style.height = howManyExpanded > 0
      ? 'calc(100vh - 42px - 260px)'
      : 'calc(100vh - 42px)';

    // Export Reminders
    this.adjustExportReminders();
  };

  //
  // Each flow name has its own counter that keeps track of the number of edits made.
  //
  // > 'exportReminderCounter': `<String, Int>{ 'flowName1': 0, 'flow_name2': 0, ... }`
  //
  // This function will increment the 'edit counter' for the active flow, and show a
  // dialog if the flow's counter is maxed according to the max reminder input setting.
  //
  // - After Form Submit - increment
  // - After Clump Delete - increment
  // - After Export Reset - set to 0 (set directly; doesn't use this function)
  //
  // > Max reminder (0 disables popup): this.appSettingsInfo.exportReminderValue
  // > (Max Reminder Setting: this.uiElements.exportReminderInput.value)
  //
  adjustExportReminders() {
    const reminderMaxValue = this.appSettingsInfo.exportReminderValue; // 10

    const activeFlowName = this.getCurrentFlowName();
    const currentCounter = this.appSettingsInfo.exportReminderCounter[activeFlowName];
    let newCount = 0;

    // If the storage name is not in the counter map,
    // or if its value was corrupted, initialize it to 1.
    if (
      !(activeFlowName in this.appSettingsInfo.exportReminderCounter) ||
      currentCounter === undefined
    ) {
      newCount = 1; // First save for this flow.
    } else {
      newCount = currentCounter + 1;
    }

    // Show reminder message if max reminder is not disabled,
    // and the new count is an even multiple of the reminder max value.
    if (
      reminderMaxValue > 0 &&
      (newCount % reminderMaxValue) === 0
    ) {
      this.addTextToCrossTabMessage(
        AppConstants.defaultExportReminderMessage
      );
    }

    // Update live app settings.
    this.appSettingsInfo.exportReminderCounter[activeFlowName] = newCount;
    // Update status panel.
    this.uiElements.exportReminderCount.textContent = newCount.toString();
    // Persist settings.
    this.storeSettings();

    AppConfig.debugConsoleLogs && console.log(
      '*** [AppSettings] [Export Reminder Counter] [Incremented]:',
      `[${this.appSettingsInfo.exportReminderCounter[activeFlowName]}]`
    );
  }

  /**
   * Adjusts clump positions in the list when a clump's linkage (parent) changes.
   * This function handles reassigning related clumps and reordering the clump list to maintain a valid structure.
   * @param {Array} clumpList - The current list of all clump objects (before edit).
   * @param {Object} clumpToInsert - The clump data; either new or after edits (with updated link fields).
   * @param {Object} originalClump - The original clump data (before edits).
   * @returns {Array} - A new clump list with clumps repositioned as needed.
  */
  // [Tested: No]
  handleClumpMovement(clumpList, clumpToInsert, originalClump) {
    const insertionClumpId = clumpToInsert.id;
    const newAbove = clumpToInsert.linkedToAbove;
    const newLeft = clumpToInsert.linkedToLeft;

    const isAdd = typeof originalClump === 'undefined' || originalClump === null;
    const oldAbove = isAdd ? -1 : originalClump.linkedToAbove;
    const oldLeft = isAdd ? -1 : originalClump.linkedToLeft;

    let updatedClumpList = [];

    // CASE 1: C1R1 | First cell | Add and return
    // There is no need to do any link analyses for the first cell.
    if (clumpList.length === 0) {
      updatedClumpList = [clumpToInsert];
      return updatedClumpList;
    } else if (clumpToInsert.linkedToAbove === -1 && clumpToInsert.linkedToLeft === -1) {
      // The first cell is the only cell that can have both 'linkedTo' values set to '-1'.
      // And because the 'clumpList' isn't empty, we can just replace the first cell in the list.
      updatedClumpList = [clumpToInsert, ...clumpList.slice(1)];
      return updatedClumpList;
    }

    // CASE 2: C1R2 | Second cell | No movement
    //         If editing, and the linkage hasn't changed
    //         (same parent as before), no reposition is needed.
    const linkUnchanged = !isAdd && oldAbove === newAbove && oldLeft === newLeft;
    if (linkUnchanged) {
      // Simply replace the clump in the list with the updated data.
      updatedClumpList = clumpList.map(clump => clump.id === insertionClumpId ? clumpToInsert : clump);
      return updatedClumpList;
    }

    //

    // ### RIGHT
    // const cellToRightId = isAdd ? -1 : this.dataManager.cellIdToRight(insertionClumpId);
    // const subtreeRightTail = cellToRightId === -1 ? [] : this.dataManager.collectSubtreeIdsBelow(cellToRightId);
    // const subtreeFullRightTail = cellToRightId === -1 ? [] : [cellToRightId, ...subtreeRightTail];
    // const subtreeFullRightTailClumps = subtreeFullRightTail.map(id => clumpList.find(clump => clump.id === id));

    // ### BELOW
    //
    // Collect the subtree below the insertion point (if any).
    // This will include all clumps below the insertion point in the same column.
    // This is used to determine the tail of clumps below the insertion point.
    const cellBelowId = isAdd ? -1 : this.dataManager.cellIdBelow(insertionClumpId);
    const subtreeBelowTail = cellBelowId === -1 ? [] : this.dataManager.collectSubtreeIdsBelow(cellBelowId);
    const subtreeFullBelowTail = cellBelowId === -1 ? [] : [cellBelowId, ...subtreeBelowTail];
    // const subtreeFullBelowTailClumps = subtreeFullBelowTail.map(id => clumpList.find(clump => clump.id === id));

    // ### FULL TAILS
    //
    // This list is the same as the two above combined.
    const subtreeBothTails = isAdd ? [] : this.dataManager.collectSubtreeIdsFullTail(insertionClumpId);
    const subtreeBothTailsClumps = subtreeBothTails.map(id => clumpList.find(clump => clump.id === id));

    // CASE 3: C1R2 | Add a cell below the linkedToAbove ID
    //   - If a cell exists below the target cell, its linkedToAbove will change
    //       from the target cell to the last cell in the below tail.
    if (newAbove !== -1) {
      const targetClumpIndex = clumpList.findIndex(clump => clump.id === newAbove);

      const clumpListSliceStart = clumpList.slice(0, targetClumpIndex + 1).filter(clump =>
        !subtreeBothTails.includes(clump.id)
          && clump.id !== insertionClumpId);
      const clumpListSliceEnd = clumpList.slice(targetClumpIndex + 1).filter(clump =>
        !subtreeBothTails.includes(clump.id)
          && clump.id !== insertionClumpId
      );

      const cellBelowTargetClump = clumpList.find(clump => clump.linkedToAbove === newAbove);
      const cellBelowTargetClone = cellBelowTargetClump === undefined ? undefined : cellBelowTargetClump.clone();

      if (cellBelowTargetClone !== undefined) {
        const subtreeBelowTailLastId = subtreeFullBelowTail.length === 0
            ? insertionClumpId
            : subtreeFullBelowTail[subtreeFullBelowTail.length - 1];
        // If we're adding, the 'insertionClumpId' is the cell being linked to
        //   (because a new clump has no tail, but where it's being inserted might).
        // If we're editing, the 'insertionClumpId' is the cell being edited
        //   (because we need its tail).
        cellBelowTargetClone.linkedToAbove = isAdd ? insertionClumpId : subtreeBelowTailLastId;

        // Update 'clumpListSliceEnd' with the updated 'cellBelowTargetClone'.
        const clumpListSliceEndIndex = clumpListSliceEnd.findIndex(clump => clump.id === cellBelowTargetClone.id);
        if (clumpListSliceEndIndex !== -1) {
          clumpListSliceEnd[clumpListSliceEndIndex] = cellBelowTargetClone;
        } else {
          const clumpListBothTailsIndex = subtreeBothTailsClumps.findIndex(clump => clump.id === cellBelowTargetClone.id);
          subtreeBothTailsClumps[clumpListBothTailsIndex] = cellBelowTargetClone;
        }
      }

      updatedClumpList = [
        ...clumpListSliceStart,
        clumpToInsert,
        ...subtreeBothTailsClumps,
        ...clumpListSliceEnd
      ].filter(clump => clump !== undefined);

      return updatedClumpList;
    }

    // CASE 4: C1R3 | Edit a cell's vertical position
    //   [ ] If moved down
    //   	   - Cell below it moves up (replace it with the moved cell's linkedToAbove)
    //   	   - Change linkedToAbove from target cell to the moved cell
    //   	   - If a cell is below the target cell, its linkedToAbove will become the
    //         last cell's ID in the column.
    //   [ ] If moved up
    //   	   - Entire below tail moves up, and any existing cells below the move-to cell will be
    //       moved to the bottom of the moved cell's below tail

    // CASE 5: C2R1 | Cell that is linkedToLeft > 0
    //         Can only be moved to a cell that is not already linked to another cell.
    if (newLeft !== -1) {
      // If linkedToLeft,
      //   1) remove the full tail, if any, from the list, then
      //   2) inject new clump, and its full subtree (if any), to the right of the linked clump.
      const leftClumpIndex = clumpList.findIndex(clump => clump.id === newLeft);

      const clumpListSliceStart = clumpList.slice(0, leftClumpIndex + 1).filter(clump =>
        !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId
      );
      const clumpListSliceEnd = clumpList.slice(leftClumpIndex + 1).filter(clump =>
        !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId
      );

      updatedClumpList = [
        ...clumpListSliceStart,
        clumpToInsert,
        ...subtreeBothTailsClumps,
        ...clumpListSliceEnd
      ];

      return updatedClumpList;
    }

    // If no cases above are met, return the original clump list.
    alert('Debug error: No cases met for clump movement. Please notify the developer.');
    console.error('DEBUG ERROR: ***** ***** ***** ***** *****.');
    console.error('DEBUG ERROR: NO CASES MET FOR CLUMP MOVEMENT. Please notify the developer.');
    console.error('DEBUG ERROR: ***** ***** ***** ***** *****.');
    return clumpList;
  }

  // [Tested: No]
  get getByLinkNotColumn() {
    const newLinkToIdFromUI = parseInt(this.uiElements.linkToId.value, 10) || -1;
    // const getByLinkNotColumn = !isNaN(newLinkToIdFromUI) && newLinkToIdFromUI > 0;
    return !isNaN(newLinkToIdFromUI) && newLinkToIdFromUI > 0;
  }

  // [Tested: No]
  get isLinkToLeftSelected() {
    // const isLinkedLeft = getByLinkNotColumn && this.uiElements.linkedToLeft.checked;
    return this.getByLinkNotColumn && this.uiElements.linkedToLeft.checked;
  }

  // [Tested: No]
  getLinkInfo(columnRawValue) {
    const returnObject = {
      isLinkedLeft: false,
      linkId: -1,
    };

    const newLinkToIdFromUI = parseInt(this.uiElements.linkToId.value, 10) || -1;

    // Clump cell placement has 2 options:
    //
    // [Linked][toLeft]
    // 1. Add to the same row as the linked clump, in the next column.
    //
    // [Linked][toAbove]
    // 2. When 'Last' is selected, add new clump to the last column that had a clump added to it.
    // 3. Add to a specific column.
    //
    // The 'Add to Column' dropdown is a shortcut to linking the cell
    //   to either the 'Last Added' clump, or the last clump in a
    //   specific column using the 'above' option.
    //   This dropdown is disabled (irrelevant) when the 'Link to Clump' is not 'None'.
    //
    if (this.isLinkToLeftSelected) {
      returnObject.isLinkedLeft = true;
      returnObject.linkId = newLinkToIdFromUI;
      // clump.linkedToLeft = newLinkToIdFromUI;
    } else {
      // We need to determine the ID of the clump to link to.
      const isLinkedAbove = this.getByLinkNotColumn && this.uiElements.linkedToAbove.checked;
      const columnValue = parseInt(columnRawValue, 10) || this.dataManager.getData('lastAddedCol');

      // The parent cell ID to link to (above) is either:
      // - a selected link ID from the UI (with the 'above' option selected),
      // - the last added clump ID (from the 'column select' dropdown), or
      // - the last ID from a selected column.
      const linkToAboveId = isLinkedAbove
          ? newLinkToIdFromUI
          : columnRawValue === 'last'
              ? this.dataManager.getData('lastAddedClumpId')
              : this.dataManager.lastIdFromColumn(columnValue);
      returnObject.isLinkedLeft = false;
      returnObject.linkId = linkToAboveId;
      // clump.linkedToAbove = linkToAboveId;
    }
    return returnObject;
  }

  // [Tested: No]
  enableDisableLinkToFields(onOrOff) {
    this.uiElements.linkToId.disabled = onOrOff;
    this.uiElements.linkedToLeft.disabled = onOrOff;
    this.uiElements.linkedToAbove.disabled = onOrOff;
  }

  // [Tested: No]
  enableDisableColumnSelect() {
    this.uiElements.columnSelect.disabled =
        this.uiElements.linkToId.value !== '' ||
        this.dataManager.getData('editingIndex') === 0;
  }

  // [Tested: No]
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

    // Enable 'linkTo' dropdown and radios: | disabled => editingIndex == 0
    this.enableDisableLinkToFields(this.dataManager.getData('editingIndex') === 0);

    // Enable 'columnSelect' dropdown:
    this.enableDisableColumnSelect();
  }

  // When canceling an edit, reset the 'editingIndex' to null, and remove the
  // last 'Link to Clump' dropdown option if it is the same as the original 'linkedClumpID'.
  // [Tested: No]
  handleFormReset(event) {
    event?.preventDefault();

    this.dataManager.setData('editingIndex', null);

    // Reset the form fields.
    this.resetFormFields();

    // Leaving the form popped open for additional adds, but will close for edits.
    this.removePopUp();

    this.uiElements.saveClumpButton.disabled = this.uiElements.clumpNameInput.value.trim() === '';

    this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
    this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    this.updateDataInHtml();
    // This will clear the 'edit border' from the selected clump node.
    this.clearSelectedClumpNode();
  }

  // Reset the export reminder counter for the active flow.
  resetExportReminder() {
    const activeFlowName = this.getCurrentFlowName();
    const reminderCounter = this.appSettingsInfo.exportReminderCounter; // {}
    reminderCounter[activeFlowName] = 0;
    // Update status panel.
    this.uiElements.exportReminderCount.textContent = 0;
    // Persist settings.
    this.storeSettings();
  }

  resetAllExportReminders() {
    Object.keys(this.appSettingsInfo.exportReminderCounter).forEach((flowName) => {
      this.appSettingsInfo.exportReminderCounter[flowName] = 0;
    });
    // Update status panel.
    this.uiElements.exportReminderCount.textContent = '0';
    // Persist settings.
    this.storeSettings();
  }

  // [Tested: No]
  handleExportAllData() {
    AppConfig.debugConsoleLogs && console.log('[AppSettings] handleExportAllData');

    // Populate the 'export list' by retrieving the data
    // from localStorage based on the storage name.
    (async () => {
      for (const storageName of this.appSettingsInfo.storageNames) {
        this.dataManager.setClumpExportList(storageName);
        AppConfig.debugConsoleLogs &&
            console.log(`[AppSettings] Exporting storage name: ${storageName}`);
        // Add a small breather between exports.
        await new Promise(resolve => setTimeout(resolve, 500));
        this.exportStorageName(storageName, this.dataManager.clumpExportList);
      }
      this.resetAllExportReminders();
      this.dismissWarningMessage();
    })();
  }

  // [Tested: No]
  handleExportData() {
    if (this.dataManager.getData('clumpList').length === 0) {
      alert('There is no data to export.');
      return;
    }
    const currentStorageLabelName = this.uiElements.storageNameLabelCurrent.textContent.trim();
    this.exportStorageName(currentStorageLabelName);

    this.resetExportReminder();

    // Dismiss export reminder message if showing.
    this.dismissWarningMessage();
  }

  // [Tested: No]
  exportStorageName(currentStorageLabelName, storedData = this.dataManager.getData('clumpList')) {
    const exportName = currentStorageLabelName === AppConstants.defaultStorageName
      ? AppConstants.defaultExportStorageName
      : currentStorageLabelName;

    FileHandler.handleExportData({
      clumpListToExport: storedData,
      storageName: exportName
    });
  }

  // [Tested: No]
  async handleImportData() {
    const importedDataArray = await FileHandler.resolveClumpsFromFile();

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
        DataDefaultMaps.dataDefaultMap().lastAddedClumpId,
        DataDefaultMaps.dataDefaultMap().highestClumpId,
      );

      // Update UI.
      this.uiElements.clumpFormId.reset();
      this.uiElements.outputContainer.style.marginBottom = '0';
      this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
      this.updateDataInHtml();
      this.renderMatrix();
    }
  }

  // [Tested: No]
  async handleBulkImportData() {
    // Map of filenames and their clumps.
    //   > const filenameClumpsMap = new Map();
    //   > filenameClumpsMap.set(result.filename, result.clumps);
    const importedStorageNameMaps = await FileHandler.resolveFilenamesAndClumpsFromFile();

    if (
      typeof importedStorageNameMaps !== 'undefined' &&
      FileHandler.objIsMap(importedStorageNameMaps) &&
      importedStorageNameMaps.size > 0
    ) {
      // Store imported lists to localStorage.
      //   importedStorageLists = returnMap // new Map();
      //   | returnMap.set('importedStorageNames'
      //   | returnMap.set('duplicateStorageNames'
      const importedStorageLists = this.dataManager.storeBulkAppData(
        importedStorageNameMaps,
      );

      // Create a new storage name list with the imported names.
      // The list will be sorted below, in 'this.storeSettings()'.
      this.appSettingsInfo.storageNames = [
        ...this.appSettingsInfo.storageNames,
        ...importedStorageLists.get('importedStorageNames'),
        // Duplicate storage names are added with a timestamp suffix.
        ...importedStorageLists.get('duplicateStorageNames')
      ];

      // Sort the storage names, then update the 'AppSettingsInfo' and dropdown lists.
      this.storeSettings();
      this.updateStorageNameDropdownOptions();

      // Inform the user if any storage names were duplicates.
      if (importedStorageLists.get('duplicateStorageNames').length > 0) {
        const errMsg = `The following storage names were duplicates and had timestamps added to them:
<br><br>
- ${importedStorageLists.get('duplicateStorageNames').join('<br>- ')}
<br><br>
You can now compare them with existing lists.`;
        this.showStorageError(errMsg);
      } else {
        const successMsg = `Congratulations!
<br><br>
All selected storage names have been imported.
<br><br>
You can now escape, and activate them on the main screen.`;
        this.showStorageError(successMsg);
      }
    }
  }

  //
  // @TODO: Extract these into a base 'UIInterface' class that can be extended.
  //        May need to rethink how to shape these classes based on
  //        where the data should reside based on where it is used most.
  //

  // Regular expression (regex) to validate storage names.
  // Also checks if the name is already in the list.
  // [Tested: No]
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

  // [Tested: No]
  checkIfStorageNameExists(keyName) {
    // return storageNames.includes(keyName);
    // 'includes' is case-sensitive, so we need to lowercase all the names.
    return this.appSettingsInfo.storageNames.map(name => name.toLowerCase()).includes(keyName.toLowerCase());
  }

  // Sort the storage names alphabetically and return.
  // We'll sort by 'localeCompare', but keep 'default' at index 0.
  // [Tested: No]
  sortStorageNames() {
    const sortedNames = this.appSettingsInfo.storageNames.toSorted((a, b) => a.localeCompare(b));
    const defaultIndex = sortedNames.indexOf(AppConstants.defaultStorageName);
    if (defaultIndex > 0) {
      // Remove 'default' from the list and add it to the top.
      sortedNames.splice(defaultIndex, 1);
      sortedNames.unshift(AppConstants.defaultStorageName);
    }
    return sortedNames;
  }

  // [Tested: No]
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
  // [Tested: No]
  classListChain(htmlElement) {
    var elementClassList = htmlElement.classList;
    return {
      toggle: function (c) { elementClassList.toggle(c); return this; },
      add: function (c) { elementClassList.add(c); return this; },
      remove: function (c) { elementClassList.remove(c); return this; }
    };
  }

  // [Tested: No]
  storeSettings(updateDataManager = true) {
    // Sort storageNames prior to storage.
    const oldSelectedFlowName = this.getCurrentFlowName();
    const sortedStorageNames = this.sortStorageNames();
    this.appSettingsInfo.storageNames = sortedStorageNames;
    const newIndex = sortedStorageNames.indexOf(oldSelectedFlowName);
    this.appSettingsInfo.storageIndex = newIndex === -1 ? 0 : newIndex;

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

  // - If the selected storage name is:
  // - 'default':
  //   - Disable 'Delete Selected'.
  // - the currently active storage name:
  //   - Disable both buttons.
  // [Tested: No]
  toggleStorageButtons(
    selectToCheck = this.uiElements.storageNameTag
  ) {
    const selectedIndexSrc = selectToCheck.selectedIndex;
    const selectedStorageNameSrc = this.appSettingsInfo.storageNames[selectedIndexSrc];
    const isDefaultSrc = selectedStorageNameSrc === AppConstants.defaultStorageName;
    const isActiveSrc = selectedIndexSrc === this.appSettingsInfo.storageIndex;

    const newStorageNameValue = this.uiElements.newStorageNameInput.value.trim();
    const isInList = this.checkIfStorageNameExists(newStorageNameValue);
    const isValid = this.isValidKeyName(newStorageNameValue);

    // Strip tags from: storageNameErrTextInvalid
    const strippedErrText = AppConstants.storageNameErrTextInvalid.replace(/<[^>]*>/g, '');

    // Button: Create ['New Flow'] | Modal
    // Enable 'New Storage' button text if 'newStorageNameInput' value is valid.
    if (newStorageNameValue === '') {
      // 'isValid' also checks for an empty value, so this check needs
      // to come first so we can provide a more specific error message.
      this.uiElements.newStorageNameButton.setAttribute('disabled', true);
      this.uiElements.newStorageNameButton.setAttribute('title', AppConstants.storageNameErrTextNameEmpty);
    } else if (isInList) {
      this.uiElements.newStorageNameButton.setAttribute('disabled', true);
      this.uiElements.newStorageNameButton.setAttribute('title', AppConstants.storageNameErrTextNameExists);
    } else if (!isValid) {
      this.uiElements.newStorageNameButton.setAttribute('disabled', true);
      this.uiElements.newStorageNameButton.setAttribute('title', strippedErrText);
    } else {
      this.uiElements.newStorageNameButton.removeAttribute('disabled');
      this.uiElements.newStorageNameButton.removeAttribute('title');
    }

    if (isDefaultSrc || isActiveSrc) {
      // Button: ['Activate Selected'] | Main
      if (isActiveSrc) {
        this.uiElements.storageButtonUse.setAttribute('disabled', true);
        this.uiElements.storageButtonUse.setAttribute('title', AppConstants.storageNameErrUseText);
        this.uiElements.storageButtonUseModal.setAttribute('disabled', true);
        this.uiElements.storageButtonUseModal.setAttribute('title', AppConstants.storageNameErrUseText);
      } else {
        this.uiElements.storageButtonUse.removeAttribute('disabled');
        this.uiElements.storageButtonUse.removeAttribute('title');
        this.uiElements.storageButtonUseModal.removeAttribute('disabled');
        this.uiElements.storageButtonUseModal.removeAttribute('title');
      }

      // Button: ['Delete Selected'] | Modal
      this.uiElements.storageButtonDelete.setAttribute('disabled', true);
      this.uiElements.storageButtonDelete.setAttribute('title', AppConstants.storageNameErrDelText);

      // Button: ['Rename Selected'] | Modal
      // @TODO: Renaming the current ('isActiveSrc') may be doable,
      //        but was concerned about having to re-render the matrix (and losing the modal).
      //        But that re-render may not be necessary.
      this.uiElements.newStorageRenameButton.setAttribute('disabled', true);
      this.uiElements.newStorageRenameButton.setAttribute('title', AppConstants.storageNameErrRenameText);
    } else {
      // Button: ['Activate Selected'] | Main
      this.uiElements.storageButtonUse.removeAttribute('disabled');
      this.uiElements.storageButtonUse.removeAttribute('title');
      this.uiElements.storageButtonUseModal.removeAttribute('disabled');
      this.uiElements.storageButtonUseModal.removeAttribute('title');

      // Button: ['Delete Selected'] | Modal
      this.uiElements.storageButtonDelete.removeAttribute('disabled');
      this.uiElements.storageButtonDelete.removeAttribute('title');

      // Button: ['Rename Selected'] | Modal
      if (newStorageNameValue === '') {
        // Disable 'Rename Selected' button if the new name is empty.
        this.uiElements.newStorageRenameButton.setAttribute('disabled', true);
        this.uiElements.newStorageRenameButton.setAttribute('title', AppConstants.storageNameErrTextNameEmpty);
      } else if (isInList) {
        // Disable 'Rename Selected' button if the case-insensitive new name already exists.
        this.uiElements.newStorageRenameButton.setAttribute('disabled', true);
        this.uiElements.newStorageRenameButton.setAttribute('title', AppConstants.storageNameErrTextNameExists);
      } else if (!isValid) {
        // Disable 'Rename Selected' button if the new name is invalid.
        this.uiElements.newStorageRenameButton.setAttribute('disabled', true);
        this.uiElements.newStorageRenameButton.setAttribute('title', strippedErrText);
      } else {
        // Enable 'Rename Selected' button.
        this.uiElements.newStorageRenameButton.removeAttribute('disabled');
        this.uiElements.newStorageRenameButton.removeAttribute('title');
      }
    }

    // Button: 'Restore Auto-Backup' | Modal
    // Enable or disable the 'Restore Auto-Backup' button based on backup data.
    //
    const selectedStorageNameSrcBackup = `${selectedStorageNameSrc}_backup`;
    const currentList = this.dataManager.parseClumpExportListFromStorage(selectedStorageNameSrc);
    const backupData = this.dataManager.parseClumpListFromStorage(selectedStorageNameSrcBackup);
    const listsMatch = currentList.length === backupData.length &&
        currentList.every((clump, index) => ClumpInfo.isEqual(clump, backupData[index]));

    // if (backupData.length === 0 || listMatch) {
    // Only enable restore backup button if a backup exists and the selected list is active.
    if (isActiveSrc && backupData.length > 0 && !listsMatch) {
      this.uiElements.restoreBackupButton.removeAttribute('disabled');
      this.uiElements.restoreBackupButton.removeAttribute('title');
    } else {
      this.uiElements.restoreBackupButton.setAttribute('disabled', true);
      this.uiElements.restoreBackupButton.setAttribute('title', AppConstants.storageNameErrBackupText);
    }

    if (isValid && !isInList) {
      this.hideStorageError();
    }
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for the grid repeat setting.
  //

  // [Tested: No]
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

  // [Tested: No]
  toggleShowIds(event) {
    AppConfig.debugConsoleLogs && console.log('Checkbox is checked:', event.target.checked);
    this.appSettingsInfo.showIds = event.target.checked;
    this.storeSettings();
    this.renderMatrix();
  }

  // [Tested: No]
  updateExportReminder(event) {
    AppConfig.debugConsoleLogs && console.log('Value is:', event.target.value);
    this.appSettingsInfo.exportReminderValue = event.target.value;
    this.storeSettings();
  }

  // HTML Slider with options that will update the grid repeat:
  // > ['auto', '1fr', '150px', '200px', '250px', '300px']
  //
  // [Tested: No]
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

  // [Tested: No]
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

    // Export reminder count.
    this.uiElements.exportReminderCount.textContent =
        this.appSettingsInfo.exportReminderCounter[this.getCurrentFlowName()] || 0;
  }

  //
  // @TODO: Extract these to a 'UIInterface' class for dropdowns.
  //

  // [Tested: No]
  updateLinkToDropdownOptions() {
    this.uiElements.linkToId.innerHTML = '<option value="">None</option>';

    // This map extrapolates in-use linkTo IDs so they are not
    // shown in the dropdown (because they're already linked to).
    const editingIndex = this.dataManager.getData('editingIndex');

    const tempClumpList = this.dataManager.getData('clumpList');
    const fullTail = editingIndex === null ? [] : this.dataManager.collectSubtreeIdsFullTail(tempClumpList[editingIndex].id);
    const linkedClumpIDs = tempClumpList.map(clump => clump.linkedToLeft);
    const linkedClumpID = editingIndex === null ? -2 : tempClumpList[editingIndex].linkedToLeft;

    const optionsInTail = [];
    const optionsNotInTail = [];
    tempClumpList.forEach((clump, index) => {
      // You can't link a clump to itself.
      if (editingIndex !== index) {
        // If 'linkToLeft' is checked, only show clumps that are not already linked to.
        // Otherwise, all clumps can be linked to 'above', even those with an existing link
        // (in which case, the existing link will be moved to the new clump's ID; i.e. pushed down).
        if (
          // If 'isLeft' is checked, and
          //   the clump is either the currently linked clump, or already linked to.
          (
            this.uiElements.linkedToLeft.checked &&
            !fullTail.includes(clump.id) &&
            (clump.id === linkedClumpID || !linkedClumpIDs.includes(clump.id))
          ) ||
          // else, 'isAbove' can link to any clump.
          !this.uiElements.linkedToLeft.checked
        ) {
          const option = document.createElement('option');
          option.value = clump.id;
          // An asterisk (*) indicates the clump is in the tail of the clump being edited.
          // Moving a clump into its own tail is not currently supported.
          if (fullTail.includes(clump.id)) {
            option.textContent = `(*) ${clump.clumpName}`;
            option.disabled = true;
            option.style.color = 'gray';
            optionsInTail.push(option);
          } else {
            option.textContent = clump.clumpName;
            optionsNotInTail.push(option);
          }
        }
      }
    });

    const fragmentNotInTail = document.createDocumentFragment();
    optionsNotInTail.forEach(option => fragmentNotInTail.appendChild(option));
    this.uiElements.linkToId.appendChild(fragmentNotInTail);

    const fragmentInTail = document.createDocumentFragment();
    optionsInTail.forEach(option => fragmentInTail.appendChild(option));
    this.uiElements.linkToId.appendChild(fragmentInTail);

    // The following is commented because we can now
    // edit 'column' (now 'linkedToLeft') and 'linkTo' (now 'linkedToAbove') properties.
    // this.uiElements.linkToId.disabled = this.dataManager.getData('editingIndex') !== null;
  }

  // [Tested: No]
  updateColumnSelectDropdownOptions() {
    const isEdit = this.dataManager.getData('editingIndex') !== null;
    const editId = isEdit ? this.dataManager.getData('clumpList')[this.dataManager.getData('editingIndex')].id : -1;
    const editColumn = isEdit ? this.dataManager.getData('clumpColumnMap').get(editId) : -1;

    this.uiElements.columnSelect.innerHTML = '';

    const optionLast = document.createElement('option');
    optionLast.value = 'last';
    optionLast.textContent = 'Under Last';
    optionLast.disabled = isEdit && this.dataManager.getData('lastAddedCol') >= editColumn;
    this.uiElements.columnSelect.appendChild(optionLast);

    // Using 'clumpMatrix', this will yield a list of available columns
    // (which the UI uses for the 'Column to Add To' dropdown).
    const columns = this.dataManager.getData('clumpMatrix').length > 0
      ? Array.from({ length: this.dataManager.getData('clumpMatrix')[0].length }, (_, index) => index + 1)
      : [1];
    columns.forEach(column => {
      const option = document.createElement('option');
      option.value = column;
      option.textContent = `Column ${column}`;
      option.disabled = isEdit && column >= editColumn;
      this.uiElements.columnSelect.appendChild(option);
    });

    this.enableDisableColumnSelect();

    // We can now edit 'column' (now 'linkedToLeft') and 'linkTo' (now 'linkedToAbove') properties.
    // this.uiElements.columnSelect.disabled = this.dataManager.getData('editingIndex') !== null;
  }

  // [Tested: No]
  updateStorageNameDropdownOptions() {
    this.uiElements.storageNameTag.innerHTML = '';
    this.uiElements.storageNameTagModal.innerHTML = '';

    this.appSettingsInfo.storageNames.forEach((storageName, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = storageName;
      if (index === this.appSettingsInfo.storageIndex) {
        // option.selected = true; // This doesn't show up in Dev Tools.
        option.setAttribute('selected', 'selected');
      }
      this.uiElements.storageNameTag.appendChild(option);
      // Clone the option element for the modal dropdown
      this.uiElements.storageNameTagModal.appendChild(option.cloneNode(true));
    });
    this.uiElements.storageNameTag.value = this.appSettingsInfo.storageIndex;
    this.uiElements.storageNameTagModal.value = this.appSettingsInfo.storageIndex;

    // Set dropdown size (in the modal) to a length of 'appSettingsInfo.storageNames'.
    this.uiElements.storageNameTagModal.size = this.appSettingsInfo.storageNames.length;
  }

  //
  // @TODO: Extract these to an 'AppForm' class.
  //

  // [Tested: No]
  loadForEdit(index, event) {
    event.stopPropagation();

    AppConfig.debugConsoleLogs &&
      console.log('Editing clump:', this.dataManager.getData('clumpList')[index]);

    this.dataManager.setData('editingIndex', index);

    const clump = this.dataManager.getData('clumpList')[index];
    const clumpIsLinkedLeft = clump.linkedToLeft !== -1;

    this.uiElements.clumpNameInput.value = clump.clumpName;
    this.uiElements.clumpCodeInput.value = clump.clumpCode;

    this.uiElements.linkedToLeft.checked = clumpIsLinkedLeft;
    this.uiElements.linkedToAbove.checked = clump.linkedToAbove !== -1;

    // All existing clumps are linked, either 'left' or 'above' (and index: 0 cannot be moved).
    // The 'column select' dropdown will re-enable when a 'linkTo' is set to 'None'.
    this.uiElements.columnSelect.disabled = true; // index !== 0 ;

    if (index === 0) {
      // Disable 'linkTo' dropdown and radios:
      this.enableDisableLinkToFields(true); // disabled == true => disable
    } else {
      // Enable 'linkTo' dropdown and radios:
      this.enableDisableLinkToFields(false); // disabled == false => enable
      this.updateLinkToDropdownOptions(); // Updates list and toggles disabled.
      this.updateColumnSelectDropdownOptions(); // Toggles disabled.
    }

    this.updateDataInHtml();
    this.selectClumpNode(event.target);

    this.uiElements.linkToId.value = clumpIsLinkedLeft ? clump.linkedToLeft : clump.linkedToAbove;

    // This needs to be run after the 'linkTo' dropdown value is updated.
    this.enableDisableColumnSelect();

    // Set focus to the 'clump name' input field.
    this.uiElements.clumpNameInput.focus();
  }

  // Clear the 'clump-node-selected' class from all clump nodes.
  // [Tested: No]
  clearSelectedClumpNode() {
    const clumpNodes = document.querySelectorAll('.clump-node');
    clumpNodes.forEach(node => node.classList.remove('clump-node-selected'));
  }

  // [Tested: No]
  selectClumpNode(eventTarget) {
    this.clearSelectedClumpNode();
    // Add class to selected clump node.
    eventTarget.parentElement.parentElement.classList.add('clump-node-selected');
  }

  deleteLastClump(event, clumpId) {
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

      // Cancel/reset clump form.
      this.handleFormReset();

      const getClumpList = this.dataManager.getData('clumpList');

      const clumpIndex = getClumpList.findIndex(clump => clump.id === clumpId);

      if (this.dataManager.getData('editingIndex') === clumpIndex) {
        this.dataManager.setData('editingIndex', null);
      }

      const clumpListSpliced = [...getClumpList];

      const clumpFound = getClumpList[clumpIndex];
      const clumpBelowIndex = getClumpList.findIndex(clump => clump.linkedToAbove === clumpFound.id);

      if (clumpBelowIndex !== -1) {
        // Replace the clump below with links from the clump above.
        const clumpBelow = getClumpList[clumpBelowIndex];
        clumpBelow.linkedToAbove = clumpFound.linkedToAbove;
        clumpBelow.linkedToLeft = clumpFound.linkedToLeft;
        clumpListSpliced[clumpBelowIndex] = clumpBelow;
      }

      // Now we can remove the clump from the list.
      clumpListSpliced.splice(clumpIndex, 1);
      this.dataManager.setData('clumpList', clumpListSpliced);

      // Update global variables.
      if (clumpFound.id === this.dataManager.getData('lastAddedClumpId')) {
        this.dataManager.setData(
          'lastAddedClumpId',
          clumpListSpliced.length > 0
              ? clumpListSpliced[clumpListSpliced.length - 1].id
              : DataDefaultMaps.dataDefaultMap().lastAddedClumpId
        );
        this.dataManager.setLastAdded();
      }
      this.dataManager.setData(
        'highestClumpId',
        getClumpList.length > 0
          ? getClumpList.reduce((max, clump) => Math.max(max, clump.id), 0)
          : 0
      );

      // Remove the clump from the clumpColumnMap.
      this.dataManager.removeClumpInClumpColumnMap(clumpFound.id);

      // Clear matrix and re-add all clumps.
      this.dataManager.resetClumpListConverted();
      this.dataManager.addClumpsToMatrix();
      this.dataManager.storeClumps();

      // Increment the export reminder counter.
      this.adjustExportReminders();

      this.updateDataInHtml();
      this.renderMatrix();

      const howManyExpanded = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
      this.uiElements.outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
      this.uiElements.outputContainer.style.height = howManyExpanded > 0
        ? 'calc(100vh - 42px - 260px)'
        : 'calc(100vh - 42px)';
    }
  }

  // [Tested: No]
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
  // [Tested: No]
  createNewStorage(isRename = false) {
    // Temporarily disable the new storage button to prevent double-clicks.
    this.uiElements.newStorageNameButton.disabled = true;
    this.uiElements.newStorageRenameButton.disabled = true;

    const trimmedStorageName = this.uiElements.newStorageNameInput.value.trim();

    AppConfig.debugConsoleLogs &&
      console.log('Create new storage:', trimmedStorageName);

    if (this.isValidKeyName(trimmedStorageName)) {
      this.hideStorageError();
      setTimeout(() => {
        // Reset input field.
        this.uiElements.newStorageNameInput.value = '';
        // Reset error message.
        this.uiElements.storageNamingError.innerHTML = '';
        // Remove temporary disablement of the new storage button.
        this.uiElements.newStorageNameButton.disabled = false;
        this.uiElements.newStorageRenameButton.disabled = false;
        // Reset CSS styling on the 'New Storage' button.
        // this.checkNewStorageButton();
        this.toggleStorageButtons(this.uiElements.storageNameTagModal);
      }, 250);
      if (isRename) {
        // Rename the key in localStorage (and backup, if any).
        if (confirm('\nRename\n' +
            '\nFrom: ' + this.appSettingsInfo.storageNames[this.uiElements.storageNameTagModal.value] +
            '\nTo: ' + trimmedStorageName +
            '\n\nOK to proceed...')) {
          AppStorage.renameLocalStorageKey(
            this.appSettingsInfo.storageNames[this.uiElements.storageNameTagModal.value],
            trimmedStorageName
          );
          // Update the storage name in the list.
          this.appSettingsInfo.storageNames[this.uiElements.storageNameTagModal.value] = trimmedStorageName;
        }
      } else {
        this.appSettingsInfo.storageNames.push(trimmedStorageName);
      }
      this.storeSettings();
      this.renderMatrix();
    } else {
      this.showStorageError(this.dataManager.getData('storageNameErrorText'));
      // Remove temporary disablement of the new storage button.
      this.uiElements.newStorageNameButton.disabled = false;
      this.uiElements.newStorageRenameButton.disabled = false;
      // Reset CSS styling on the 'New Storage' button.
      this.toggleStorageButtons(this.uiElements.storageNameTagModal);
    }
  }

  // [Tested: No]
  renameStorage() {
    this.createNewStorage(true);
  }

  // Copy the selected flow name into the input field.
  // [Tested: No]
  copyStorageName() {
    AppConfig.debugConsoleLogs &&
      console.log('Copy selected storage name:', this.uiElements.storageNameTag.value);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    const selectedStorageIndex = parseInt(this.uiElements.storageNameTag.value, 10);
    const selectedStorageName = this.appSettingsInfo.storageNames[selectedStorageIndex];
    this.uiElements.newStorageNameInput.value = selectedStorageName;
    this.uiElements.newStorageNameInput.focus();

    this.toggleStorageButtons(this.uiElements.storageNameTagModal);
  }

  // [Tested: No]
  deleteSelectedStorage() {
    AppConfig.debugConsoleLogs &&
      console.log('Delete selected storage:', this.uiElements.storageNameTagModal.value);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    if (
      this.appSettingsInfo.storageNames.length > 1 &&
      this.uiElements.storageNameTagModal.value !== '0' &&
      this.uiElements.storageNameTagModal.value !== this.appSettingsInfo.storageIndex
    ) {
      if (confirm(`\nAre you sure you want to delete this storage?
            \nStorage name: ${this.appSettingsInfo.storageNames[this.uiElements.storageNameTagModal.value]}
            \nAny data within this storage WILL BE LOST.
            \nClick 'Cancel' and switch to this storage to export your data.\n`)) {

        this.hideStorageError();

        // The following simply takes the index for the currently selected storage in the modal
        // list (which is the same list as what's in 'appSettingsInfo.storageNames' because the
        // list is built from that array) and using that index to update the 'storageNames' list.
        //
        // References:
        //   > this.appSettingsInfo.storageNames => <string>[], // camelCase or snake_case.
        //       => As the list is built, each index is set to the HTML element's `.value`.
        //   > uiElements.storageNameTagModal
        //       => Storage name list in modal: `<select id="storageNameTagModal"`
        //
        const selectedStorageIndex = parseInt(this.uiElements.storageNameTagModal.value, 10);
        const selectedStorageName = this.appSettingsInfo.storageNames[selectedStorageIndex];

        const newList = this.appSettingsInfo.storageNames.toSpliced(selectedStorageIndex, 1);
        this.appSettingsInfo.storageNames = [...newList];

        // If 'selectedStorageIndex' < 'this.appSettingsInfo.storageIndex' reduce the index by 1.
        if (selectedStorageIndex < this.appSettingsInfo.storageIndex) {
          this.appSettingsInfo.storageIndex--;
          AppStorage.updateSessionStorageIndex(this.appSettingsInfo.storageIndex);
        }

        // Remove flow from export reminder list.
        delete this.appSettingsInfo.exportReminderCounter[selectedStorageName];

        this.storeSettings();

        // Remove selected clumpList from localStorage.
        // This will also remove its backup, if one exists.
        AppStorage.appStorageRemoveItem(selectedStorageName);

        this.updateStorageNameDropdownOptions();
        this.toggleStorageButtons(this.uiElements.storageNameTagModal);
        this.uiElements.newStorageNameInput.focus();
      }
    } else {
      // This should never be hit because the button should be disabled when not allowed.
      this.showStorageError(AppConstants.storageNameErrDelText);
    }
  }

  // const storageName = document.getElementById("storageName");
  // [Tested: No]
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
      this.dataManager.setData('highestClumpId', DataDefaultMaps.dataDefaultMap().highestClumpId);
      this.dataManager.setClumpList(); // Default: getStorageNameFromSettings()

      // Clear matrix and re-add all clumps.
      this.dataManager.resetClumpListConverted();
      this.dataManager.addClumpsToMatrix();

      // Update page title.
      document.title = this.getAppTitle();

      // Update UI.
      const currentStorageName = this.getCurrentFlowName();
      this.uiElements.clumpFormId.reset();
      this.uiElements.outputContainer.style.marginBottom = '0';
      this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
      this.uiElements.storageNameLabelCurrent.textContent = currentStorageName;
      this.uiElements.storageNameLabelCurrent.setAttribute('title', currentStorageName);
      this.uiElements.storageNameLabelCurrentModal.textContent = currentStorageName;
      this.uiElements.storageNameLabelCurrentModal.setAttribute('title', currentStorageName);
      this.updateDataInHtml();
      this.renderMatrix();
    }
  }

  // Button: id="restoreBackupButton"
  // [Tested: No]
  restoreSelectedStorage() {
    const selectedStorageIndex = parseInt(this.uiElements.storageNameTagModal.value, 10);

    AppConfig.debugConsoleLogs &&
      console.log('Restore backup for current storage:', selectedStorageIndex);

    if (this.uiElements.storageNamingError.classList.contains('error-visible')) {
      this.hideStorageError();
    }

    const selectedStorageName = isNaN(selectedStorageIndex) ? '' : this.appSettingsInfo.storageNames[selectedStorageIndex];
    const selectedStorageNameBackup = `${selectedStorageName}_backup`;
    if (
      selectedStorageName !== '' &&
      selectedStorageIndex === this.appSettingsInfo.storageIndex &&
      AppStorage.appStorageCheckItemExists(selectedStorageName)
    ) {
      const storageName = this.appSettingsInfo.storageNames[this.uiElements.storageNameTagModal.value];
      const backupName = `${storageName}_backup`;
      if (confirm(`\n!!! WARNING !!! All current data WILL BE REPLACED!
            \nBackup storage name: ${backupName}
            \nThis is meant to be used in the case of data corruption.
            \nYou can also consider using the import/export options.\n`)) {

        this.hideStorageError();

        // Replace the current storage with its backup.
        const backupData = this.dataManager.parseClumpListFromStorage(selectedStorageNameBackup);
        if (backupData !== null) {
          // Update data.
          this.dataManager.setData('editingIndex', null);
          this.dataManager.setData('lastAddedCol', DataDefaultMaps.dataDefaultMap().lastAddedCol);
          this.dataManager.setData('lastAddedClumpId', DataDefaultMaps.dataDefaultMap().lastAddedClumpId);
          this.dataManager.setData('highestClumpId', DataDefaultMaps.dataDefaultMap().highestClumpId);

          // Clear matrix and re-add all clumps.
          this.dataManager.setClumpList(backupData);
          this.dataManager.resetClumpListConverted();
          this.dataManager.addClumpsToMatrix();
          // this.dataManager.storeClumps(false); // Don't store the backup.
          this.dataManager.storeClumps(); // Allow a 'redo' after an 'undo'.

          // Update UI.
          this.uiElements.clumpFormId.reset();
          this.uiElements.outputContainer.style.marginBottom = '0';
          this.uiElements.outputContainer.style.height = 'calc(100vh - 42px)';
          this.updateDataInHtml();
          this.renderMatrix();
        } else {
          this.showStorageError(AppConstants.storageNameErrRestoreText);
        }
      }
    } else {
      // This should never be hit because the button should be disabled when not allowed.
      this.showStorageError(AppConstants.storageNameErrRestoreText);
    }
  }

  // [Tested: No]
  togglePanel(event) {
    event.stopPropagation();

    // AppConfig.debugConsoleLogs && console.log('togglePanel [event.currentTarget]');
    // AppConfig.debugConsoleLogs && console.log(event.currentTarget);
    // AppConfig.debugConsoleLogs && console.log('togglePanel [event.currentTarget.nextElementSibling]');
    // AppConfig.debugConsoleLogs && console.log(event.currentTarget.nextElementSibling);

    const panelToExpand = event.currentTarget.nextElementSibling;
    const panelHotspot = event.currentTarget;

    if (panelToExpand.classList.contains('panel-from-expanded-to-collapsed')) {
      this.classListChain(panelToExpand)
        .remove('panel-from-expanded-to-collapsed')
        .add('panel-from-collapsed-to-expanded');
    } else {
      this.classListChain(panelToExpand)
        .remove('panel-from-collapsed-to-expanded')
        .add('panel-from-expanded-to-collapsed');
    }

    panelHotspot.getElementsByClassName('collapse-arrow')[0].textContent =
        panelToExpand.classList.contains('panel-from-expanded-to-collapsed')
        ? '◀'
      : '▼';
  }

  // [Tested: No]
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
          AppConfig.debugConsoleLogs && console.log('Content injected into:', target);
          target.style.color = '#ffffff';
        }
      ).then(() => {
        // Initialize AppModal.
        this.appModal = new AppModal({
          appModal: this.uiElements.appModal,
          // This button opens the modal (as passed into and from within the modal).
          appModalBtn: this.uiElements.appModalBtn,
          modalCloseButton: this.uiElements.modalCloseButton,
          newStorageNameInput: this.uiElements.newStorageNameInput,
          clumpNameInput: this.uiElements.clumpNameInput,
        });

        // The empty (.htmlh) page is injected during this `renderMatrix()` call,
        //   which is run after the 'uiElements' are resolved (at the top of the constructor),
        //   so we'll have to grab the HTML <a> element directly.
        const tipsModalRefBtn = this.uiElements.clumpContainer.querySelector('#tipsModalRefBtn');
        this.tipsModal = new AppModal({
          appModal: this.uiElements.tipsModal,
          // These two buttons open the modal (as passed into and from within the modal).
          appModalBtn: this.uiElements.tipsModalBtn,
          appModalBtnAlt: tipsModalRefBtn,
          modalCloseButton: this.uiElements.tipsModalCloseButton,
        });
      });
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

    // [ SHOW IDS CHECKBOX ]

    // [5a] Show IDs | Listener event: 'toggleShowIds()'.
    this.uiElements.showIdsCheckbox.checked = this.appSettingsInfo.showIds === true;

    // this.uiElements.exportReminderInput.addEventListener('change', this.updateExportReminder
    // [5b] Export Reminder | Listener event: 'updateExportReminder()'.
    this.uiElements.exportReminderInput.value = this.appSettingsInfo.exportReminderValue;

    // [ STORAGE ]

    // [6] Update the 'storageName' dropdown from settings.storage
    this.updateStorageNameDropdownOptions();
    const currentStorageName = this.getCurrentFlowName();
    this.uiElements.storageNameLabelCurrent.textContent = currentStorageName;
    this.uiElements.storageNameLabelCurrent.setAttribute('title', currentStorageName);
    this.uiElements.storageNameLabelCurrentModal.textContent = currentStorageName;
    this.uiElements.storageNameLabelCurrentModal.setAttribute('title', currentStorageName);

    // [7] Enable/disable storage buttons.
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
        const clumpCellDiv = document.createElement('div');

        // ClumpList is a list of all clumps as ClumpInfo objects.
        clumpListIndex = getClumpList.findIndex(clump => clump.id === curClumpId);
        const clumpInfoFound = getClumpList[clumpListIndex];

        clumpCellDiv.className = `clump-node collapsed clump-list-index-${clumpListIndex}`;

        // Create content span for clump name and code
        const contentSpan = document.createElement('div');
        const clumpId = this.appSettingsInfo.showIds === true
            ? `<span class="clump-id">[${clumpInfoFound.id}]</span> `
            : '';
        const clumpName = `<small></small>
              <strong>${AppHelpers.unescapeHTML(clumpInfoFound.clumpName)}</strong>
              <br>${AppHelpers.unescapeHTML(clumpInfoFound.clumpCode).split('\n')[0]}`;
        contentSpan.className = 'content-span';
        contentSpan.innerHTML = `${clumpId}${clumpName}`;
        contentSpan.setAttribute('data-clump-id', clumpInfoFound.id);
        clumpCellDiv.appendChild(contentSpan);

        // Apply linked/unlinked class based on the condition
        clumpCellDiv.classList.add(clumpInfoFound.linkedToLeft !== -1 ? 'linked' : 'unlinked');

        const iconSpan = document.createElement('div');
        iconSpan.className = 'icon-span';

        // Create and append the edit icon
        const editIcon = document.createElement('div');
        editIcon.className = 'edit-icon';
        editIcon.textContent = '✏️';
        editIcon.onclick = (event) => {
          event.stopPropagation(); // Prevent toggle when clicking edit
          this.loadForEdit(getClumpList.indexOf(clumpInfoFound), event);
        };
        iconSpan.appendChild(editIcon);

        // Conditionally create and append the delete icon
        if (
          (getClumpList.length === 1) ||
          (
            getClumpList[0].id !== clumpInfoFound.id &&
            getClumpList.find(clump => clump.linkedToLeft === clumpInfoFound.id) === undefined
          )
        ) {
          const deleteIcon = document.createElement('div');
          deleteIcon.className = 'delete-icon';
          deleteIcon.textContent = '❌';
          deleteIcon.onclick = (event) => {
            event.stopPropagation(); // Prevent toggle when clicking delete
            this.deleteLastClump(event, curClumpId);
          };
          iconSpan.appendChild(deleteIcon);
        }
        clumpCellDiv.appendChild(iconSpan);

        // Toggle function to handle cell expansion/collapse.
        const toggleCell = (event) => {

          const currentCell = event.target.closest('.clump-node');
          const currentContentSpan = currentCell.querySelector('.content-span');
          const currentSpanPre = currentContentSpan.querySelector('pre');

          const cellzIndex = parseInt(currentSpanPre?.style.zIndex, 10) || 0;

          let largestExpandedZIndex = 0;
          let allZIndexes = {}; // zindex: cellParentWrapper

          // document.getElementById('clumpContainer').querySelectorAll('.clump-node.expanded .content-span pre');
          const elements = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded .content-span pre');
          for (const clumpCellPre of elements) {
            // Remove 'topmost' class from all existing expanded cell wrappers.
            const cellParentWrapper = clumpCellPre.parentElement.parentElement;
            cellParentWrapper.classList.remove('topmost');

            const zIndex = parseInt(clumpCellPre.style.zIndex, 10) || 0;
            allZIndexes[zIndex] = cellParentWrapper;
            if (zIndex > largestExpandedZIndex) {
              largestExpandedZIndex = zIndex;
            }
          }

          // If the cell is already open but is not the highest zIndex,
          //   just bring the cell clump to the top, else close it.
          // If the cell is collapsed, or expanded and already on
          //   top, run it through the full toggle flow below,
          if (currentCell.classList.contains('expanded') && cellzIndex < largestExpandedZIndex) {
            currentSpanPre.style.zIndex = largestExpandedZIndex + 10;
            // Move 'topmost' class to the current cell.
            currentCell.classList.add('topmost');
            return;
          } else {
            // Update 'largestExpandedZIndex' if 'cellzIndex' is greater.
            if (cellzIndex > largestExpandedZIndex) {
              largestExpandedZIndex = cellzIndex;
            }
          }

          currentCell.classList.toggle('expanded');
          currentCell.classList.toggle('collapsed');

          const isCellCollapsed = currentCell.classList.contains('collapsed');
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
          let clumpCellContents = `<strong>${AppHelpers.unescapeHTML(clumpInfoFound.clumpName)}</strong>
            <br>${isCellCollapsed
              ? AppHelpers.unescapeHTML(clumpInfoFound.clumpCode).split('\n')[0]
              : AppHelpers.unescapeHTML(clumpInfoFound.clumpCode).split('\n').slice(0, 2).join('<br>')}`;
          if (!isCellCollapsed) {
            // Show both 'clumpName' and 'clumpCode' in bottom panel.
            clumpCellContents += `<pre><b>${AppHelpers.unescapeHTML(clumpInfoFound.clumpName)}</b><br><br>${AppHelpers.unescapeHTML(clumpInfoFound.clumpCode)}</pre>`;
          }
          currentContentSpan.innerHTML = clumpCellContents;

          // Set the z-index if the cell is expanded.
          //
          if (!isCellCollapsed) {
            currentContentSpan.querySelector('pre').style.zIndex = largestExpandedZIndex + 10;
            // Add 'topmost' class to the current cell.
            currentCell.classList.add('topmost');
          } else {
            // Add 'topmost' class to the cell with the highest zIndex.
            if (Object.keys(allZIndexes).length > 0) {
              // Remove the current cell from 'allZIndexes'.
              delete allZIndexes[cellzIndex];
              // Then find the highest zIndex from the remaining cells.
              const highestZIndex = Math.max(...Object.keys(allZIndexes).map(Number));
              if (highestZIndex in allZIndexes) {
                allZIndexes[highestZIndex].classList.add('topmost');
              }
            }
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
          toggleCell(event);
        });

        // Append cell to the container
        this.uiElements.clumpContainer.appendChild(clumpCellDiv);
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
    // If the modal is open focus on newStorageNameInput.
    if (typeof this.appModal !== 'undefined' && this.appModal.isOpen) {
      this.uiElements.newStorageNameInput.focus();
    } else {
      this.uiElements.clumpNameInput.focus();
    }
  }
}
