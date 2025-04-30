-----

# TOC

- @TODO:
  - Light/moderate changes
  - Potentially slightly bigger changes
- @BUGS:
  - Cannot Recreate
- @RELEASES:

-----

## @TODO:

### Light/moderate changes

- [ ] Flows: Delete -> Show preview of first clump
- [ ] Flows: Add a URL query param to open a specific data flow // ?flow=docker_flows
  - [ ] That would allow for a "share" link
- [ ] Collapsible side menu
- [ ] Add color picker for cells
- [ ] Add a queue for expanded clumps that can be reapplied after repainting the matrix (so cells can stay open after adding or updating).
- [ ] Add a link to pop up the empty page message for pages with data.
- [ ] Swap IDs for `data-` attributes
  - Leave IDs for labels
  - Add all `data-` selectors to config file
  - Swap out all query selectors for `data-` attribute selectors
  - Question: Is it worth the change? What are the pros of `data-` attributes again?

### Potentially slightly bigger changes

- [ ] Add grouping for project-level flows.
- [ ] Add a 'Flow Naming' controller: custom flow names + consistent localStorage keys (e.g. 'df_1', 'df_2', 'df_3').
  - [ ] Allow storage names to be descriptive; use a 'join table' to track descriptive names with the actual storage key names.
    - All names **in storage** should be preceded with: df_ or data_ | df_docker_flows
  - [ ] Add a property to 'AppSettingInfo' for a 'custom name' Map (a 2-column lookup table) that ties
        a custom name to a specific localStorage name (which this app restricts to either snake_case or camelCase).
  - [ ] Allow for the renaming of both custom names and localStorage names. Having a custom key name should not break the controller (e.g. grandfathered flow names).
- [ ] Implement: Drag-n-drop

-----

## @BUGS:

### Cannot Recreate

- [ ] Bug | View a clump -> Add a 'New Flow' | The open clump closes, but the space remains
- [ ] Bug | Sometimes 'Import Data' will fail silently*.
  - *An error is shown in the dev tools console.
  - Workaround: Try it again. Subequent attempts usually work.
  - Unsure if this still exists after refactor to classes.

-----

## @RELEASES:

## Version: 2.0.0

> 2025-03

- Added ability to delete any non-left-linked cells.
  - It used to only allow the last-added clump to be deleted.
- Added ability to add or move cells under any cell in a column.
  - It used to only add new cells to the bottom of a selected column.
- Added ability to move 'linked to left' links (e.g. move cells; same as above).
- ~~Add ability to unlink.~~ N/A (Can now switch between 'above' and 'left' links.)
- Added an auto-backup/restore feature (basically an "undo" that overwrites 'clumpList' with a backup).
- Bug fixes.
- Added a one-time alert with a note to export all storage flows.

> 2025-03-26

- Fixed a few 'ClumpInfo' legacy property bugs.
- Fixed bug when deleting the last clump.
- Renamed storage key for: 'dataflowInitMessage'
- New feature: Added a checkbox toggle in the Settings panel for showing IDs.

> 2025-03-28

- Refactored 'ClumpInfo' to allow for legacy props.
- Do not allow an edit to proceed with no 'linkedTo' selected.
- Disabled invalid options in 'Column Select' dropdown when editing.
  - Cannot move to the bottom of the edited column, or a column to the right.
- Handful of bug fixes.

> 2025-03-31

- More bug fixes for legacy ClumpInfo properties and importing.
- Got Jest setup. Added a few tests.
  > pnpm run test

> 2025-04-16

- Bug fix: Added 3 more `unescapeHTML` converters for 'clumpCode'.
  - Also applied `unescapeHTML` bug fix to `clumpName`.
- UI: Limit width on select dropdowns.
- New: Tapping an open cell who's clump is not on top, will surface it. Only clumps on top will be closed. Before it would close the clump under the stack, so you couldn't see it being closed.
- Also renamed some vars for clarity, and scoped everything inside the 'toggleCell' function.

## Version: 2.1.0

> 2025-04-17--22

- Added a modal for a new 'Project Flow Manager' panel.
  - It will allow for more flexible naming, renaming, grouping, and other project-type features.
  - Project Flow Manager modal status:
    - Fixed styling
      - Adapted z-index with 'clipboard' icon.
    - Adapted 'ESC' key functionality with modal.
- Added ability to rename flow names.
- Flow names are now sorted in ascending order.
  - Test data before sort
    ```
    {"gridRepeatRangeValue":"2","storageNames":["default","test11Flow","test_22a","check2","c2","dataflow_flow","bbb2","dataflow_flow_with_a_very_long_name","dataflow_flow_with_an_even_longer_very_very_long_name_xyz","aaa"],"storageIndex":2,"showIds":false}
    ```

## Version: 2.2.0

> 2025-04-22--28

- [X] Removed one-time alert message suggesting to export all your storage.
  - If anyone is actually using this tool they will have seen this by now.
- [X] Allow for bulk importing.
  - I recently cleared all the cookies for 'kdcinfo.com' for another project I was working on.
      - Fortunately I use the 'Export All' button fairly often (because I know what losing data feels like).
      - Unfortunately I have a dozen flows to import.
- [X] Add 'Activate' button to Flow Manager modal.
- [X] Reminder to export after 'n' updates (where 'n' is saved in settings).

## Version: 2.2.1

> 2025-04-28--29

- [X] Bug: Fixed restore auto-backup; had the wrong key.
- [X] Change: Added 'df_' prefix to clump lists in localStorage.
- [X] Change: Let export of 'default' keep the same name.
  - The 'default' flow was being exported as 'dataclumps.json',
    but the import didn't reverse the conversion back to 'default'.
    That aside, now that all clump lists are prefixed with 'df_',
    there's no need to rename the 'default' anymore.
- [X] Refactor: Swapped out `localStorage` calls w/ `AppStorage`.
