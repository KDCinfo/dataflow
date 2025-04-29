# Data Mapping Flow Analysis Tool

<img src="./images/icon128.png" align="right" width="128" height="128">

## Purpose

Easily enter data flows for self-analysis, or comparison* between similar flows.

Each data point can be provided with chunks of code or text for easy reference.

* **Comparisons:**

The beauty of the __Data Clump Flow App__ is you can have the app running in multiple browser windows or tabs at the same time for live comparisons between flows.

If the app is run in more than one window or tab, and the list of flows is modified (every flow has its own 'storage entry'), any other open apps will provide a notification (especially if the current flow in one window is deleted in another).

> Live Demo: [kdcinfo.com/app/dataflow/](https://kdcinfo.com/app/dataflow/)

<p align="center"><img src="https://github.com/KDCinfo/dataflow/blob/main/data_clump_flow_app/images/data_flow_blog_screenshot3c.png" width="600" title="Data Clump Flow App - Webpage Preview" alt="Data Clump Flow App - Webpage Preview"/></p>

-----

The "Data Mapping Flow Analysis Tool" was conceptualized when analyzing a variety of `Jenkinsfile`s from multiple sources, and the environments, stages, and flows within each.

- The primary thought was to try to keep the flow simple (a sticking point in previous flow-recording app attempts):
  - Cell content: Title.
  - Cell content: Data clump that can be expanded.
- Data nodes are either linked to, or simply follow other cells.
- Initialized: Nov 2024

```
  <title>Data Mapping Flow Analysis Tool</title>
  <meta name="description" content="A tool to map and visualize branching data flows.">
```

## Original Chat with Claude 3.5 Sonnet

- Posted: @10/30/2024 5:23:04 AM

Hello. I'm looking for a fairly simple JavaScript and/or PHP-based web app that can do the following:

The app will be a split horizontal screen.

- The left side will allow for form input (perhaps 30% of the width; form can be tall)
- The right side will show previously entered values as tappable nodes
- by default, the right side first-line elements should show just ~100px of the first line for each clump
- When a one-line clump is tapped on the right, it will expand showing the full clump
- More than one clump can be opened; opening one clump does not close any others

Form input:

- Take in a clump of code (e.g. textarea)
- Allow that clump to be named
- Allow the clump to be linked to a previously entered clump
- Allow the clump to be given a column <int>; if linked to a previous clump entry, column must be equal to, or +1, to the linked clump
- Allow the first line of the code to be displayed by itself
- The first line can be tapped to expand or collapse the clump of code when displayed on the right

Once entered:

- The 1st clump is shown on the right
- A 2nd clump of code can be added in the form
- Tapping an 'edit' icon for a clump entry on the right side will load a previously saved clump

Data:

- Data can be stored locally, such as in the browser
- Data can be imported and exported as JSON

In summary, I'm human and may have forgotten something. Feel free to add any oversights that could make sense for this.

Can you provide the code for such an app?

-----

Claude and I went back and forth through six draft variations. I finally gave up relying on ChatGPT >90%: I stripped a lot of the code and went to work on specific pieces, for which ChatGPT was still able to help with the individual sections.

> 10 days later... DMFAT was borne to GitHub.

-----

## Adding Session Storage to Isolate Active Storage Index

@11/24/2024 3:26:25 PM
@11/24/2024 3:37:31 PM
- Dev Play: Data Clump Flow App

		The app needs to be able to detect if other tabs with the app are also open, and perhaps which tab it is on,
			so that the app in other tabs don't change the app in the current tab --- least not the current storage setting.
		Thinking this through...
		Perhaps `sessionStorage` could help such that the currently opened app
			wouldn't interfere with any data flow app that's open in other tabs.
		It would seem the only part that needs detection is for the 'useSelected' setting.
			Basically, don't change the current storage when the page is refreshed.
			Perhaps that setting should always be in sessionStorage, and not in localStorage?
			No, I don't believe sessionStorage is persisted,
					and it needs an initial load value which should be the last storage that was set.
				But then, after the initial load, sessionStorage takes over.
			So I'll need to be able to see if it's present on reload,
				and if not, (meaning it's a load and not a reload), use localStorage to populate it.
			So only one vector point?
				Check on load/reload, after loading localStorage?
			I currently can't think of any other part of the app or setting that "shouldn't" listen to other tabs.

@11/24/2024 3:51:22 PM
- Other tabs will have their own sessionStorage setting, so updating localStorage every time is perfectly fine.

@11/24/2024 4:24:34 PM
- Use 'sessionStorage' for which storage is active, so other open tabs don't change.
  - What happens when you delete a storage in one tab,
      but another open app still shows it in the list,
      and the other tab
      - tries to use it?
      - was using it already and tried to make an update to it?

### Outline of what should happen with 'sessionStorage' and 'localStorage'

1. AppSettings are loaded in from 'localStorage' which contains both the 'storageNames' and 'storageIndex' settings.
    defaultAppSettings: {
      gridRepeatRangeValue: 0,
      storageNames: ['error'], // camelCase or snake_case.
      storageIndex: 0
    }
2. If 'sessionStorage' is not present, set 'sessionStorage' from 'localStorage'.
3. Use 'sessionStorage' to set the 'AppSettings' 'storageIndex' setting.
4. When switching storage, update 'sessionStorage' and 'localStorage'.
5. When creating or deleting storage, update 'sessionStorage' and 'localStorage' and notify other tabs to refresh.

## Testing

### Testing: The Active Index Doesn't Change on Reload

Part 1

- Open an incognito Chrome browser window (or another browser with dev tools)
- Open Dev Tools -> Application -> Local Storage
  - [Observe] It should be empty.
- Open the app in the incognito window.
- Dev Tools: Local Storage should now have the app settings.
  - > AppSettings: AppSettingsInfo:
  - > `{ gridRepeatRangeValue: 2, storageNames: Array(1), storageIndex: 0 }`
- Change to Dev Tools: Session Storage
  - [Observe] { 'dataClumpFlowAppSessionStorageKey': 0 }

Part 2

- Open a 2nd incognito Chrome browser window
- Open Dev Tools -> Application -> Local Storage
- [Observe] It should be empty.
- Open the app in the 2nd incognito window.
- Dev Tools: Local Storage should now have the app settings.
  - > AppSettings: AppSettingsInfo:
  - > `{ gridRepeatRangeValue: 2, storageNames: Array(1), storageIndex: 0 }`
- Change to Dev Tools: Session Storage
- [Observe] { 'dataClumpFlowAppSessionStorageKey': 0 }

Part 3

- In the 2nd browser, create a new storage: t1
- [Observe] Message is displayed in 1st browser
- In the 2nd browser, Select the new storage and click the 'Use Selected' button.
- [Observe] Message is displayed in 1st browser

Part 4

- In the 1st browser, refresh the page.
- [Observe] The selected storage is still 'default'.
- In the 2nd browser, refresh the page.
- [Observe] The selected storage is still 't1'.

```
StorageEvent {
  isTrusted: true,
  key: 'dataClumpFlowAppSettings',
  oldValue: '{"gridRepeatRangeValue":2,"storageNames":["default","t1","t2","t3","t4","t5"],"storageIndex":0}',
  newValue: '{"gridRepeatRangeValue":2,"storageNames":["default","t1","t2","t3","t4","t5","t6"],"storageIndex":0}',
  ...}
```

### Testing: Delete Prevents Adding Clumps

Part 1

- Open an incognito Chrome browser window (or another browser with dev tools)
- Open the app in the incognito window.
- Create a new storage: t1
- Use the new storage: t1
- Add a clump: AA11
- Create a new storage: t2
- Use the new storage: t2
- Add a clump: BB22
- Use the new storage: t1
  - [Observe] Clump AA11 is displayed.

Part 2

- Open a 2nd incognito Chrome browser window
- Open the app in the 2nd incognito window.
- Select the storage: default
- Click the 'Use Selected' button
  - [Observe] Empty page message is displayed
- Select the storage: t1
- Click the 'Delete Selected' button
- Confirm the deletion
  - [Observe] Message is displayed in 1st browser

Part 3

- Back in the 1st browser, try to add a clump
  - [Observe] An alert dialog is displayed
  - [Observe] The clump is not added

-----

### Testing | Jest

@3/30/2025 11:22:31 PM
- Skeleton: Dataflow
	- Mac
		- To install Jest:
			- Upgraded Homebrew
				> brew --version | 4.4.12
				> brew upgrade
				> brew --version | 4.4.26
			- Install pnpm
				> brew install node
				> brew install pnpm
				> node --version | 23.10.0
				> pnpm --version | 10.7.0
			- Install Jest
				> pnpm add --save-dev jest
					| devDependencies: + jest 29.7.0
					| Done in 5.5s using pnpm v10.7.0
				> pnpm add -D @babel/core babel-jest @babel/preset-env
				> pnpm install --save-dev jest-environment-jsdom

#### TL;DR

From `/dataflow`:

> cd data_clump_flow_app
> pnpm run test

### Testing | Automa

> See: ../data_clump_flow_app_src/automa/README.md

-----

## Feature Thoughts

@4/22/2025 1:06:44 AM
@4/22/2025 1:10:48 AM
- Skeleton: Dataflow

I'm contemplating whether to take a day or two and build out the 'flow naming'
	controller that will handle creating normalized localStorage keys, which are
	restricted to either snake_case or camelCase, while allowing for custom flow
	names. A downside is you can't go straight to the Application tab and find
	your flow because you would have to check a table in the controller (which
	would be stored in its own localStorage slot). Granted that table is easily
	accessed, but it is still an additional step away from knowing which localStorage you're looking for.
The two cons of allowing for random key names is 1) the character casing restriction on the user,
	and 2) the domain's localStorage listing can get pretty messy.
One halfway solution is to prefix all flow name keys with "df_". But again, is that
	even worth the time for all the ways I have in mind for implementing just a prefix?
I think just being able to rename the storage keys is enough for now, for as the list
	grows, a user can formulate their own naming convention (albeit still restricted to
	those two cases) and rename existing flow names to their heart's content (providing
	there's no drawback to repeatedly creating and deleting storage slots, being that's
	the only way to rename a localStorage key).

-----

## @TODONE:

- Finished delete function.
- Formatted entire layout.
  - Added visual arrows between cells
- Committed to GitHub:
  - Added Readmes
  - Added @TODO:
- Removed `HR` tags (not necessary).
- Tested editing.
  - Disabled `linkTo` and `columnSelect` dropdowns when editing. There is far too much to account for when shifting cells.
- Created a favicon.
- Finished meta tags.
- Added icon/image to website.
- Added link to 'readme' and website (website icon links to readme; readme links to website).
- When editing a cell, highlighted the cell being edited.
- Added 'editingId' to info panel.
- Allow the UI to set the width of the clump cells. | Default: `settings.gridRepeatValue: 2`
- Added ticks to HTML slider.
- Disabled console.logs.
- Added 'empty page' message.
- Fixed ticks repeating.
- Added collapsible toggle to settings panel.
- Added error message for storage name validation.
- Set storage name regex to accept either 'camelCase' or 'snake_case'.
- Added localStorage switcher:
  - Create new storage names
  - Delete storage names
  - Switch to using different storage names
- Extracted JavaScript into classes:
  - I refactored this from a monolithic structure to a mix of Faux OO and Faux Procedural so that at least it's not all in the HTML.
    - If I were to continue this project, I would rethink it more in terms of the parts of the app and how they would function together, as I did my last Flutter app.
  - Created new branch for refactoring: [`refactor-js-to-classes`](https://github.com/KDCinfo/dataflow/tree/refactor-js-to-classes/data_clump_flow_app)
  - Created a temporary `dataflow.js` to hold all JavaScript while it is being refactored.
  - Created placeholder classes:
    - AppSettings (primary controller, orchestrator)
    - AppData
    - AppHelpers
  - Normalized all JS references to point to HTML elements by their IDs.
- Fixed all fallout from refactor, including import.
  - Fixed layering of expanded clumps.
- Now setting focus on Clump Name field on load and edit.
- Added option to pop out Add/Edit Form so code clump can be wider.
- Implemented 'sessionStorage' for 'active storage index' setting.
  - Any open Data Clump Flow apps in other open tabs can't change the currently active storage.
- Added cross-tab add/edit/delete protection when an active storage is deleted in another open tab.

## ### ### ### ##
##
## Version: 2.0.0
##
## ### ### ### ##

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

## ### ### ### ##
##
## Version: 2.1.0
##
## ### ### ### ##

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

## ### ### ### ##
##
## Version: 2.2.0
##
## ### ### ### ##

- [X] Removed one-time alert message suggesting to export all your storage.
  - If anyone is actually using this tool they will have seen this by now.
- [X] Allow for bulk importing.
  - I recently cleared all the cookies for 'kdcinfo.com' for another project I was working on.
      - Fortunately I use the 'Export All' button fairly often (because I know what losing data feels like).
      - Unfortunately I have a dozen flows to import.
- [X] Add 'Activate' button to Flow Manager modal.
- [X] Reminder to export after 'n' updates (where 'n' is saved in settings).

## ### ### ### ##
##
## Version: 2.2.1
##
## ### ### ### ##

- [X] Bug: Fixed restore auto-backup; had the wrong key.
- [X] Change: Added 'df_' prefix to clump lists in localStorage.
- [X] Refactor: Swapped out `localStorage` calls w/ `AppStorage`.

## @BUGS:

### Cannot Recreate

- [ ] Bug | View a clump -> Add a 'New Flow' | The open clump closes, but the space remains
- [ ] Bug | Sometimes 'Import Data' will fail silently*.
  - *An error is shown in the dev tools console.
  - Workaround: Try it again. Subequent attempts usually work.
  - Unsure if this still exists after refactor to classes.

## @TODO:

### Light/moderate changes:

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

### Potentially slightly bigger changes:

- [ ] Add grouping for project-level flows.
- [ ] Add a 'Flow Naming' controller: custom flow names + consistent localStorage keys (e.g. 'df_1', 'df_2', 'df_3').
  - [ ] Allow storage names to be descriptive; use a 'join table' to track descriptive names with the actual storage key names.
    - All names **in storage** should be preceded with: df_ or data_ | df_docker_flows
  - [ ] Add a property to 'AppSettingInfo' for a 'custom name' Map (a 2-column lookup table) that ties
        a custom name to a specific localStorage name (which this app restricts to either snake_case or camelCase).
  - [ ] Allow for the renaming of both custom names and localStorage names. Having a custom key name should not break the controller (e.g. grandfathered flow names).
- [ ] Implement: Drag-n-drop


_
