>
> Start of possible function for when clumps change either
>     their linkedToLeft or linkedToAbove properties,
>     or when cells are added and linked to cells that are
>     not at the end of a column (or row, for new linkedToLefts).
>

The following was just thinking things through with the thought of
  sharing with ChatGPT (o3-mini-high; deep research) to see what kind
  of solution it might provide. This was attempted with GitHub Copilot (4o)
  which only split out two functions and did not provide a moving cell solution.

# Thoughts on moving cells...

- Will only be dealing with moving a clump when
  a clump form is edited/updated (drag-n-drop will be done later).
- If cell has a:
  `linkedToLeft` --- Hotspots will be cells available to move to the right of (no call has its ID as another cell's linkedToLeft)
  `linkedToAbove` ---
    - All cells that don't have a linkedToLeft will have a linkedToAbove
        (except the first cell, which can't be moved or deleted).
    - Should move entire thread under the cell that's being moved.
    - Say we're moving the 3rd cell in a 1-column, 4-deep vertical to the first cell, above its parent, the 2nd of the 4 cells.
      - Cell 2's linkedToAbove should change to link to what used to be the 4th cell (now the 3rd because it shifted up with cell #2).
    - Maybe restrict to only allow moving within a column (up or down), not across columns... unless, well... never mind. It needs to be allowed.
    - Suppose would have to move the existing linkedToAbove cell, to below the last cell in the moved cell's column.
    - So if Cell 2 had another cell between it and the moved cell,
        so say, moving cell #4 of a 5-deep vertical to link to the first cell,
        cell #3 would still follow #2 into their new positions of 4 and 5, while cells 4 and 5 would be moved to be cells 2 and 3.
      - They're not switching places; we're grafting --- it's just too small of an example.
      - Hopefully all cells with linkedToLeft will follow naturally in renderMatrix.
        If not, I'll need to refactor it to do so.
- Further thoughts:
  - clumpList is ordered... I think.
    [Edit: This has been answered at the bottom | tl;dr: it is, and isn't.]
    ~~Moving cells will affect the order.~~
    ~~Indexes matter... somewhere... yes?~~
      ~~Or, is the index always only used for plucking a specific clump from the list?~~
    - But maybe the renderMatrix will still be able to handle it;
        it should move cells to the left down when inserting.
      Unsure if the flow logic still has a [0...n] and 'top-down-right' flow,
        or if it will respect the linkedToAbove and insert it wherever it lands, accordingly.
    So we need a function to 'inject' an existing ID as another cell's linkedToAbove ID,
      and linking an existing cell below it, to the last cell in the moved cell's column.
    Maybe moving a cell down (or right) moves an individual cell,
      and moving up (or left) grafts the cell's entire tail, including cells both down and right of the moved cell.
    (Deleting is gonna be so much easier... :sweat-smile:)
  - The end result is one of changing a clump with a new linkedToLeft or linkedToAbove ID.
      In saving the updated clump, any existing clump needs to be moved per notes above.
      Changing linkedToLeft to a different linkedToLeft should be straightforward.
  - After-thought: Cannot move a clump to a clump that's in its own tail/tree, not even just the one cell.
      The one cell can be moved if it's being moved down, but only within the same column, so the cell beneath the moving cell can be moved up, into the moved cell's old place (i.e. update it with the moved cell's old linkedToAbove ID).
  - In retrospect, new clumps should be able to be linked to a not-last-in-column clump as well.
- **More thoughts:**
  - We need a tail of IDs that flow to the right of the clump being moved.
    - If moving a cell that is linked to, it cannot be moved to any cell in this tail (the right-linked tail will move with the cell).
  - We need a 2nd tail of IDs that flow under the clump being moved.
    - If moving down this tail, we're just moving the one cell down, and the one below it move up into the moved cell's position (linkedToAbove).
    - We need to know the ID of the link above the cell being moved.
    - If moving up the column or to a column to the left, the cell being linked to will have any cell below it moved to below the moved column's tail.

### ---------- ---------- ---------- ---------- ----------

## ChatGPT suggestion (o3-mini-high: deep research | 2025-03-11)

### [AppSettings.js]

```js
handleFormSubmit(event) {
  event.preventDefault();  // Prevent default form submission behavior

  // Ensure the currently active storage name is valid (prevent updating a non-existent storage).
  if (!this.checkIfStorageNameStillExists()) {
    return;
  }

  // Determine linking info based on the selected "Add to Column" option and link inputs.
  const columnRawValue = this.uiElements.columnSelect.options[
    this.uiElements.columnSelect.selectedIndex
  ].value;
  const { isLinkedLeft, linkId } = this.getLinkInfo(columnRawValue);

  // Check if we are adding a new clump or editing an existing one.
  if (this.dataManager.getData('editingIndex') === null) {
    // **ADDING A NEW CLUMP**
    const newClumpID = this.dataManager.getData('lastAddedClumpId') + 1;
    const newClump = new ClumpInfo();                 // Create a new ClumpInfo instance
    newClump.id = newClumpID;
    newClump.clumpName = this.uiElements.clumpNameInput.value;
    newClump.clumpCode = this.uiElements.clumpCodeInput.value;
    // Assign the parent link based on selection (linkedToLeft or linkedToAbove).
    if (isLinkedLeft) {
      newClump.linkedToLeft = linkId;
      newClump.linkedToAbove = -1;  // Ensure the alternate link field is cleared
    } else {
      newClump.linkedToAbove = linkId;
      newClump.linkedToLeft = -1;   // Clear the unused link field
    }

    // Update data: add the new clump to the clump list and matrix, and update global ID counter.
    const currentClumpList = this.dataManager.getData('clumpList');
    const updatedClumpList = [...currentClumpList, newClump];       // Append new clump immutably
    this.dataManager.setData('clumpList', updatedClumpList);        // Save new list to data manager
    this.dataManager.addClumpToMatrix(newClump);                    // Inject new clump into the 2D matrix structure
    this.dataManager.setData('lastAddedClumpId', newClumpID);       // Update the last added clump ID tracker
    // (Note: lastAddedCol will be updated in renderMatrix based on the new matrix state)

  } else {
    // **EDITING AN EXISTING CLUMP**
    const editIndex = this.dataManager.getData('editingIndex');
    AppConfig.debugConsoleLogs && console.log('clumpList before edit:', this.dataManager.getData('clumpList'));

    // Clone the targeted clump data to avoid mutating state directly, then apply form changes.
    const originalClump = this.dataManager.getData('clumpList')[editIndex];
    const editedClump = structuredClone(originalClump);
    editedClump.clumpName = this.uiElements.clumpNameInput.value;
    editedClump.clumpCode = this.uiElements.clumpCodeInput.value;
    // Determine new parent link based on user selection and update the edited clump.
    if (isLinkedLeft) {
      editedClump.linkedToLeft = linkId;
      editedClump.linkedToAbove = -1;   // Clear the above link if switching to a left link
    } else {
      editedClump.linkedToAbove = linkId;
      editedClump.linkedToLeft = -1;    // Clear the left link if switching to an above link
    }

    // Handle repositioning logic if the link relationships changed (extract to helper for clarity).
    const currentClumpList = this.dataManager.getData('clumpList');
    const newClumpList = this.handleClumpMovement(currentClumpList, originalClump, editedClump);
    // (The helper will adjust any other clumps as needed when the structure is changed.)

    // Update the data store with the edited clump and refreshed list.
    this.removePopUp();  // Close the edit form popup UI
    this.dataManager.setData('editingIndex', null);               // Clear editing mode
    this.dataManager.setData('clumpList', newClumpList);          // Save the modified clump list
    AppConfig.debugConsoleLogs && console.log('clumpList after edit - after update:', this.dataManager.getData('clumpList'));

    // Refresh UI elements related to data and selection.
    this.updateDataInHtml();            // Update debug info display (lastAddedClumpId, lastAddedCol, etc.)
    this.clearSelectedClumpNode();      // Remove highlight from the previously selected clump node
  }

  // **Finalize: Persist data and refresh UI**
  this.dataManager.storeClumps();        // Save the clumps data to local storage (or backend)
  this.resetFormFields();                // Clear out the form inputs for next use
  this.renderMatrix();                   // Re-render the clump matrix in the UI to reflect changes

  // Adjust the output container styling based on expanded clump nodes (for UX spacing).
  const expandedCount = this.uiElements.clumpContainer.querySelectorAll('.clump-node.expanded').length;
  this.uiElements.outputContainer.style.marginBottom = expandedCount > 0 ? '260px' : '0';
  this.uiElements.outputContainer.style.height = expandedCount > 0
    ? 'calc(100vh - 42px - 260px)'
    : 'calc(100vh - 42px)';
},
```

### [AppSettings.js]

```js
/**
 * Adjusts clump positions in the list when a clump's linkage (parent) changes.
 * This function handles reassigning related clumps and reordering the clump list to maintain a valid structure.
 * @param {Array} clumpList - The current list of all clump objects (before edit).
 * @param {Object} originalClump - The original clump data (before edits).
 * @param {Object} updatedClump - The clump data after edits (with updated link fields).
 * @returns {Array} - A new clump list with the clump repositioned as needed.
 */
handleClumpMovement(clumpList, originalClump, updatedClump) {
  const movedClumpId = updatedClump.id;
  const oldAbove = originalClump.linkedToAbove;
  const oldLeft = originalClump.linkedToLeft;
  const newAbove = updatedClump.linkedToAbove;
  const newLeft = updatedClump.linkedToLeft;

  // If the linkage hasn't changed (same parent as before), no reposition needed.
  const linkUnchanged = oldAbove === newAbove && oldLeft === newLeft;
  if (linkUnchanged) {
    // Simply replace the clump in the list with the updated data.
    return clumpList.map(clump => clump.id === movedClumpId ? updatedClump : clump);
  }

  // Helper function to recursively collect all descendant clump IDs (vertical below or horizontal right).
  const collectSubtreeIds = (rootId) => {
    let ids = [rootId];
    clumpList.forEach(clump => {
      if (clump.linkedToAbove === rootId || clump.linkedToLeft === rootId) {
        // If this clump is directly below or to the right of the root, include it and its subtree.
        ids = ids.concat(collectSubtreeIds(clump.id));
      }
    });
    return ids;
  };

  // Determine the full set of IDs in the moved clump's subtree (itself and any descendants).
  const subtreeIds = collectSubtreeIds(movedClumpId);

  // Remove the entire subtree from the original list (we will reinsert it in the new position).
  const filteredList = clumpList.filter(clump => !subtreeIds.includes(clump.id));

  // If the clump was moved from a vertical chain, ensure the gap is closed:
  // Any clump that was directly beneath the moved clump now needs to link to the moved clump's original parent.
  if (oldAbove !== -1) {
    const orphanIndex = filteredList.findIndex(c => c.linkedToAbove === movedClumpId);
    if (orphanIndex !== -1) {
      // Reassign the orphan's linkedToAbove to the moved clump's old parent (or -1 if none, making it a new root).
      filteredList[orphanIndex] = { ...filteredList[orphanIndex] };  // shallow clone to safely modify
      filteredList[orphanIndex].linkedToAbove = oldAbove;
    }
  }

  // Prepare the subtree nodes in their original order, but with the updated clump data replacing the old entry.
  const movedSubtreeNodes = clumpList
    .filter(clump => subtreeIds.includes(clump.id))
    .map(clump => clump.id === movedClumpId ? updatedClump : clump);

  // Find the new parent in the filtered list (the clump to which we're re-linking).
  const newParentId = newLeft !== -1 ? newLeft : newAbove;
  const parentIndex = filteredList.findIndex(c => c.id === newParentId);

  // Insert the moved subtree right after the new parent in the list.
  // This places the moved clump under its new parent in the linear order.
  const insertPosition = parentIndex + 1;
  const updatedClumpList = [
    ...filteredList.slice(0, insertPosition),
    ...movedSubtreeNodes,
    ...filteredList.slice(insertPosition)
  ];

  // After reordering, we rebuild the clumpMatrix to reflect new positions.
  this.dataManager.resetClumpListConverted && this.dataManager.resetClumpListConverted();
  if (typeof this.dataManager.addClumpsToMatrix === 'function') {
    this.dataManager.addClumpsToMatrix();
  }

  return updatedClumpList;
}
```

### ---------- ---------- ---------- ---------- ----------

# Gonna Go It Manually

- Will pull out a couple concepts from ChatGPT's solution,
    (e.g. its cyclical creation of a cell's tail)
    then will spin my own solution that will account for
    both adding and editing clumps, as well as distinguishing
    between moving a linkedToLeft vs. both moving up or down
    when changing a linkedToAbove.

- Put on music and figure out moving cells.
		@3/12/2025 10:21:42 AM
    @3/13/2025 2:47:57 AM
		- Skeleton: Dataflow
				Working through Use Cases for moving cells.

		Case 1: C1R1 | First Cell
			- No movement
		Case 2: C1R3 | Cell linked to from right =>
			- If cell is linked to from right, need full right tail, and below tail
		Case 3: C1R2 | Cell linked to from below
			- If cell is linked to from below, only need below tail
		Case 4: C2R1 | Cell that is linkedToLeft > 0
			- Can only be moved to a cell that is not being left-linked to
		Case 5: C1R2 | Cell that is linkedToAbove >0

		- Below Tail
			- The below tail will follow any right-linked cells in the below tail, adhering to these two Below Tail rules
			1) If in 1st column, below tail will flow to end of column 1
			2) If in column > 1, below tail will flow until a cell has a linkedToLeft > 0
		- Moving
			- Cells with linkedToLeft > 0 cannot be moved to a cell within either of its tails
				^ This is a UI change
			- Cells with linkedToAbove > 0
        - UI dropdown should distinguish between cells above and below the edited cell
				- If moved down
					- Cell below it moves up (replace it with the moved cell's linkedToAbove)
					- Change linkedToAbove from target cell to the moved cell
					- If a cell is below the target cell, its linkedToAbove will become the last cell's ID in the column,
						given the rule of stopping short of any cell with a linkedToLeft
				- If moved up
					- Entire below tail moves up, and any existing cells below the move-to cell will be
            moved to the bottom of the moved cell's below tail

@3/13/2025 3:22:32 AM
	- The clumpList needs to be ordered, but not cell by cell.
			A cell's linkedTo needs to always be before its parent's cell.
			A cell cannot be placed in the matrix without its linked cell already there.
	- When moving a linkedToAbove down its own tail, it can only be 'shifted' down, and not to its right.
		I don't believe moving linkedToLeft or moving a linkedToAbove 'up' should affect their orders.

### ---------- ---------- ---------- ---------- ----------

```js
console.clear();

// 1
// 2
// 3 <- 4
//      5
//      8 <- 9
//           10
//      11
// 6
// 7
//
// [3] => 6 7
// [4] => 5 8 9 10 11
//
const clumpList = [
  { id: 1, linkedToAbove: -1, linkedToLeft: -1 },
  { id: 2, linkedToAbove: 1, linkedToLeft: -1 },
  { id: 3, linkedToAbove: 2, linkedToLeft: -1 },
  { id: 4, linkedToAbove: -1, linkedToLeft: 3 },
  { id: 5, linkedToAbove: 4, linkedToLeft: -1 },
  { id: 6, linkedToAbove: 3, linkedToLeft: -1 },
  { id: 7, linkedToAbove: 6, linkedToLeft: -1 },
  { id: 8, linkedToAbove: 5, linkedToLeft: -1 },
  { id: 9, linkedToAbove: -1, linkedToLeft: 8 },
  { id: 10, linkedToAbove: 9, linkedToLeft: -1 },
  { id: 11, linkedToAbove: 8, linkedToLeft: -1 },
];
const movedClumpId = 3;

const collectSubtreeIdsBelow = (rootId) => {
  let idsBelow = [];
	console.log('idsBelow: ', idsBelow);
  clumpList.forEach((clump) => {
    console.log(`collectSubtreeIdsBelow: clump [${clump.linkedToAbove}] [${rootId}]: `, clump);
    if (clump.linkedToAbove === rootId) {
      idsBelow.push(clump.id);
      idsBelow = idsBelow.concat(collectSubtreeIdsBelow(clump.id));
			console.log('collectSubtreeIdsBelow: linkedToAbove === ', rootId);
    }
  });
  return idsBelow;
};
const subtreeBelowTail = collectSubtreeIdsBelow(movedClumpId);
console.log(`subtreeBelowTail for [${movedClumpId}]`);
console.table(subtreeBelowTail);

const subtreeBelowTailLastId = subtreeBelowTail[subtreeBelowTail.length - 1];
const getlLastCell = (lastClumpId) => {
  return clumpList.find((clump) => clump.id === lastClumpId) || { id: -1 };
};
const cellLast = getlLastCell(subtreeBelowTailLastId) || -1;
console.log('cellLast: ', cellLast); // cellLastId === -1 ? [] :

const collectAllSubtreeIds = (linkedToId) => {
  let ids = [];
  clumpList.forEach((clump) => {
    if (clump.linkedToLeft === linkedToId || clump.linkedToAbove === linkedToId) {
      ids.push(clump.id);
      ids = ids.concat(collectAllSubtreeIds(clump.id));
			// console.log('collectAllSubtreeIds: linkedToAbove === || ', rootId);
    }
  })
  return ids;
}
const cellIdToRight = (movedClumpId) => {
  return clumpList.find((clump) => clump.linkedToLeft === movedClumpId)?.id || -1;
};
const cellToRightId = cellIdToRight(movedClumpId);
console.log('cellToRightId: ', cellToRightId); // cellToRightId === -1 ? [] :

const subtreeRightTail = cellToRightId === -1 ? [] : collectAllSubtreeIds(cellToRightId);
console.log(`subtreeRightTail for [${cellToRightId}]`);
console.table(subtreeRightTail);
```

### ---------- ---------- ---------- ---------- ----------
