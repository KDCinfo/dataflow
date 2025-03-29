import AppConstants from './AppConstants.js';
import AppHelpers from './AppHelper.js';

export default class ClumpInfo {
  constructor({
    id = AppConstants.defaultClumpValues.id,
    clumpName = AppConstants.defaultClumpValues.clumpName,
    clumpCode = AppConstants.defaultClumpValues.clumpCode,
    linkedToAbove = AppConstants.defaultClumpValues.linkedToAbove,
    linkedToLeft = AppConstants.defaultClumpValues.linkedToLeft,
    column,         // legacy property, remains undefined if not provided
    linkedTo,       // legacy property, remains undefined if not provided
    linkedClumpID   // legacy property, remains undefined if not provided
  } = {}) {
    this.id = id;
    this.clumpName = clumpName;
    this.clumpCode = clumpCode;
    this.linkedToAbove = linkedToAbove;
    this.linkedToLeft = linkedToLeft;

    // Legacy properties.
    this.column = column;
    this.linkedTo = linkedTo;
    this.linkedClumpID = linkedClumpID;
  }

  getData(key) {
    if (key in this) {
      return this[key];
    }
    throw new Error(`Invalid key: ${key}`);
  }

  setData(keyToSet, newValue) {
    if (!(keyToSet in this)) {
      throw new Error(`[ClumpInfo] Invalid key: ${keyToSet}`);
    }
    const arrayOfIntKeys = AppHelpers.listOfKeysWithInts().bind(this);
    if (keyToSet in arrayOfIntKeys && typeof newValue !== 'number') {
      throw new Error(`[ClumpInfo] This clump key [${keyToSet}] must be a number.`);
    }
    this[keyToSet] = newValue;
    return true;
  }

  // Factory for creating an error instance.
  static createErrorInfoData() {
    ClumpInfo.logError('Error creating ClumpInfo instance');

    return new ClumpInfo(
      AppConstants.defaultClumpErrorValues.id,
      AppConstants.defaultClumpErrorValues.clumpName,
      AppConstants.defaultClumpErrorValues.clumpCode,
      AppConstants.defaultClumpErrorValues.linkedToAbove,
      AppConstants.defaultClumpErrorValues.linkedToLeft
    );
  }

  static logError(errMsg) {
    console.error(`ClumpInfo Error: ${errMsg}`);
  }

  static clumpInfoToString(clumpInfo) {
    return `ClumpInfo: ${JSON.stringify(clumpInfo)}`;
  }

  static fromJSON(jsonData) {
    return new ClumpInfo(jsonData);
  }
  static toJSON(clumpInfo) {
    return JSON.stringify(clumpInfo);
  }
}
