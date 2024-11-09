This was a quick and simple test to see how far ChatGPT could go with this.

I didn't take it further than the initial ask which produced the code in the enclosed files:

# Posted to ChatGPT: App Builder

- @3/26/2024 1:09:34 PM

Would you be able to get me started on a web app that will have, and record, growable rows of fields with a handful of features? I have a web hosting account and can run PHP and JavaScript.

Here's the initial outline:

Draft Thoughts:

* The fields will be HTML elements, and (for now) would be: 
  - Breadcrumb (text), 
  - Method name (text), 
  - Code block (textarea), 
  - The ability to add method names (from within the code block) to be followed, with each method name being depicted whether it's a GOSUB, or a (part of the main) Flow, and,
  - A list of variables or class properties to be watched (one-word strings).
* When a row is entered and saved, a new row can be created.
* When all rows have been entered, a 'process' button will format each row into a format that can be pasted into the PlantUML GPT so it can create a PlantUML scheme, or, format all the rows directly into a PlantUML scheme directly (maybe phase II: will take more time).
* The form should be able to be saved in the browser's storage, and exported in a manner that can later be imported.
* Being able to save each 'project' will mean there will need to be a table of contents page showing any saved projects.


_
