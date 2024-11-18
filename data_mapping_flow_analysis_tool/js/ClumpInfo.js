import AppConstants from './appConstants.js';

export default class ClumpInfo {
  constructor(
    id = AppConstants.defaultClumpValues.id,
    clumpName = AppConstants.defaultClumpValues.clumpName,
    clumpCode = AppConstants.defaultClumpValues.clumpCode,
    column = AppConstants.defaultClumpValues.column,
    linkedClumpID = AppConstants.defaultClumpValues.linkedClumpID
  ) {
    this.id = id;
    this.clumpName = clumpName;
    this.clumpCode = clumpCode;
    this.column = column;
    this.linkedClumpID = linkedClumpID;
  }

  // Array of int properties.
  get clumpPropertiesInt() {
    let intProps = [];
    for (const key in this) {
      if (typeof this[key] === 'number') {
        intProps.push(key);
      }
    }
    return intProps;
  }

  getData(key) {
    if (key in this) {
      return this[key];
    }
    throw new Error(`Invalid key: ${key}`);
  }

  setData(key, value) {
    if (!(key in this)) {
      throw new Error(`Invalid key: ${key}`);
    }
    if (key in this.clumpPropertiesInt && typeof value !== 'number') {
      throw new Error(`This clump key [${key}] must be a number.`);
    }
    this[key] = value;
    return true;
  }

  // Factory for creating an error instance.
  static createErrorInfoData() {
    this.logError('Error creating ClumpInfo instance');

    return new ClumpInfo(
      AppConstants.defaultClumpErrorValues.id,
      AppConstants.defaultClumpErrorValues.clumpName,
      AppConstants.defaultClumpErrorValues.clumpCode,
      AppConstants.defaultClumpErrorValues.column,
      AppConstants.defaultClumpErrorValues.linkedClumpID
    );
  }

  logError(errMsg) {
    console.error(`ClumpInfo Error: ${errMsg}`);
  }
}
