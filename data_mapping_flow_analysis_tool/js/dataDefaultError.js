import ClumpInfo from './ClumpInfo.js';

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
