import { errorClump } from './dataDefault.js';

export const dataDefault = {
  editingIndex: -2,
  localStorageKeyForClumps: 'dataFlowFallbackKey',
  clumpList: [
    errorClump
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
