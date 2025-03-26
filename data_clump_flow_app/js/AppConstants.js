export default class AppConstants {
  // [Q] ChatGPT Prompt: Can a JavaScript regex pattern check for either "camelCase" or
  //                    "snake_case" (both initial lowercase) without them being mixed?
  // [A] Yes: Here is a pattern for either camelCase OR snake_case, but not mixed.
  static keyNamePattern = /^(?:[a-z][a-zA-Z0-9]*|[a-z][a-z0-9_]*[a-z0-9])$/;

  // Grid Cells: 'gridRepeatRangeValue: 2' => '1fr'
  static gridRepeatOptions = ['auto', '1fr', '150px', '200px', '250px', '300px'];

  // Local Storage.
  static localStorageSettingsKey = 'dataClumpFlowAppSettings';
  // Session Storage.
  static sessionStorageSettingsKey = 'dataClumpFlowAppSessionStorageKey';

  static defaultStorageName = 'default';
  static defaultExportStorageName = 'dataclumps';

  // Regex checks for either 'camelCase' or 'snake_case'.
  // let storageNameErrorText = ``;
  static storageNameErrTextNameEmpty = `Please provide a storage name.`;
  static storageNameErrTextNameExists = `This storage name already exists.`;
  static storageNameErrTextInvalid = `<ul>For consistent storage names:
          <li>Start with a lowercase character.</li>
          <li>Use either 'camelCase' or 'snake_case'.</li>
        </ul>`;
  static storageNameErrRestoreText = `There was an issue with this backup.
Ensure the active storage is selected, and a backup exists.`;
  static storageNameErrDelText = `Cannot delete the default or currently active storage names.`;
  static storageNameErrUseText = `Cannot load an already active storage name.`;

  static defaultClumpValues = {
    id: -1,
    clumpName: '',
    clumpCode: '',
    linkedToAbove: -1,
    linkedToLeft: -1
  };
  static defaultClumpErrorValues = {
    id: -2,
    clumpName: 'ErrName',
    clumpCode: 'ErrCode',
    linkedToAbove: -2,
    linkedToLeft: -2
  };
};
