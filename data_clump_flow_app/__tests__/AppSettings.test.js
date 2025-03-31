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
      expect(resolved.clumpNameInput).toBeTruthy();
      expect(resolved.clumpCodeInput).toBeTruthy();
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
});
