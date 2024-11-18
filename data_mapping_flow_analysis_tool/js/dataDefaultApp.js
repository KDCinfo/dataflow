import ClumpInfo from './ClumpInfo.js';

// These error property keys should match
// the App's default property keys below.
export const dataDefaultError = {
  editingIndex: -2,
  localStorageKeyForClumps: 'dataFlowFallbackKey',
  clumpList: [
    ClumpInfo.createErrorInfoData()
  ],
  clumpMatrix: [
    [-1]
  ],
  lastAddedCol: -1,
  lastAddedClumpId: -1,
  defaultAppSettings: {
    gridRepeatRangeValue: 0,
    storageNames: ['error'], // camelCase or snake_case.
    storageIndex: 0
  }
};

export const dataDefaultApp = {
  // gridRepeatValue: 2,
  // storageNames: ['default'],
  // storageIndex: 0

  // DATA: [editingIndex] Updated when edited a clump, and reset when clump is saved.
  // let editingIndex = null;  // Track if we’re editing an existing clump
  editingIndex: null,

  // DATA: [localStorageKeyForClumps] Local storage key used to store and retrieve clumps.
  // let localStorageKeyForClumps = settings.storageNames[settings.storageIndex] || 'dataMappingFlowClumps';
  // localStorageKeyForClumps: settings.storageNames[settings.storageIndex] || 'dataMappingFlowClumps',
  localStorageKeyForClumps: 'default',

  // DATA: [clumps] A list of data clumps are stored in the browser's local storage.
  // let clumpList = JSON.parse(localStorage.getItem(localStorageKeyForClumps) || '[]');
  clumpList: [],

  // DATA: [clumpMatrix] A 2D array to keep track of clump ID cell placement, empty
  // let clumpMatrix = [];
  clumpMatrix: [],

  // DATA: [lastAddedCol] The last column that a clump was added to.
  // let lastAddedCol = 1;
  lastAddedCol: 1,

  // DATA: [lastAddedClumpId] Unlinked clumps are placed under the last clump that was added,
  // let lastAddedClumpId = 0;
  lastAddedClumpId: 0,

  defaultAppSettings: {
    gridRepeatRangeValue: 2,
    storageNames: ['default'], // camelCase or snake_case.
    storageIndex: 0
  }
};
