import AppSettings from './AppSettings.js';

document.addEventListener('DOMContentLoaded', () => {
  const uiConfig = {
    // @TODO: Extract IDs to a config file and add HTML element resolver.
    ui: {
      outputContainer: document.getElementById('outputContainer'),
      clumpContainer: document.getElementById('clumpContainer'),
    },
    clumpPanel: {
      clumpFormId: document.getElementById('clumpFormId'),
      clumpNameInput: document.getElementById('clumpNameInput'),
      clumpCodeInput: document.getElementById('clumpCodeInput'),
      linkTo: document.getElementById('linkTo'),
      columnSelect: document.getElementById('columnSelect'),
      saveClumpButton: document.getElementById('clumpFormButtonSubmit')
      // Not used
      // resetClumpButton: document.getElementById('clumpFormButtonReset')
    },
    settings: {
      gridRepeatRangeInput: document.getElementById('gridRepeatRangeInput'),
      gridRepeatHtmlSpan: document.getElementById('gridRepeatHtmlSpan'),
      gridRepeatSliderMarkers: document.getElementById('gridRepeatSliderMarkers'),
    },
    storage: {
      exportDataButton: document.getElementById('exportDataButton'),
      importDataButton: document.getElementById('importDataButton'),

      storageNameTag: document.getElementById('storageNameTag'),
      storageNameLabelCurrent: document.getElementById('storageNameLabelCurrent'),
      newStorageNameInput: document.getElementById('newStorageNameInput'),
      newStorageNameButton: document.getElementById('newStorageNameButton'),
      storageButtonDelete: document.getElementById('storageButtonDelete'),
      storageButtonUse: document.getElementById('storageButtonUse'),
      storageNamingError: document.getElementById('storageNamingError')
    },
    infoPanel: {
      lastAddedClumpIdTag: document.getElementById('lastAddedClumpIdTag'),
      lastAddedColTag: document.getElementById('lastAddedColTag'),
      editingIndexTag: document.getElementById('editingIndexTag'),
      editingIdTag: document.getElementById('editingIdTag')
    }
  };

  const appSettings = new AppSettings(uiConfig);

  appSettings.loadData('/api/settings');
});
