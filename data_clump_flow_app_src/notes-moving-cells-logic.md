```js
    const cellToRightId = isAdd ? -1 : this.cellIdToRight(insertionClumpId);
    const cellToRightClump = isAdd ? undefined : clumpList.find(clump => clump.id === cellToRightId);
    const subtreeRightTail = cellToRightId === -1 ? [] : this.collectSubtreeIdsBelow(cellToRightId);
    const subtreeFullRightTail = isAdd || cellToRightClump === undefined ? [] : [cellToRightClump, ...subtreeRightTail];
    const subtreeBelowTail = this.collectSubtreeIdsBelow(isAdd ? (newLeft !== -1 ? newLeft : newAbove) : insertionClumpId);
    const subtreeBelowTailClumps = subtreeBelowTail.map(id => clumpList.find(clump => clump.id === id));
    // If we're adding a cell with a linkedToAbove, we only need the bottom tail.
    const subtreeBothTails = isAdd ? subtreeBelowTail : this.collectSubtreeIdsFullTail(insertionClumpId);
    const subtreeBothTailsClumps = subtreeBothTails.map(id => clumpList.find(clump => clump.id === id));

    // CASE 3: C1R2 | Add a cell below the linkedToAbove ID
    //   - If a cell exists below the target cell, its linkedToAbove will change
    //       from the target cell to the last cell in the below tail.
    if (newAbove !== -1) {
      const targetClumpIndex = clumpList.findIndex(clump => clump.id === newAbove);
      const cellBelowTarget = clumpList.find(clump => clump.linkedToAbove === newAbove);
      if (cellBelowTarget !== undefined) {
        const subtreeBelowTailLastId = subtreeBelowTail.length === 0 ? insertionClumpId : subtreeBelowTail[subtreeBelowTail.length - 1];
        // If we're adding, the 'insertionClumpId' is the cell being linked to
        //   (because a new clump has no tail, but where it's being inserted might).
        // If we're editing, the 'insertionClumpId' is the cell being edited
        //   (because we need its tail).
        // Might could have split out add from edit, but there's more in common than not.
        cellBelowTarget.linkedToAbove = isAdd ? insertionClumpId : subtreeBelowTailLastId;

      const clumpListSliceStart = clumpList.slice(0, targetClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId && clump.id !== cellBelowTarget?.id);
      const clumpListSliceEnd = clumpList.slice(targetClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId && clump.id !== cellBelowTarget?.id );
      const cellBelowTargetClump = isAdd ? undefined : cellBelowTarget;

      updatedClumpList = [
        ...clumpListSliceStart,
        clumpToInsert,
        ...subtreeBelowTailClumps,
        cellBelowTargetClump,
        ...subtreeFullRightTail,
        ...clumpListSliceEnd
      ].filter(clump => clump !== undefined);

      return updatedClumpList;

    // CASE 4: C1R3 | Edit a cell's vertical position
    //   [ ] If moved down
    //   	   - Cell below it moves up (replace it with the moved cell's linkedToAbove)
    //   	   - Change linkedToAbove from target cell to the moved cell
    //   	   - If a cell is below the target cell, its linkedToAbove will become the
    //         last cell's ID in the column.
    //   [ ] If moved up
    //   	   - Entire below tail moves up, and any existing cells below the move-to cell will be
    //       moved to the bottom of the moved cell's below tail

    // CASE 5: C2R1 | Cell that is linkedToLeft > 0
    //         Can only be moved to a cell that is not already linked to another cell.
    if (newLeft !== -1) {
      // If linkedToLeft,
      //   1) remove the full tail, if any, from the list, then
      //   2) inject new clump, and its full subtree (if any), to the right of the linked clump.
      const leftClumpIndex = clumpList.findIndex(clump => clump.id === newLeft);

      const clumpListSliceStart = clumpList.slice(0, leftClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId );
      const clumpListSliceEnd = clumpList.slice(leftClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId );

      updatedClumpList = [
        ...clumpListSliceStart,
        clumpToInsert,
        ...subtreeBothTailsClumps,
        ...clumpListSliceEnd

      return updatedClumpList;
```

I'm refactoring a function for handling cell placement within a 1D 'clumpList'
  (which is subsequently used to generate a Trie-like node flow in a 2D matrix).

I'm missing one use case for moving a cell down, into its own tree, which, if done,
  would only move that one cell, and not its entire tail which would be recursive.
  But this poses an issue on how to handle a few scenarios, but don't think the
  complexity is worth it and am considering simply not allowing the ability to move
  a cell into its own tail (either below or right).

That use case aside, just looking for what else I'm missing. There is a bug with the current
  setup, and will see if any suggestions you might have might cover it.

There is likely a finite (and hopefully small) list of use cases for all this.
  Perhaps I've covered them all excepting the one bug I hit? (Doubtful but possible.)

```js
// Given Vars:

// The 'originalClump' param is only provided when editing an existing clump.
handleClumpPlacement(clumpList, clumpToInsert, originalClump) {
  const insertionClumpId = clumpToInsert.id;
  const newAbove = clumpToInsert.linkedToAbove;
  const newLeft = clumpToInsert.linkedToLeft;

  const isAdd = typeof originalClump === 'undefined' || originalClump === null;
  const oldAbove = isAdd ? -1 : originalClump.linkedToAbove;
  const oldLeft = isAdd ? -1 : originalClump.linkedToLeft;

  let updatedClumpList = [];

  // CASE 1: C1R1 | First cell | Add and return
  const isFirstCell = clumpList.length === 0;
  if (isFirstCell) {
    updatedClumpList = [clumpToInsert];
    return updatedClumpList;
  }

  // CASE 2: No movement: If editing, and the linkage hasn't changed, no reposition is needed.
  const linkUnchanged = !isAdd && oldAbove === newAbove && oldLeft === newLeft;
  if (linkUnchanged) {
    // Simply replace the clump in the list with the updated data.
    updatedClumpList = clumpList.map(clump => clump.id === insertionClumpId ? clumpToInsert : clump);
    return updatedClumpList;
  }

  const cellToRightId = isAdd ? -1 : this.cellIdToRight(insertionClumpId);
  const cellToRightClump = isAdd ? undefined : clumpList.find(clump => clump.id === cellToRightId);
  const subtreeRightTail = cellToRightId === -1 ? [] : this.collectSubtreeIdsBelow(cellToRightId);
  const subtreeFullRightTail = isAdd || cellToRightClump === undefined ? [] : [cellToRightClump, ...subtreeRightTail];
  const subtreeBelowTail = this.collectSubtreeIdsBelow(isAdd ? (newLeft !== -1 ? newLeft : newAbove) : insertionClumpId);
  const subtreeBelowTailClumps = subtreeBelowTail.map(id => clumpList.find(clump => clump.id === id));
  const subtreeBothTails = isAdd ? subtreeBelowTail : this.collectSubtreeIdsFullTail(insertionClumpId);
  const subtreeBothTailsClumps = subtreeBothTails.map(id => clumpList.find(clump => clump.id === id));

  const targetClumpIndex = clumpList.findIndex(clump => clump.id === newAbove);
  const cellBelowTarget = clumpList.find(clump => clump.linkedToAbove === newAbove);
  if (cellBelowTarget !== undefined) {
    const subtreeBelowTailLastId = subtreeBelowTail.length === 0 ? insertionClumpId : subtreeBelowTail[subtreeBelowTail.length - 1];
    cellBelowTarget.linkedToAbove = isAdd ? insertionClumpId : subtreeBelowTailLastId;
  }
  const clumpListSliceStart = clumpList.slice(0, targetClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId && clump.id !== cellBelowTarget?.id);
  const clumpListSliceEnd = clumpList.slice(targetClumpIndex + 1).filter(clump => !subtreeBothTails.includes(clump.id) && clump.id !== insertionClumpId && clump.id !== cellBelowTarget?.id );
  const cellBelowTargetClump = isAdd ? undefined : cellBelowTarget;

// Given a 1D array:
//
// const clumpList = [
//   ClumpInfo(id: 1, title: 'C1R1', linkedToLeft: -1, linkedToAbove: -1),
//   ClumpInfo(id: 2, title: 'C1R2', linkedToLeft: -1, linkedToAbove: 1),
//   ClumpInfo(id: 3, title: 'C1R3', linkedToLeft: -1, linkedToAbove: 2),
//   ... tails are created by linking these cells together in the 2D matrix below
//   ... each cell's linkedTo (parent) will always come before the child cell linking to it.
//   ... the clumpList order should always flow, although whether it flows down or right
//   ... at a cell with both doesn't matter, as a recursive function will map them all.
//   ... Just so long as individual cells respect their order with their 'linkedTo' parent.
// ]
//

// Given a 2D matrix:
//
//  1  2
//     3
//     4
//     5
//  6
//
//
// const clumpMatrix = [
//   C1R1 |  0    |  0
//   C1R2 |  0    |  0
//   C1R3 |< C2R1 |  0
//   0    |  C2R2 |< C3R1
//   0    |  0    |  C3R2
//   0    |  C2R3 |  0
//   0    |  C2R4 |< C3R3
//   0    |  0    |  C3R4
//   0    |  0    |  C3R5
//   0    |  C2R5 |  0
//   C1R4 |< C2R6 |< C3R6
//   0    |  C2R7 |< C3R7
//   0    |  0    |  C3R8
//   C1R5 |  0    |  0

let updatedClumpList;

// CASE 3: Cell placed below a cell in a column
if (newAbove !== -1) {
  // Need to consider for cells being added and edited.
  // Considerations / Use Cases:
  // Edit: What if cell being moved was linkedToLeft before
  // Edit: What if cell being moved was linkedToAbove before
  // What if cell is last
  // What if cell is not last

  updatedClumpList = [
    ...clumpListSliceStart,      // <----- START
    clumpToInsert,

    ...subtreeBelowTailClumps,
    cellBelowTargetClump,
    ...subtreeFullRightTail,

    ...clumpListSliceEnd         // <----- END
]}

// CASE 4: Cells with a 'newLeft' can only be linked to cells with linkedToLeft === -1
//         That is, the dropdown in the UI is filtered to only show unlinked cells.
if (newLeft !== -1) {
  // Need to consider for cells being added and edited.
  // Considerations / Use Cases:
  // Edit: What if cell being moved was linkedToLeft before
  // Edit: What if cell being moved was linkedToAbove before

  updatedClumpList = [
    ...clumpListSliceStart,      // <----- START
    clumpToInsert,

    ...subtreeBothTailsClumps,

    ...clumpListSliceEnd         // <----- END
]}

return updatedClumpList;
```

```log
0: ClumpInfo {id: 1, clumpName: 't11', clumpCode: 't11 desc desc', linkedToAbove: -1, linkedToLeft: -1}
1: ClumpInfo {id: 5, clumpName: 't222', clumpCode: '', linkedToAbove: -1, linkedToLeft: 1}
2: ClumpInfo {id: 9, clumpName: 't22b', clumpCode: '', linkedToAbove: 5, linkedToLeft: -1}
3: ClumpInfo {id: 11, clumpName: 't22c', clumpCode: '', linkedToAbove: 9, linkedToLeft: -1}
4: ClumpInfo {id: 12, clumpName: 't22d', clumpCode: '', linkedToAbove: 11, linkedToLeft: -1}
5: ClumpInfo {id: 4, clumpName: 't44', clumpCode: 't44 desc desc', linkedToAbove: 1, linkedToLeft: -1}
length: 6
```

```log
[0 0 0]

[ 1  0  0] // "id": 1,  "column":  1, "linkedClumpID": -1, "clumpName": "Development done"
[ 2  3  0] // "id": 2,  "column":  1, "linkedClumpID": -1, "clumpName": "Start Mac"
           // "id": 3,  "column": -1, "linkedClumpID":  2, "clumpName": "Start TeamViewer (optional)"
[ 4  0  0] // "id": 4,  "column":  1, "linkedClumpID": -1, "clumpName": "Start Docker Desktop"
[ 5  6  0] // "id": 5,  "column":  1, "linkedClumpID": -1, "clumpName": "Start Jenkins"
           // "id": 6,  "column": -1, "linkedClumpID":  5, "clumpName": "CLI: cd ~/Development/projects/src/dev-mac/jenkins-docker/"
[ 0  7  0] // "id": 7,  "column":  2, "linkedClumpID": -1, "clumpName": "CLI: ./runmac.sh"
[ 0  8  0] // "id": 8,  "column":  2, "linkedClumpID": -1, "clumpName": "CLI: ./runj.sh"
[ 9 10  0] // "id": 9,  "column":  1, "linkedClumpID": -1, "clumpName": "PRE-CONFIG: Build the Flutter Environment Docker Image for Jenkinsfile usage"
           // "id": 10, "column": -1, "linkedClumpID":  9, "clumpName": "1. Update the `runf.sh` file with your own Docker Hub info (i.e. `macuser`)."
[ 0 11  0] // "id": 11, "column":  2, "linkedClumpID": -1, "clumpName": "2. Increase the current version in `runf.sh`."
[ 0 12  0] // "id": 12, "column":  2, "linkedClumpID": -1, "clumpName": "3. Update the image file: `DockerfileFlutter`"
[ 0 13  0] // "id": 13, "column":  2, "linkedClumpID": -1, "clumpName": "4. Run the command that fits:"
[14 15 16] // "id": 14, "column":  1, "linkedClumpID": -1, "clumpName": "Start Jenkins Agent on Mac host (for iOS builds)"
           // "id": 15, "column": -1, "linkedClumpID": 14, "clumpName": "### Initial MacOS Agent Setup"
           // "id": 16, "column": -1, "linkedClumpID": 15, "clumpName": "Creation of the 'jenkins-workspace` Folder"
[ 0  0 17] // "id": 17, "column":  3, "linkedClumpID": -1, "clumpName": "### In Jenkins"
[ 0  0 18] // "id": 18, "column":  3, "linkedClumpID": -1, "clumpName": "### In a Terminal"
[ 0  0 19] // "id": 19, "column":  3, "linkedClumpID": -1, "clumpName": "### Additional Jenkins Agent directions:"
[ 0 20 21] // "id": 20, "column":  2, "linkedClumpID": -1, "clumpName": "### Routine MacOS Agent Startups"
           // "id": 21, "column": -1, "linkedClumpID": 20, "clumpName": "CLI: Open a new terminal window"
[ 0  0 22] // "id": 22, "column":  3, "linkedClumpID": -1, "clumpName": "CLI: cd ~/Development/projects/src/dev-mac/jenkins-docker-agent/"
[ 0  0 23] // "id": 23, "column":  3, "linkedClumpID": -1, "clumpName": "CLI: ./runa.sh"
[24 25  0] // "id": 24, "column":  1, "linkedClumpID": -1, "clumpName": "Deploy to stores"
           // "id": 25, "column": -1, "linkedClumpID": 24, "clumpName": "CLI: cd ~/Development/projects/my-app/app/tools/"
[ 0 26  0] // "id": 26, "column":  2, "linkedClumpID": -1, "clumpName": "CLI: ./rund.sh"
[27  0  0] // "id": 27, "column":  1, "linkedClumpID": -1, "clumpName": "Monitor Jenkins progress across two pipelines"
```
