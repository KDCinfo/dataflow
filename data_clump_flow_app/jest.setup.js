// jest.setup.js
// Create dummy DOM elements.
document.body.innerHTML = `
  <div id="clump-form"></div>
  <input id="clump-name" value="Test Clump" />
  <input id="clump-code" value="console.log('clump');" />
  <button id="save-clump" disabled></button>
  <button id="pop-it-icon"></button>
  <div id="cross-tab-warning" class="hidden"></div>
  <select id="link-to-id">
    <option value="-1"></option>
  </select>
  <input type="checkbox" id="linked-to-left"/>
  <input type="checkbox" id="linked-to-above"/>
  <select id="column-select"></select>
  <input id="new-storage-name" />
  <div id="storage-name-tag"></div>
  <button id="export-data-button"></button>
  <button id="export-all-data-button"></button>
  <button id="import-data-button"></button>
  <button id="settings-panel-toggle"></button>
  <button id="export-panel-toggle"></button>
  <input type="checkbox" id="show-ids-checkbox"/>
  <input id="grid-repeat-range-input" type="range"/>
  <button id="storage-button-delete"></button>
  <button id="storage-button-use"></button>
  <button id="restore-backup-button"></button>
  <button id="new-storage-name-button"></button>
  <div id="clump-container"></div>
  <div id="output-container"></div>
  <span id="storage-name-label-current">default</span>
`;
