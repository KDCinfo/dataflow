# Data Mapping Flow Analysis Tool

<img src="./images/icon128.png" align="right" width="128" height="128">

The "Data Mapping Flow Analysis Tool" was conceptualized when analyzing a variety of `Jenkinsfile`s from multiple sources, and the environments, stages, and flows within each.

> Live Demo: [kdcinfo.com/app/dataflow/](https://kdcinfo.com/app/dataflow/)

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

## @TODO:

- Add localStorage switcher
  - Switching will need to reload page; will be akin to a project switcher.
- Add ability to delete any unlinked cell.
- Add ability to delete any linked cell.
- Add ability to change links.
- Add ability to unlink.
- Add ability to add cells under any bottommost group in a column.
  - It currently adds cells to the last cell for the selected column, even if a previously added cell was linked/placed above existing sequenced cells.
- Add ability to move cells, perhaps make it a drag-and-drop feature.

## @TODONE:

- Finished delete function
- Formatted entire layout
  - Added visual arrows between cells
- Committed to GitHub
  - Added Readmes
  - Added @TODO:
- Removed `HR` tags (not necessary)
- Tested editing
  - Disabled `linkTo` and `columnSelect` dropdowns when editing. There is far too much to account for when shifting cells.
- Created a favicon
- Finished meta tags
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

_
