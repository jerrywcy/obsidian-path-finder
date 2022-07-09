# Obsidian Path Finder Plugin

## Install

### BRAT

1. Install [Obsidian42-BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Click `Add new beta plugin` and fill in `jerrywcy/obsidian-path-finder`.
3. Activate plugin.

### Manually

1. Download `obsidian-path-finder.zip` from [Releases](https://github.com/jerrywcy/obsidian-path-finder/releases).
2. Decompress the `.zip` file and put the folder `obsidian-path-finder` under `path-to-your-vault/.obsidian/plugins/`.
3. Activate plugin(Maybe require refreshing).

## Feature

### Find shortest path between two files

![Find Shortest Path](assets/find-shortest-path.gif)

**From:** The file to start from.

**To:** The file to end with.
### Find all paths between files as graph

![Find All Paths As Graph](assets/find-all-paths-as-graph.gif)

**From:** The file to start from.

**To:** The file to end with.

**Length:** The maximum length of all paths. Set 0 to show all paths regardless of length. **Setting length to 0 may lead to Obsidian crushing due to mass amount of nodes rendering if your vault is too big, so use it WITH CARE.**

Paths shown in the floating panel will be sorted from the shortest to the longest. Each path will be calculated on button clicked, so no need to worry about crushing.

### Find all paths

![Find All Paths](assets/find-all-paths.gif)

**From:** The file to start from.

**To:** The file to end with.

**Length:** The maximum length of all paths. Set 0 to show all paths regardless of length.

Paths will be sorted from the shortest to the longest. Each path will be calculated on button clicked, so no need to worry about crushing.

## Attribution

- `genericTextSuggester.ts` and `suggest.ts` are taken from [phibr0/obsidian-dictionary](https://github.com/phibr0/obsidian-dictionary).
- `d3ForceGraphWithLabels.js` and `d3ForceGraph.js` are taken and adapted from examples in d3Gallery with their links below:
    - https://observablehq.com/@d3/force-directed-graph
    - https://observablehq.com/@d3/force-directed-graph-canvas
    - https://observablehq.com/@d3/mobile-patent-suits
    - https://observablehq.com/@d3/sticky-force-layout
    - https://observablehq.com/@d3/zoom
    - These follows ISC License with the copyright message below: (adapted from https://observablehq.com/@d3/force-directed-graph and because the rest does not contain a copyright message, I assumed that they are under the same license)
        - Copyright 2021 Observable, Inc.
        - Released under the ISC license.