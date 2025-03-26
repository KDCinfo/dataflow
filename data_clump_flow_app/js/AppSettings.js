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
    const date = new Date();
    console.log('AppSettings initialized on:', date.toLocaleString());

    this.uiElements = this.resolveSelectors(uiSelectors);

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

    // Initial render call
    this.renderMatrix();

    // Show the welcome alert only once.
    this.showOneTimeAlert();
  }

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
    this.uiElements.newStorageNameInput.addEventListener('input', this.checkNewStorageButton.bind(this));
    this.uiElements.storageNameTag.addEventListener('change', this.toggleStorageButtons.bind(this));

    this.uiElements.exportDataButton.addEventListener('click', this.handleExportData.bind(this));
    this.uiElements.exportAllDataButton.addEventListener('click', this.handleExportAllData.bind(this));
    this.uiElements.importDataButton.addEventListener('click', this.handleImportData.bind(this));

    this.uiElements.clumpFormId.addEventListener('submit', this.handleFormSubmit.bind(this));
    this.uiElements.clumpFormId.addEventListener('reset', this.handleFormReset.bind(this));

    // this.uiElements.settingsPanelToggle
    // onclick="togglePanel(event)"
    this.uiElements.settingsPanelToggle.addEventListener('click', this.togglePanel.bind(this));
    this.uiElements.exportPanelToggle.addEventListener('click', this.togglePanel.bind(this));
    // id="gridRepeatRangeInput"
    // oninput="updateGridRepeat(event)"
    this.uiElements.gridRepeatRangeInput.addEventListener('input', this.updateGridRepeat.bind(this));
    // id="storageButtonDelete"
    // onclick="deleteSelectedStorage()"
    this.uiElements.storageButtonDelete.addEventListener('click', this.deleteSelectedStorage.bind(this));
    // id="storageButtonUse"
    // onclick="useSelectedStorage()"
    this.uiElements.storageButtonUse.addEventListener('click', this.useSelectedStorage.bind(this));
    // id="restoreBackupButton"
    // onclick="restoreSelectedStorage()"
    this.uiElements.restoreBackupButton.addEventListener('click', this.restoreSelectedStorage.bind(this));
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

  // Check if 'AppSettingsInfo.storageIndex' reflects the same name as the currently active
  // storage name. If not, return. We DO NOT want to update a storage that doesn't exist, else
  // it will overwrite all the data in the next storage in the list and replace it with this data.
  checkIfStorageNameStillExists() {
    const currentStorageName = this.appSettingsInfo.storageNames[this.appSettingsInfo.storageIndex].toLowerCase();
    const storageNameLabelTrimmed = this.uiElements.storageNameLabelCurrent.textContent.trim().toLowerCase();
    if (currentStorageName !== storageNameLabelTrimmed) {
      alert('The currently active storage name has been deleted.\n\nPlease refresh the page.');
      return false;
    }
    return true;
  }

  handleFormSubmit(event) {
    // clumpFormId.onsubmit = (event) => {
    event.preventDefault();

    // Ensure the currently active storage name is valid (prevent updating a non-existent storage).
    if (!this.checkIfStorageNameStillExists()) {
      return;
    }

    const currentClumpList = this.dataManager.getData('clumpList');
    let newClumpList = [];
    let newClump;

    // Determine linking info based on the selected "Add to Column" option and link inputs.
    const columnRawValue = this.uiElements.columnSelect.options[
      this.uiElements.columnSelect.selectedIndex
    ].value;
    const { isLinkedLeft, linkId } = currentClumpList.length === 0
        ? { isLinkedLeft: false, linkId: -1 }
        : this.getLinkInfo(columnRawValue);

    if (this.dataManager.getData('editingIndex') === null) {
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
      newClump = ClumpInfo.jsonToClumpInfo(newClumpObj);
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
  };

  /**
   * Adjusts clump positions in the list when a clump's linkage (parent) changes.
   * This function handles reassigning related clumps and reordering the clump list to maintain a valid structure.
   * @param {Array} clumpList - The current list of all clump objects (before edit).
   * @param {Object} clumpToInsert - The clump data; either new or after edits (with updated link fields).
   * @param {Object} originalClump - The original clump data (before edits).
   * @returns {Array} - A new clump list with clumps repositioned as needed.
   */
  handleClumpMovement(clumpList, clumpToInsert, originalClump) {
    const insertionClumpId = clumpToInsert.id;
    const newAbove = clumpToInsert.linkedToAbove;
    const newLeft = clumpToInsert.linkedToLeft;

    const isAdd = typeof originalClump === 'undefined' || originalClump === null;
    const oldAbove = isAdd ? -1 : originalClump.linkedToAbove;
    const oldLeft = isAdd ? -1 : originalClump.linkedToLeft;

    let updatedClumpList = [];

    // CASE 1: C1R1 | First cell | Add and return
    const isFirstCell = clumpList.length === 0 ||
        (clumpToInsert.linkedToAbove === -1 && clumpToInsert.linkedToLeft === -1);
    if (isFirstCell) {
      updatedClumpList = [clumpToInsert];
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

    const cellToRightId = isAdd ? -1 : this.dataManager.cellIdToRight(insertionClumpId);
    const cellToRightClump = isAdd ? undefined : clumpList.find(clump => clump.id === cellToRightId);
    const subtreeRightTail = cellToRightId === -1 ? [] : this.dataManager.collectSubtreeIdsBelow(cellToRightId);
    const subtreeFullRightTail = cellToRightClump === undefined ? [] : [cellToRightClump, ...subtreeRightTail];
    const subtreeBelowTail = isAdd ? [] : this.dataManager.collectSubtreeIdsBelow(insertionClumpId);
    const subtreeBelowTailClumps = subtreeBelowTail.map(id => clumpList.find(clump => clump.id === id));
    // If we're adding a cell with a linkedToAbove, we only need the bottom tail.
    const subtreeBothTails = isAdd ? [] : this.dataManager.collectSubtreeIdsFullTail(insertionClumpId);
    const subtreeBothTailsClumps = subtreeBothTails.map(id => clumpList.find(clump => clump.id === id));

    // CASE 3: C1R2 | Add a cell below the linkedToAbove ID
    //   - If a cell exists below the target cell, its linkedToAbove will change
    //       from the target cell to the last cell in the below tail.
    if (newAbove !== -1) {
      const targetClumpIndex = clumpList.findIndex(clump => clump.id === newAbove);

      const clumpListSliceStart = clumpList.slice(0, targetClumpIndex + 1).filter(clump =>
        !subtreeBelowTail.includes(clump.id)
          && clump.id !== insertionClumpId);
      const clumpListSliceEnd = clumpList.slice(targetClumpIndex + 1).filter(clump =>
        !subtreeBelowTail.includes(clump.id)
          && clump.id !== insertionClumpId
      );

      const cellBelowTargetClump = clumpList.find(clump => clump.linkedToAbove === newAbove);
      if (cellBelowTargetClump !== undefined) {
        const subtreeBelowTailLastId = subtreeBelowTail.length === 0
            ? insertionClumpId
            : subtreeBelowTail[subtreeBelowTail.length - 1];
        // If we're adding, the 'insertionClumpId' is the cell being linked to
        //   (because a new clump has no tail, but where it's being inserted might).
        // If we're editing, the 'insertionClumpId' is the cell being edited
        //   (because we need its tail).
        cellBelowTargetClump.linkedToAbove = isAdd ? insertionClumpId : subtreeBelowTailLastId;

        // Update 'clumpListSliceEnd' with the updated 'cellBelowTargetClump'.
        const clumpListSliceEndIndex = clumpListSliceEnd.findIndex(clump => clump.id === cellBelowTargetClump.id);
        clumpListSliceEnd[clumpListSliceEndIndex] = cellBelowTargetClump;
      }


      updatedClumpList = [
        ...clumpListSliceStart,
        clumpToInsert,
        ...subtreeBelowTailClumps,
        ...subtreeFullRightTail,
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

  get getByLinkNotColumn() {
    const newLinkToIdFromUI = parseInt(this.uiElements.linkToId.value, 10) || -1;
    // const getByLinkNotColumn = !isNaN(newLinkToIdFromUI) && newLinkToIdFromUI > 0;
    return !isNaN(newLinkToIdFromUI) && newLinkToIdFromUI > 0;
  }

  get isLinkToLeftSelected() {
    // const isLinkedLeft = getByLinkNotColumn && this.uiElements.linkedToLeft.checked;
    return this.getByLinkNotColumn && this.uiElements.linkedToLeft.checked;
  }

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

  enableDisableLinkToFields(onOrOff) {
    this.uiElements.linkToId.disabled = onOrOff;
    this.uiElements.linkedToLeft.disabled = onOrOff;
    this.uiElements.linkedToAbove.disabled = onOrOff;
  }

  enableDisableColumnSelect() {
    this.uiElements.columnSelect.disabled =
        this.uiElements.linkToId.value !== '' ||
        this.dataManager.getData('editingIndex') === 0;
  }

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
  handleFormReset(event) {
    event.preventDefault();

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

  handleExportAllData() {
    console.log('[AppSettings] handleExportAllData');

    // Populate the 'export list' by retrieving the data
    // from localStorage based on the storage name.
    this.appSettingsInfo.storageNames.forEach((storageName) => {
      this.dataManager.setClumpExportList(storageName);
      this.exportStorageName(storageName, this.dataManager.clumpExportList);
    });
  }

  handleExportData() {
    const currentStorageLabelName = this.uiElements.storageNameLabelCurrent.textContent.trim();
    this.exportStorageName(currentStorageLabelName);
  }

  exportStorageName(currentStorageLabelName, storedData) {
    const exportName = currentStorageLabelName === AppConstants.defaultStorageName
      ? AppConstants.defaultExportStorageName
      : currentStorageLabelName;

    FileHandler.handleExportData({
      clumpListToExport: typeof storedData === 'undefined'
          ? this.dataManager.getData('clumpList')
          : storedData,
      storageName: exportName
    });
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
    const selectedStorageNameBackup = `${selectedStorageName}_backup`;

    const currentList = this.dataManager.getData('clumpList');
    const backupData = this.dataManager.parseClumpListFromStorage(selectedStorageNameBackup);
    const listMatch = currentList.length === backupData.length &&
        currentList.every((clump, index) => clump.id === backupData[index].id);

    const isDefault = selectedStorageName === AppConstants.defaultStorageName;
    const isActive = selectedIndex === this.appSettingsInfo.storageIndex;

    this.uiElements.storageButtonUse.disabled = isActive;
    this.uiElements.storageButtonDelete.disabled = isDefault || isActive;
    this.uiElements.restoreBackupButton.disabled = backupData.length === 0 || listMatch;
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

  updateColumnSelectDropdownOptions() {
    this.uiElements.columnSelect.innerHTML = '<option value="last">Last Added</option>';

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

    this.enableDisableColumnSelect();

    // We can now edit 'column' (now 'linkedToLeft') and 'linkTo' (now 'linkedToAbove') properties.
    // this.uiElements.columnSelect.disabled = this.dataManager.getData('editingIndex') !== null;
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
        this.dataManager.setData('lastAddedClumpId', clumpListSpliced[clumpListSpliced.length - 1].id);
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
        // Reset CSS styling on the 'New Storage' button.
        this.checkNewStorageButton();
      }, 250);
      // From initialization above:
      //   const storageNames = settings.storageNames;
      // JavaScript is a pass-by-reference language for
      // non-primitives, so we can modify the original array.
      this.appSettingsInfo.storageNames.push(trimmedStorageName);
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
            \nStorage name: ${this.appSettingsInfo.storageNames[this.uiElements.storageNameTag.value]}
            \nAny data within this storage WILL BE LOST.
            \nClick 'Cancel' and switch to this storage to export your data.\n`)) {

        this.hideStorageError();

        const selectedStorageIndex = parseInt(this.uiElements.storageNameTag.value, 10);
        const selectedStorageName = this.appSettingsInfo.storageNames[selectedStorageIndex];

        const newList = this.appSettingsInfo.storageNames.toSpliced(selectedStorageIndex, 1);
        this.appSettingsInfo.storageNames = [...newList];

        // If 'selectedStorageIndex' < 'this.appSettingsInfo.storageIndex' reduce the index by 1.
        if (selectedStorageIndex < this.appSettingsInfo.storageIndex) {
          this.appSettingsInfo.storageIndex--;
          AppStorage.updateSessionStorageIndex(this.appSettingsInfo.storageIndex);
        }

        this.storeSettings();

        // Remove selected clumpList from localStorage.
        // This will also remove its backup, if one exists.
        AppStorage.appStorageRemoveItem(selectedStorageName);

        this.updateStorageNameDropdownOptions();
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
      this.dataManager.setData('highestClumpId', DataDefaultMaps.dataDefaultMap().highestClumpId);
      this.dataManager.setClumpList(); // Default: getStorageNameFromSettings()

      // Clear matrix and re-add all clumps.
      this.dataManager.resetClumpListConverted();
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

  // Button: id="restoreBackupButton"
  restoreSelectedStorage() {
    const selectedStorageIndex = parseInt(this.uiElements.storageNameTag.value, 10);

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
      AppStorage.appStorageCheckItemExists(selectedStorageNameBackup)
    ) {
      const storageName = this.appSettingsInfo.storageNames[this.uiElements.storageNameTag.value];
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
      ? '▶'
      : '▼';
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
        const clumpCell = document.createElement('div');

        clumpListIndex = getClumpList.findIndex(clump => clump.id === curClumpId);
        const clumpFound = getClumpList[clumpListIndex];

        clumpCell.className = `clump-node collapsed clump-list-index-${clumpListIndex}`;

        // Create content span for clump name and code
        const contentSpan = document.createElement('div');
        contentSpan.className = 'content-span';
        contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
              <br>${clumpFound.clumpCode.split('\n')[0]}`;
        clumpCell.appendChild(contentSpan);

        // Apply linked/unlinked class based on the condition
        clumpCell.classList.add(clumpFound.linkedToLeft !== -1 ? 'linked' : 'unlinked');

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
        if (
          (getClumpList.length === 1) ||
          (
            getClumpList[0].id !== clumpFound.id &&
            getClumpList.find(clump => clump.linkedToLeft === clumpFound.id) === undefined
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
            // Show both 'clumpName' and 'clumpCode' in bottom panel.
            clumpCellContents += `<pre><b>${AppHelpers.unescapeHTML(clumpFound.clumpName)}</b><br><br>${AppHelpers.unescapeHTML(clumpFound.clumpCode)}</pre>`;
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
