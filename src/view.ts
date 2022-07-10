import * as d3 from "d3";
import { ItemView, Notice, TFile, Vault, WorkspaceLeaf } from "obsidian";

import { ExtendedGraph } from 'src/algorithms/graph/types';
import { getNextPath } from "./algorithms/graph/getNextPath.js";
import { ForceGraphWithLabels } from './ui/d3ForceGraphWithLabels';

export const VIEW_TYPE_PATHGRAPHVIEW = "path-graph-view";
export const VIEW_TYPE_PATHVIEW = "path-view"

export class PathGraphView extends ItemView {
    s: number;
    t: number;
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_PATHGRAPHVIEW;
    }

    getDisplayText() {
        return "Path view";
    }

    onResize(): void {
        this.refresh();
    }

    getNodes(g: ExtendedGraph): any[] {
        let ret = [];
        for (let i = 1; i <= g.getN(); i++) {
            ret.push({
                id: g.getName(i),
                group: i === this.s
                    ? "source"
                    : i === this.t
                        ? "target"
                        : "node"
            });
        }
        return ret;
    }

    getLinks(g: ExtendedGraph): any[] {
        let ret = [];
        for (let i = 1; i <= g.getM(); i++) {
            let fromFilePath = g.getName(g.g[i].u), toFilePath = g.getName(g.g[i].v);
            if (!fromFilePath || !toFilePath) continue;
            let resolvedLinks = app.metadataCache.resolvedLinks;
            if (resolvedLinks[fromFilePath][toFilePath]) {
                ;
                let tmp = {
                    source: fromFilePath,
                    target: toFilePath,
                    type:
                        resolvedLinks[toFilePath][fromFilePath]
                            ? "bidirectional"
                            : "monodirectional"
                };
                ret.push(tmp);
            }
        }
        return ret;
    }

    setData(from: any, to: any, length: number, g: ExtendedGraph) {
        const container = this.containerEl.children[1];
        container.empty();
        // container.setAttribute("style", "padding: 0px; overflow: hidden; position: relative;");

        // createPanelContainer(container, getNextPath(s, t, g));
        let newGraph = new ExtendedGraph();
        newGraph.addVertice(from);
        newGraph.addVertice(to);
        let s = newGraph.getID(from);
        let t = newGraph.getID(to);
        this.s = s; this.t = t;
        ForceGraphWithLabels(
            container,
            getNextPath(g.getID(from), g.getID(to), length, g),
            {
                graph: newGraph,
                getNodes: this.getNodes.bind(this),
                getLinks: this.getLinks
            },
            {
                nodeGroup: (x: any) => {
                    return x.group;
                },
                nodeGroups: ["source", "target", "node"],
                colors: ["#227d51", "#cb1b45", "#0b1013"],
                nodeRadius: 10,
                linkGroups: ["monodirectional", "bidirectional"],
                nodeTitle: (x: any) => {
                    let file = app.vault.getAbstractFileByPath(x.id);
                    if (!file) return "undefined";
                    else if (file instanceof TFile) {
                        if (file.extension == "md")
                            return file.basename;
                        else {
                            return file.name;
                        }
                    }
                    else {
                        return file.name;
                    }
                }
            });
        // const graphContainer = container.createDiv();
        // graphContainer.appendChild(graph);
    }

    refresh() {
        const container = this.containerEl.children[1];
        const svg = container.getElementsByClassName("path-finder path-graph")[0];
        svg.setAttribute("height", container.clientHeight.toString());
        svg.setAttribute("width", container.clientWidth.toString());
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
    }

    async onClose() {
        // Nothing to clean up.
    }
}

export class PathView extends ItemView {
    s: number;
    t: number;
    g: AsyncGenerator<Array<any> | undefined>;
    paths: Array<Array<any>>;
    currentPage: number;
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_PATHVIEW;
    }

    getDisplayText() {
        return "Path view";
    }

    async setData(s: number, t: number, length: number, g: ExtendedGraph) {
        this.s = s; this.t = t; this.g = getNextPath(s, t, length, g);
        this.currentPage = 0;
        let x = await this.g.next();
        if (!x.value) {
            new Notice("No return from getNext!");
            return;
        }
        this.paths = [x.value];
        this.refresh();
    }

    update(pathTitleContainer: HTMLDivElement, pathContentContainer: HTMLDivElement) {
        pathTitleContainer.empty();
        pathContentContainer.empty();
        pathTitleContainer.createEl("h1", { text: `${this.currentPage + 1}/${this.paths.length}` });
        if (this.currentPage >= this.paths.length) return;
        for (let x of this.paths[this.currentPage]) {
            let file = app.vault.getAbstractFileByPath(x);
            if (file === undefined) continue;
            let pathItemContainer = pathContentContainer.createDiv();
            pathItemContainer.addClasses(["path-finder", "panel-display", "path-item"]);
            pathItemContainer.createEl("h3", { text: file instanceof TFile ? file.basename : file.name });
            pathItemContainer.createEl("p", { text: file.path });
        }
    }

    refresh() {
        this.currentPage = 0;
        const container = this.containerEl.children[1];
        let c = d3.select(container);
        container.empty();
        container.setAttribute("style", "padding: 0px");

        const leftButtonContainer = container.createDiv();
        leftButtonContainer.addClasses(["path-finder", "left-button-container"]);
        leftButtonContainer.style.setProperty("height", "100%");
        leftButtonContainer.style.setProperty("width", "10%");
        leftButtonContainer.style.setProperty("float", "left");
        leftButtonContainer.style.setProperty("display", "flex");
        leftButtonContainer.style.setProperty("justify-content", "center");
        const pathContainer = container.createDiv();
        pathContainer.addClasses(["path-finder", "path-container"]);
        pathContainer.style.setProperty("height", "100%");
        pathContainer.style.setProperty("width", "80%");
        pathContainer.style.setProperty("float", "left");
        leftButtonContainer.style.setProperty("justify-content", "center");
        const pathTitleContainer = pathContainer.createDiv();
        pathTitleContainer.addClasses(["path-finder", "path-container", "title-container"]);
        pathTitleContainer.style.setProperty("height", "10%");
        pathTitleContainer.style.setProperty("width", "100%");
        pathTitleContainer.style.setProperty("display", "flex");
        pathTitleContainer.style.setProperty("justify-content", "center");
        const pathContentContainer = pathContainer.createDiv();
        pathContentContainer.addClasses(["path-finder", "path-container", "content-container"]);
        pathContentContainer.style.setProperty("height", "90%");
        pathContentContainer.style.setProperty("width", "100%");
        pathContentContainer.style.setProperty("overflow", "scroll");

        const rightButtonContainer = container.createDiv();
        rightButtonContainer.addClasses(["path-finder", "right-button-container"])
        rightButtonContainer.style.setProperty("height", "100%");
        rightButtonContainer.style.setProperty("width", "10%");
        rightButtonContainer.style.setProperty("float", "left");
        rightButtonContainer.style.setProperty("display", "flex");
        rightButtonContainer.style.setProperty("justify-content", "center");
        this.update(pathTitleContainer, pathContentContainer);

        const leftButton = leftButtonContainer.createEl("button");
        leftButton.style.setProperty("text-align", "center");
        leftButton.style.setProperty("vertical-align", "middle");
        leftButton.style.setProperty("width", "100%");
        leftButton.setText("Left");
        leftButton.onClickEvent((evt) => {
            if (this.currentPage > 0) {
                this.currentPage--;
            }
            this.update(pathTitleContainer, pathContentContainer);
        })

        const rightButton = rightButtonContainer.createEl("button");
        rightButton.style.setProperty("text-align", "center");
        rightButton.style.setProperty("vertical-align", "middle");
        rightButton.style.setProperty("width", "100%");
        rightButton.setText("Right");
        rightButton.onClickEvent(async (evt) => {
            if (this.currentPage < this.paths.length - 1) {
                this.currentPage++;
            }
            else {
                let res = await this.g.next();
                if (res.value) {
                    this.paths.push(res.value);
                    this.currentPage++;
                }
                else {
                    new Notice("No more Paths!");
                }
            }
            this.update(pathTitleContainer, pathContentContainer);
        })
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        // this.refresh();
    }

    async onClose() {
        // Nothing to clean up.
    }
}