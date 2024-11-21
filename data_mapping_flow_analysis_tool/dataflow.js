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

// Initial render call
renderMatrix();
