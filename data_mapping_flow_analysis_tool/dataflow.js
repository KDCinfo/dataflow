// Initialize the 'clumpMatrix' with the clumps from local storage.
addClumpsToMatrix();

clumpFormId.onsubmit = (event) => {
  event.preventDefault();

  // Clump cell placement has 3 options:
  //
  // [Linked]: 'Column to Add To' dropdown is irrelevant.
  // 1. Add to the same row as the linked clump, in the next column.
  //
  // [Unlinked]: 'Link to Clump' dropdown should be set to 'None'.
  // 2. When 'Last' is selected, add new clump to the last column that had a clump added to it.
  // 3. Add to a specific column.
  //
  const newLinkTo = parseInt(linkTo.value, 10) || -1;
  const isLinked = !isNaN(newLinkTo) && newLinkTo > 0;
  let columnToAddTo;

  const columnRawValue = columnSelect.options[columnSelect.selectedIndex].value;

  if (editingIndex === null) {
    //
    // ADDING A NEW CLUMP
    //
    const newClumpID = lastAddedClumpId + 1;

    const addNewClump = new ClumpInfo();
    addNewClump.id = newClumpID;
    addNewClump.clumpName = clumpNameInput.value;
    addNewClump.clumpCode = clumpCodeInput.value;

    // Populate either the 'linkedClumpId' (if linked), or the given 'Column' (if not linked).
    //
    if (isLinked) {
      // [Linked]
      columnToAddTo = lastAddedCol + 1;
      addNewClump.linkedClumpID = newLinkTo;
    } else {
      // [Unlinked]
      columnToAddTo = columnRawValue === 'last' ? lastAddedCol : parseInt(columnRawValue, 10);
      addNewClump.column = columnToAddTo;
    }

    // Add the new clump to the end of the 'clumps' 1D array.
    clumpList.push(addNewClump);

    // Inject the new clump to the 'clumpMatrix' 2D array.
    addClumpToMatrix(addNewClump);

    // Update global variables.
    lastAddedClumpId = newClumpID;
    //
  } else {
    //
    // EDITING AN EXISTING CLUMP
    //
    const editedClump = clumpList[editingIndex];

    editedClump.clumpName = clumpNameInput.value;
    editedClump.clumpCode = clumpCodeInput.value;

    editingIndex = null;
    updateDataInHtml();
    clearSelectedClumpNode();
  }

  storeClumps();
  renderMatrix();
  clumpFormId.reset();

  const howManyExpanded = clumpContainer.querySelectorAll('.clump-node.expanded').length;
  outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
  outputContainer.style.height = howManyExpanded > 0
    ? 'calc(100vh - 42px - 260px)'
    : 'calc(100vh - 42px)';
};

// When canceling an edit, reset the 'editingIndex' to null, and remove the
// last 'Link to Clump' dropdown option if it is the same as the original 'linkedClumpID'.
clumpFormId.onreset = (event) => {
  event.preventDefault();

  // This will reset the form fields, regardless of any nesting.
  // clumpFormId.reset();
  // Manually clear each input, textarea, and select within the form
  document.querySelectorAll("#clumpFormId input, #clumpFormId textarea, #clumpFormId select").forEach((field) => {
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = field.defaultChecked;
    } else {
      field.value = field.defaultValue;
    }
  });

  editingIndex = null;

  saveClumpButton.disabled = clumpNameInput.value.trim() === '';

  updateLinkToDropdownOptions(); // Updates list and toggles disabled.
  updateColumnSelectDropdownOptions(); // Toggles disabled.
  updateDataInHtml();
  // This will clear the 'edit border' from the selected clump node.
  clearSelectedClumpNode();
};

function renderMatrix() {
  // Set CSS property dynamically to control number of columns.
  const columnCount = getColumnCount();

  // Clear container before rendering
  if (clumpList.length === 0) {
    let clumpContainerContent = '<div class="empty-notes">';
    clumpContainerContent += '<h2>Data Clump Flow App</h2>';
    clumpContainerContent += '<p>Tips:</p>';
    clumpContainerContent += '<ul>';
    clumpContainerContent += '  <li>Cell clumps flow from top down by default, and left to right when linked.</li>';
    clumpContainerContent += `  <li>To export, switch to the desired storage name (using the 'Use Selected' button), then click the 'Export Data' button.</li>`;
    clumpContainerContent += '</ul>';

    clumpContainerContent += '<ul>';
    clumpContainerContent += '  <li>Clicking cells will show clump contents in a window at the bottom of the screen.</li>';
    clumpContainerContent += '  <li>Multiple cell contents can be expanded, each will be layered on top of the previous.</li>';
    clumpContainerContent += '  <li>Closing the last, or topmost content window will reveal the content window below it.</li>';
    clumpContainerContent += '  <li>Any expanded cell content window can be collapsed, even those beneath the last opened.</li>';
    clumpContainerContent += '</ul>';

    clumpContainerContent += '<ul>';
    clumpContainerContent += `  <li>When a clump is shown, although a single click on either the cell or content window will close the content window, highlighting text within the content window will not close it (so long as text is highlighted).
        </li>`;
    clumpContainerContent += '</ul>';

    clumpContainerContent += `<p>
          <code>@TODO:</code> <small>(referenced in
          <a href='https://github.com/KDCinfo/dataflow/tree/main/data_mapping_flow_analysis_tool' target='_blank'>Readme</a>
          )</small>:</p>`;
    clumpContainerContent += '<ol>';
    clumpContainerContent += '  <li>Only the last clump can be deleted, then the next, and the next.</li>';
    clumpContainerContent += "  <li>When editing clumps, only 'clump names' and 'data clumps' can be updated.";
    clumpContainerContent += "    <ol>";
    clumpContainerContent += '      <li>Clump links cannot be changed.</li>';
    clumpContainerContent += '      <li>Clumps cannot be moved.</li>';
    clumpContainerContent += '    </ol>';
    clumpContainerContent += '  </li>';
    clumpContainerContent += `  <li>Bug: Sometimes 'Import Data' will fail silently*.`;
    clumpContainerContent += "    <ol>";
    clumpContainerContent += '      <li>*An error is shown in the dev tools console.</li>';
    clumpContainerContent += '      <li>Workaround: Try it again. Subequent attempts usually work.</li>';
    clumpContainerContent += '    </ol>';
    clumpContainerContent += '  </li>';
    clumpContainerContent += '</ol>';
    clumpContainerContent += '</div>';
    clumpContainer.innerHTML = clumpContainerContent;
    clumpContainer.style.color = '#ffffff';
  } else {
    clumpContainer.innerHTML = '';
    // Set color to same as '.output-container'.
    clumpContainer.style.color = '#000000';
  }

  // [ GRID REPEAT SLIDER ]

  // [1] Add ticks to the slider.
  // const gridRepeatSliderMarkers = document.getElementById('gridRepeatSliderMarkers');
  gridRepeatSliderMarkers.innerHTML = '';
  gridRepeatOptions.forEach((option, index) => {
    const marker = document.createElement('option');
    marker.value = index + 1;
    marker.label = option;
    gridRepeatSliderMarkers.appendChild(marker);
  });

  // [2] Use value from: settings.gridRepeatRangeValue
  const cellWidth = convertGridRepeatSettingValueToCellWidth();
  clumpContainer.style.gridTemplateColumns = `repeat(${columnCount}, ${cellWidth})`;

  // [3] Update the grid repeat slider.
  gridRepeatRangeInput.value = settings.gridRepeatRangeValue;

  // [4] Update the grid repeat slider label.
  gridRepeatHTMLSpan.textContent = `[${settings.gridRepeatRangeValue}] ${cellWidth}`;

  // [5] Update the 'storageName' dropdown from settings.storage
  updateStorageNameDropdownOptions();
  storageNameLabelCurrent.textContent = settings.storageNames[settings.storageIndex];

  // [6] Enable/disable storage buttons.
  toggleStorageButtons();

  // [ CLUMP NODE PLACEMENT ]
  //
  // Note: only the last-added clump should have a 'delete' icon.
  //
  // const cell = document.createElement('div');
  // cell.className = 'clump-node';
  // cell.style.gridColumnStart = col + 1;
  // cell.style.gridRowStart = row + 1;
  // cell.innerHTML = `<strong>${clump.name}</strong><br>${clump.code}
  //               <span class="edit-icon" onclick="loadForEdit(${clumps.indexOf(clump)}, event)">✏️</span>
  //               <span class="delete-icon" onclick="deleteClump(${clumps.indexOf(clump)}, event)">❌</span>`;
  // clumpContainer.appendChild(cell);
  //
  // lastAddedClumpId = clump.id;
  //
  //  C1R1 = Col 1, Row 1
  //  ---- - ----- - -----
  //  Col1 |  Col2 |  Col3
  //  ---- - ----- - -----
  //  C1R1 |    0  |    0  | Row 1
  //  C1R2 |    0  |    0  | Row 2
  //  C1R3 |< C2R1 |    0  | Row 3
  //    0  |  C2R2 |< C3R1 | Row 4
  //    0  |    0  |  C3R2 | Row 5
  //    0  |  C2R3 |    0  | Row 6
  //    0  |  C2R4 |< C3R3 | Row 7
  //    0  |    0  |  C3R4 | Row 8
  //    0  |    0  |  C3R5 | Row 9
  //    0  |  C2R5 |    0  | Row 10
  //  C1R4 |< C2R6 |    0  | Row 11
  //    0  |  C2R7 |< C3R6 | Row 12
  //    0  |    0  |  C3R7 | Row 13
  //  C1R5 |    0  |    0  | Row 14
  //
  // Cycle through 'clumpMatrix' placing a clump cell or empty cell in HTML.
  // - All the cells are on the right side of the screen.
  // - The right side should be scrollable either vertically or horizontally when needed.
  // - All cell heights and widths should be fixed.
  // - All rows have the same number of cells, and all columns the same number of cells.
  // - When a cell title is tapped, its contents expand into a small scrollable window.

  // const newClump = {
  //     id: newClumpID,
  //     clumpName: clumpNameInput.value,
  //     clumpCode: clumpCodeInput.value,
  //     column: -1,
  //     linkedClumpID: -1,
  //   };

  let clumpListIndex = -1;

  // Cycle through the clumpMatrix to render the clumps.
  //
  for (let r = 0; r < clumpMatrix.length; r++) {
    for (let c = 0; c < clumpMatrix[r].length; c++) {
      const curClumpId = clumpMatrix[r][c];

      if (curClumpId === 0) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'clump-node empty';
        clumpContainer.appendChild(emptyCell);
        continue;
      }

      const clumpFound = clumpList.find(clump => clump.id === curClumpId);
      const clumpCell = document.createElement('div');
      clumpListIndex = clumpList.indexOf(clumpFound);

      clumpCell.className = `clump-node collapsed clump-list-index-${clumpListIndex}`;

      // Create content span for clump name and code
      const contentSpan = document.createElement('div');
      contentSpan.className = 'content-span';
      contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
            <br>${clumpFound.clumpCode.split('\n')[0]}`;
      clumpCell.appendChild(contentSpan);

      // Apply linked/unlinked class based on the condition
      clumpCell.classList.add(clumpFound.linkedClumpID !== -1 ? 'linked' : 'unlinked');

      const iconSpan = document.createElement('div');
      iconSpan.className = 'icon-span';

      // Create and append the edit icon
      const editIcon = document.createElement('div');
      editIcon.className = 'edit-icon';
      editIcon.textContent = '✏️';
      editIcon.onclick = (event) => {
        event.stopPropagation(); // Prevent toggle when clicking edit
        loadForEdit(clumpList.indexOf(clumpFound), event);
      };
      iconSpan.appendChild(editIcon);

      // Conditionally create and append the delete icon
      if (clumpList[clumpList.length - 1].id === clumpFound.id) {
        const deleteIcon = document.createElement('div');
        deleteIcon.className = 'delete-icon';
        deleteIcon.textContent = '❌';
        deleteIcon.onclick = (event) => {
          event.stopPropagation(); // Prevent toggle when clicking delete
          deleteLastClump(event);
        };
        iconSpan.appendChild(deleteIcon);
      }
      clumpCell.appendChild(iconSpan);

      // Toggle function to handle cell expansion/collapse
      const toggleCell = () => {
        clumpCell.classList.toggle('expanded');
        clumpCell.classList.toggle('collapsed');

        const isCellCollapsed = clumpCell.classList.contains('collapsed');
        const howManyExpanded = clumpContainer.querySelectorAll('.clump-node.expanded').length;

        outputContainer.style.marginBottom = howManyExpanded > 0 ? '260px' : '0';
        outputContainer.style.height = howManyExpanded > 0
          ? 'calc(100vh - 42px - 260px)'
          : 'calc(100vh - 42px)';

        contentSpan.innerHTML = `<strong>${clumpFound.clumpName}</strong>
              <br>${isCellCollapsed
            ? clumpFound.clumpCode.split('\n')[0]
            : '<pre>' + unescapeHTML(clumpFound.clumpCode) + '</pre>'
          }`;

        if (!isCellCollapsed) {
          contentSpan.querySelector('pre').style.zIndex = howManyExpanded + 10;
        }
      };

      // Add toggle click listener to contentSpan but without any inner <pre> tags.
      contentSpan.addEventListener('click', (event) => {
        // event.stopPropagation(); // Prevent bubbling to avoid unintended behavior.
        if (window.getSelection().toString()) {
          // Prevent toggle if there's a selection.
          event.stopPropagation();
          return;
        }
        toggleCell();
      });

      // Append cell to the container
      clumpContainer.appendChild(clumpCell);
    }
  }

  updateLinkToDropdownOptions(); // Updates list and toggles disabled.
  updateColumnSelectDropdownOptions(); // Toggles disabled.
  updateDataInHtml();

  // Re-highlight edited cell, if any.
  if (editingIndex !== null) {
    const indexCell = document.querySelector(`.clump-list-index-${editingIndex}`);
    indexCell && indexCell.classList.add('clump-node-selected');
  }
}

function unescapeHTML(code) {
  return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function togglePanel(event) {
  event.stopPropagation();

  AppConfig.debugConsoleLogs && console.log('togglePanel');
  AppConfig.debugConsoleLogs && console.log(event.target.parentElement.parentElement);

  const panelToExpand = document.querySelector('.info-panel.export-import');
  const panelHotspot = document.querySelector('.panel-from-hotspot');

  if (panelToExpand.classList.contains('panel-from-expanded-to-collapsed')) {
    classListChain(panelToExpand)
      .remove('panel-from-expanded-to-collapsed')
      .add('panel-from-collapsed-to-expanded');
  } else {
    classListChain(panelToExpand)
      .remove('panel-from-collapsed-to-expanded')
      .add('panel-from-expanded-to-collapsed');
  }

  // ? panelHotspot.children[0].textContent = '▶' // right arrow
  panelToExpand.classList.contains('panel-from-expanded-to-collapsed')
    ? panelHotspot.children[0].textContent = '◀'
    : panelHotspot.children[0].textContent = '▼';
}

// Initial render call
renderMatrix();
