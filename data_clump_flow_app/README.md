# Data Mapping Flow Analysis Tool

<img src="./images/icon128.png" align="right" width="128" height="128">

### Other README Files:

- [README_releases_todo_bugs](https://github.com/KDCinfo/dataflow/blob/main/data_clump_flow_app/README_releases_todo_bugs.md)
- [README_testing](https://github.com/KDCinfo/dataflow/blob/main/data_clump_flow_app/README_testing.md)
- [README_hisorical_notes](https://github.com/KDCinfo/dataflow/blob/main/data_clump_flow_app/README_hisorical_notes.md)

-----

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

_
