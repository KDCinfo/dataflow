# Historical Entries

## Original ChatGPT with Claude 3.5 Sonnet

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

-----

## Feature Thoughts

@4/22/2025 1:06:44 AM
@4/22/2025 1:10:48 AM
- Skeleton: Dataflow

> Flow Naming Manager

I'm contemplating whether to take a day or two and build out the 'flow naming'
	controller that will handle creating normalized localStorage keys, which are
	restricted to either snake_case or camelCase, while allowing for custom flow
	names. A downside is you can't go straight to the Application tab and find
	your flow because you would have to check a table in the controller (which
	would be stored in its own localStorage slot). Granted that table is easily
	accessed, but it is still an additional step away from knowing which localStorage you're looking for.
The two cons of allowing for random key names is 1) the character casing restriction on the user,
	and 2) the domain's localStorage listing can get pretty messy.

> Option #2 --- @TODONE:

One halfway solution is to prefix all flow name keys with "df_". But again, is that
	even worth the time for all the ways I have in mind for implementing just a prefix?
I think just being able to rename the storage keys is enough for now, for as the list
	grows, a user can formulate their own naming convention (albeit still restricted to
	those two cases) and rename existing flow names to their heart's content (providing
	there's no drawback to repeatedly creating and deleting storage slots, being that's
	the only way to rename a localStorage key).

_
