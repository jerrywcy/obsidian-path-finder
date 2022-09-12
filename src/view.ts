import { ItemView, Notice, setIcon, TFile, WorkspaceLeaf } from "obsidian";

import { ExtendedGraph } from "src/algorithms/graph/types";
import { getNextPath } from "./algorithms/graph/GetNextPath";
import {
	d3ForceGraphLink,
	d3ForceGraphNode,
	ForceGraphWithLabels,
} from "./ui/d3ForceGraphWithLabels";

export const VIEW_TYPE_PATHGRAPHVIEW = "path-graph-view";
export const VIEW_TYPE_PATHVIEW = "path-view";

export class PathGraphView extends ItemView {
	source: number;
	target: number;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_PATHGRAPHVIEW;
	}

	getDisplayText() {
		return "Path Graph View";
	}

	onResize(): void {
		const { contentEl } = this;
		const svg = contentEl.getElementsByClassName(
			"path-finder path-graph"
		)[0];
		let width = contentEl.clientWidth,
			height = contentEl.clientHeight;
		svg.setAttribute(
			"viewBox",
			`${-height / 2},${-width / 2},${height},${width}`
		);
		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
	}

	/**
	 * Get all nodes in a given graph.
	 * @param graph The graph.
	 * @returns An array of objects, each representing one node. {id: any, group: "source" | "target" | "node"}
	 */
	getNodes(graph: ExtendedGraph): d3ForceGraphNode[] {
		let ret: d3ForceGraphNode[] = [];
		for (let i = 1; i <= graph.getN(); i++) {
			ret.push({
				id: graph.getName(i),
				group:
					i === this.source
						? "source"
						: i === this.target
						? "target"
						: "node",
			});
		}
		return ret;
	}

	/**
	 * Get all links in a given graph.
	 * @param graph The graph.
	 * @returns An array of objects, each representing one link.
	 */
	getLinks(graph: ExtendedGraph): d3ForceGraphLink[] {
		let ret: d3ForceGraphLink[] = [];
		for (let i = 1; i <= graph.getM(); i++) {
			let fromFilePath = graph.getName(graph.edges[i].u),
				toFilePath = graph.getName(graph.edges[i].v);
			if (!fromFilePath || !toFilePath) continue;
			let resolvedLinks = app.metadataCache.resolvedLinks;
			if (resolvedLinks[fromFilePath][toFilePath]) {
				let tmp = {
					source: fromFilePath,
					target: toFilePath,
					type: resolvedLinks[toFilePath][fromFilePath]
						? "bidirectional"
						: "monodirectional",
				};
				ret.push(tmp);
			}
		}
		return ret;
	}

	/**
	 * Set data for the view.
	 * @param from The file to start from.
	 * @param to The file to end with.
	 * @param length The maximum length of all paths shown.
	 * @param graph The graph.
	 */
	setData(from: any, to: any, length: number, graph: ExtendedGraph) {
		const contentEl = this.contentEl;
		contentEl.empty();

		let newGraph = new ExtendedGraph();
		newGraph.addVertice(from);
		newGraph.addVertice(to);
		let source = newGraph.getID(from);
		let target = newGraph.getID(to);
		this.source = source;
		this.target = target;
		ForceGraphWithLabels(
			this,
			contentEl,
			getNextPath(graph.getID(from), graph.getID(to), length, graph),
			{
				graph: newGraph,
				getNodes: this.getNodes.bind(this),
				getLinks: this.getLinks,
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
						if (file.extension == "md") return file.basename;
						else {
							return file.name;
						}
					} else {
						return file.name;
					}
				},
			}
		);
	}

	nextPath() {}

	prevPath() {}

	openPanel() {}

	closePanel() {}

	async onOpen() {
		const contentEl = this.contentEl;
		contentEl.empty();
	}

	async onClose() {}
}

export class PathView extends ItemView {
	source: number;
	target: number;
	nextPath: AsyncGenerator<any[] | undefined>;
	paths: any[][];
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

	/**
	 * Set data for current View.
	 * @param source The source node.
	 * @param target The target node.
	 * @param length The maximum length of all paths shown.
	 * @param graph The graph.
	 * @returns
	 */
	async setData(
		source: number,
		target: number,
		length: number,
		graph: ExtendedGraph
	) {
		this.source = source;
		this.target = target;
		this.nextPath = getNextPath(source, target, length, graph);
		this.currentPage = 0;
		let x = await this.nextPath.next();
		if (!x.value) {
			console.log("Path Finder: Error: No return from getNext!");
			return;
		}
		this.paths = [x.value];
		this.refresh();
	}

	/**
	 * Used to update content when {this.paths} or {this.currentPage} has changed.
	 * @param pathTitleContainer the container containing title
	 * @param pathContentContainer the container containing content
	 * @returns
	 */
	update(
		pathTitleContainer: HTMLDivElement,
		pathContentContainer: HTMLDivElement
	) {
		pathTitleContainer.empty();
		pathContentContainer.empty();
		pathTitleContainer.createEl("h1", {
			text: `${this.currentPage + 1}/${this.paths.length}`,
		});
		if (this.currentPage >= this.paths.length) return;
		for (let x of this.paths[this.currentPage]) {
			let file = app.vault.getAbstractFileByPath(x);
			if (file === null) continue;
			let pathItemContainer = pathContentContainer.createDiv({
				cls: ["path-finder", "panel-display", "path-item"],
			});
			pathItemContainer.createEl("h3", {
				text: file instanceof TFile ? file.basename : file.name,
			});
			pathItemContainer.createEl("p", { text: file.path });
		}
	}

	/**
	 * The function used to construct basic elements for the view.
	 */
	refresh() {
		this.currentPage = 0;
		const container = this.containerEl.children[1];
		container.empty();
		container.setAttribute("style", "padding: 0px");

		const leftButtonContainer = container.createDiv({
			cls: ["path-finder", "left-button-container"],
		});
		const pathContainer = container.createDiv({
			cls: ["path-finder", "path-container"],
		});
		const pathTitleContainer = pathContainer.createDiv({
			cls: ["path-finder", "path-container", "title-container"],
		});
		const pathContentContainer = pathContainer.createDiv({
			cls: ["path-finder", "path-container", "content-container"],
		});
		const rightButtonContainer = container.createDiv({
			cls: ["path-finder", "right-button-container"],
		});

		this.update(pathTitleContainer, pathContentContainer);

		const leftButton = leftButtonContainer.createEl("button", {
			cls: ["path-finder", "left-button-container", "left-button"],
		});
		setIcon(leftButton, "left-arrow");
		leftButton.onClickEvent((evt) => {
			if (this.currentPage > 0) {
				this.currentPage--;
			}
			this.update(pathTitleContainer, pathContentContainer);
		});

		const rightButton = rightButtonContainer.createEl("button", {
			cls: ["path-finder", "right-button-container", "right-button"],
		});
		setIcon(rightButton, "right-arrow");
		rightButton.onClickEvent(async (evt) => {
			if (this.currentPage < this.paths.length - 1) {
				this.currentPage++;
			} else {
				let res = await this.nextPath.next();
				if (res.value) {
					this.paths.push(res.value);
					this.currentPage++;
				} else {
					new Notice("No more Paths!");
				}
			}
			this.update(pathTitleContainer, pathContentContainer);
		});
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
	}

	async onClose() {}
}
