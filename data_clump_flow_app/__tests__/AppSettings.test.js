import AppData from '../js/AppData.js';
import AppSettings from '../js/AppSettings.js';
import AppStorage from '../js/AppStorage.js';
import { uiConfig } from '../js/uiConfig.js';

// AppSettings.test.js

// Minimal stubbing for dependencies

// Stub AppStorage methods used by AppSettings
AppStorage.getJsonSettingsFromStorageOrDefaults = jest.fn(() => ({
  storageNames: ['default'],
  storageIndex: 0,
}));
AppStorage.getSessionStorageIndex = jest.fn((index) => index);
AppStorage.appStorageGetItem = jest.fn(() => null);
AppStorage.appStorageSetItem = jest.fn();

// Stub minimal AppData methods
AppData.prototype.getData = jest.fn(() => []);
AppData.prototype.setData = jest.fn();
AppData.prototype.resetClumpListConverted = jest.fn();
AppData.prototype.addClumpsToMatrix = jest.fn();
AppData.prototype.storeClumps = jest.fn();
AppData.prototype.cellIdBelow = jest.fn(() => -1);
AppData.prototype.collectSubtreeIdsBelow = jest.fn(() => []);
AppData.prototype.collectSubtreeIdsFullTail = jest.fn(() => []);

describe('AppSettings', () => {
  let appSettings;
  let alertSpy;

  beforeEach(() => {
    // Reset alert spy before each test.
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Create a new instance.
    document.addEventListener('DOMContentLoaded', () => {
      appSettings = new AppSettings(uiConfig);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should resolve DOM selectors correctly', () => {
    document.addEventListener('DOMContentLoaded', function () {
      const resolved = appSettings.uiElements;
      expect(resolved.clumpFormId).toBeTruthy();
      expect(resolved.popItIcon).toBeTruthy();
      expect(resolved.clumpNameInput).toBeTruthy();
      expect(resolved.clumpCodeInput).toBeTruthy();
      expect(resolved.columnSelect).toBeTruthy();
      expect(resolved.linkToId).toBeTruthy();
      expect(resolved.linkedToLeft).toBeTruthy();
      expect(resolved.linkedToAbove).toBeTruthy();
      expect(resolved.clumpFormButtonSubmit).toBeTruthy();
      expect(resolved.clumpFormButtonReset).toBeTruthy();
      expect(resolved.settingsPanelToggle).toBeTruthy();
      expect(resolved.showIdsCheckbox).toBeTruthy();
      expect(resolved.gridRepeatHtmlSpan).toBeTruthy();
      expect(resolved.gridRepeatRangeInput).toBeTruthy();
      expect(resolved.gridRepeatSliderMarkers).toBeTruthy();
      expect(resolved.exportPanelToggle).toBeTruthy();
      expect(resolved.storageNameLabelCurrent).toBeTruthy();
      expect(resolved.storageNameTag).toBeTruthy();
      expect(resolved.storageButtonUse).toBeTruthy();
      expect(resolved.exportDataButton).toBeTruthy();
      expect(resolved.exportAllDataButton).toBeTruthy();
      expect(resolved.appModalBtn).toBeTruthy();
      expect(resolved.lastAddedClumpIdTag).toBeTruthy();
      expect(resolved.lastAddedColTag).toBeTruthy();
      expect(resolved.editingIndexTag).toBeTruthy();
      expect(resolved.editingIdTag).toBeTruthy();
      expect(resolved.outputContainer).toBeTruthy();
      expect(resolved.clumpContainer).toBeTruthy();
      expect(resolved.crossTabWarning).toBeTruthy();
    });
  });

  test('toggleClumpFormPopUp should toggle "popped" class on clumpFormId', () => {
    document.addEventListener('DOMContentLoaded', function () {
      const clumpForm = appSettings.uiElements.clumpFormId;
      // Initially not toggled
      expect(clumpForm.classList.contains('popped')).toBe(false);
      // Toggle once should add class
      appSettings.toggleClumpFormPopUp();
      expect(clumpForm.classList.contains('popped')).toBe(true);
      // Toggle again should remove class
      appSettings.toggleClumpFormPopUp();
      expect(clumpForm.classList.contains('popped')).toBe(false);
    });
  });

  test('removePopUp should remove "popped" class', () => {
    document.addEventListener('DOMContentLoaded', function () {
      const clumpForm = appSettings.uiElements.clumpFormId;
      clumpForm.classList.add('popped');
      appSettings.removePopUp();
      expect(clumpForm.classList.contains('popped')).toBe(false);
    });
  });

  test('showOneTimeAlert should call alert and set session flag when not previously seen', () => {
    document.addEventListener('DOMContentLoaded', function () {
      // Ensure both storage flags are null so that the alert is triggered.
      AppStorage.appStorageGetItem.mockReturnValue(null);
      appSettings.showOneTimeAlert();
      expect(alertSpy).toHaveBeenCalled();
      expect(AppStorage.appStorageSetItem).toHaveBeenCalledWith('dataflowInitMessage', 'seen');
    });
  });

  test('showOneTimeAlert should not call alert if an init message is already set', () => {
    document.addEventListener('DOMContentLoaded', function () {
      // Simulate that one of the storage items is not null.
      AppStorage.appStorageGetItem.mockReturnValue('seen');
      appSettings.showOneTimeAlert();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  test('addTextToCrossTabWarning allows dismiss when allowDismiss is true', () => {
    document.addEventListener('DOMContentLoaded', function () {
      const warningElement = appSettings.uiElements.crossTabWarning;
      const message = 'Warning: Action needed on other tabs!';

      // Spy on dismissWarningMessage
      const dismissSpy = jest.spyOn(appSettings, 'dismissWarningMessage').mockImplementation(() => {
        warningElement.classList.add('hidden');
      });

      // Ensure the warning element initially has the "hidden" class.
      warningElement.classList.add('hidden');

      appSettings.addTextToCrossTabWarning(true, message);

      // Check that "hidden" class was removed.
      expect(warningElement.classList.contains('hidden')).toBe(false);
      // Check that the innerHTML is set.
      expect(warningElement.innerHTML).toBe(message);
      // Check that style cursor is set to 'pointer'.
      expect(warningElement.style.cursor).toBe('pointer');
      // Check that onclick is set.
      expect(typeof warningElement.onclick).toBe('function');

      // Simulate a click event.
      const fakeEvent = { preventDefault: jest.fn() };
      warningElement.onclick(fakeEvent);
      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(dismissSpy).toHaveBeenCalled();
    });
  });

  test('addTextToCrossTabWarning does not allow dismiss when allowDismiss is false', () => {
    document.addEventListener('DOMContentLoaded', function () {
      const warningElement = appSettings.uiElements.crossTabWarning;
      const message = 'Warning: Do not dismiss this message automatically!';

      // Ensure the warning element initially has the "hidden" class.
      warningElement.classList.add('hidden');

      appSettings.addTextToCrossTabWarning(false, message);

      // Check that "hidden" class was removed.
      expect(warningElement.classList.contains('hidden')).toBe(false);
      // Check that the innerHTML is updated.
      expect(warningElement.innerHTML).toBe(message);
      // Check that style cursor is set to 'default'.
      expect(warningElement.style.cursor).toBe('default');
      // Check that onclick is null.
      expect(warningElement.onclick).toBeNull();
    });
  });

  // [Tested] | showOneTimeAlert() {
  // [Tested] | resolveSelectors(selectors) {
  // [Tested] | toggleClumpFormPopUp() {
  // [Tested] | removePopUp() {
  // [Tested] | addTextToCrossTabWarning(
  // [Tested: No] | dismissWarningMessage() {
  // [Tested: No] | checkIfStorageNameStillExists() {
  // [Tested: No] | handleFormSubmit(event) {
  // [Tested: No] | handleClumpMovement(clumpList, clumpToInsert, originalClump) {
  // [Tested: No] | get getByLinkNotColumn() {
  // [Tested: No] | get isLinkToLeftSelected() {
  // [Tested: No] | getLinkInfo(columnRawValue) {
  // [Tested: No] | enableDisableLinkToFields(onOrOff) {
  // [Tested: No] | enableDisableColumnSelect() {
  // [Tested: No] | resetFormFields() {
  // [Tested: No] | handleFormReset(event) {
  // [Tested: No] | handleExportAllData() {
  // [Tested: No] | handleExportData() {
  // [Tested: No] | exportStorageName(currentStorageLabelName, storedData) {
  // [Tested: No] | async handleImportData() {
  // [Tested: No] | isValidKeyName(keyName) {
  // [Tested: No] | checkIfStorageNameExists(keyName) {
  // [Tested: No] | sortStorageNames() {
  // [Tested: No] | hideStorageError() {
  // [Tested: No] | classListChain(htmlElement) {
  // [Tested: No] | storeSettings(updateDataManager = true) {
  // [Tested: No] | toggleStorageButtons(
  // [Tested: No] | convertGridRepeatSettingValueToCellWidth(curGridRepeat = this.appSettingsInfo.gridRepeatRangeValue) {
  // [Tested: No] | toggleShowIds(event) {
  // [Tested: No] | updateGridRepeat(event) {
  // [Tested: No] | updateDataInHtml() {
  // [Tested: No] | updateLinkToDropdownOptions() {
  // [Tested: No] | updateColumnSelectDropdownOptions() {
  // [Tested: No] | updateStorageNameDropdownOptions() {
  // [Tested: No] | loadForEdit(index, event) {
  // [Tested: No] | clearSelectedClumpNode() {
  // [Tested: No] | selectClumpNode(eventTarget) {
  // [Tested: No] | deleteLastClump(event, clumpId) {
  // [Tested: No] | showStorageError(errText) {
  // [Tested: No] | createNewStorage(isRename = false) {
  // [Tested: No] | renameStorage() {
  // [Tested: No] | copyStorageName() {
  // [Tested: No] | deleteSelectedStorage() {
  // [Tested: No] | useSelectedStorage() {
  // [Tested: No] | restoreSelectedStorage() {
  // [Tested: No] | togglePanel(event) {
  // [Tested: No] | renderMatrix() {
});
