import { Hotkey, normalizePath, Notice, Plugin } from "obsidian";

import { WeightedGraphWithNodeID } from "src/algorithms/graph/weighted_graph_with_node_id";
import { PathsModal } from "./modals";
import {
	PathGraphView,
	PathView,
	VIEW_TYPE_PATHGRAPHVIEW,
	VIEW_TYPE_PATHVIEW,
} from "./view";
import { dijkstra } from "./algorithms/graph/dijkstra";
import {
	DEFAULT_SETTINGS,
	GraphFilter,
	isFiltered,
	PathFinderPluginSettings,
	PathFinderPluginSettingTab,
} from "./settings";

import { basename, extname } from "path/posix";

export default class PathFinderPlugin extends Plugin {
	settings: PathFinderPluginSettings;

	async onload() {
		console.log("Loading Path Finder plugin");

		await this.loadSettings();
		this.addSettingTab(new PathFinderPluginSettingTab(this.app, this));

		this.addCommand({
			id: "find-shortest-path",
			name: "Find Shortest Path",
			callback: () => {
				new PathsModal(
					this.app,
					this.findPaths.bind(this, "shortest_path"),
					Object.assign({}, this.settings.filter),
					"shortest_path"
				).open();
			},
		});

		this.addCommand({
			id: "find-all-paths-as-graph",
			name: "Find All Path As Graph",
			callback: () => {
				new PathsModal(
					this.app,
					this.findPaths.bind(this, "all_paths_as_graph"),
					Object.assign({}, this.settings.filter),
					"all_paths_as_graph"
				).open();
			},
		});

		this.addCommand({
			id: "find-all-paths",
			name: "Find All Path",
			callback: () => {
				new PathsModal(
					this.app,
					this.findPaths.bind(this, "all_paths"),
					Object.assign({}, this.settings.filter),
					"all_paths"
				).open();
			},
		});

		this.registerView(
			VIEW_TYPE_PATHGRAPHVIEW,
			(leaf) => new PathGraphView(leaf)
		);

		this.registerView(VIEW_TYPE_PATHVIEW, (leaf) => new PathView(leaf));
		this.registerDomEvent(document, "keydown", (evt) => {
			let activeView = app.workspace.getActiveViewOfType(PathGraphView);
			if (!activeView) return;
			// console.log(evt);
			const { settings } = this;
			if (this.isKey(evt, settings.prevPathHotkey)) activeView.prevPath();
			if (this.isKey(evt, settings.nextPathHotkey)) activeView.nextPath();
			if (this.isKey(evt, settings.openPanelHotkey))
				activeView.openPanel();
			if (this.isKey(evt, settings.closePanelHotkey))
				activeView.closePanel();
		});
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);
		await this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	isKey(evt: KeyboardEvent, hotkey: Hotkey): boolean {
		if (evt.ctrlKey != hotkey.modifiers.includes("Ctrl")) return false;
		if (evt.shiftKey != hotkey.modifiers.includes("Shift")) return false;
		if (evt.altKey != hotkey.modifiers.includes("Alt")) return false;
		if (evt.metaKey != hotkey.modifiers.includes("Meta")) return false;
		if (evt.key != hotkey.key) return false;
		return true;
	}

	/**
	 * Find paths and show them in new view according to `operation`.
	 * @param operation Pass "shortest_path" to find the shortest paths between `from` and `to` and show them as graph.
	 *
	 * Pass "all_paths_as_graph" to find all paths between `from` and `to` and show them as graph.
	 *
	 * Pass "all_paths" to find all paths between `from` and `to` and show them as text.
	 * @param from The file to start from.
	 * @param to The file to end with.
	 * @param length The maximum length of all paths shown. Useless if `operation`==="shortest_path".
	 */
	findPaths(
		operation: "shortest_path" | "all_paths_as_graph" | "all_paths",
		filter: GraphFilter,
		from: string,
		to: string,
		length?: number
	) {
		from = normalizePath(from);
		to = normalizePath(to);
		let { vault } = app;

		if (vault.getAbstractFileByPath(from) === null) {
			new Notice(`${from} does not exist.`);
			return;
		}
		if (vault.getAbstractFileByPath(to) === null) {
			new Notice(`${to} does not exist.`);
			return;
		}

		let graph = this.buildGraphFromLinks(filter);

		let source = graph.getID(from);
		let target = graph.getID(to);
		if (source === undefined) {
			new Notice(`${from} does not exist!`);
			return;
		}
		if (target === undefined) {
			new Notice(`${to} does not exist!`);
			return;
		}
		let { dis } = dijkstra(source, graph);
		if (from === to) {
			new Notice(`${from} and ${to} are the same file!`);
			return;
		}
		if (dis[target] === Infinity) {
			new Notice(`${from} has no path that lead to ${to}.`);
			return;
		}
		if (operation == "shortest_path") {
			this.openPathGraphView(from, to, dis[target], graph);
		} else if (operation == "all_paths_as_graph") {
			this.openPathGraphView(from, to, length, graph);
		} else if (operation == "all_paths") {
			this.openPathView(from, to, length, graph);
		}
	}

	/**
	 * Get the graph formed by all notes in the vault.
	 * @returns The graph formed by all notes in the vault.
	 */
	buildGraphFromLinks(filter: GraphFilter): WeightedGraphWithNodeID {
		let graph = new WeightedGraphWithNodeID();
		let { resolvedLinks } = app.metadataCache;
		for (let fromFilePath in resolvedLinks) {
			if (isFiltered(filter, fromFilePath)) continue;
			for (let toFilePath in resolvedLinks[fromFilePath]) {
				if (isFiltered(filter, toFilePath)) continue;
				graph.addEdgeExtended(fromFilePath, toFilePath, 1);
				graph.addEdgeExtended(toFilePath, fromFilePath, 1);
			}
		}
		return graph;
	}

	/**
	 * Show all paths no longer than `length` from `source` to `target` in a newly opened view as graph.
	 * @param from The node to start from.
	 * @param to The node to end with.
	 * @param length The maximum length of all paths shown.
	 * @param graph The graph.
	 */
	async openPathGraphView(
		from: any,
		to: any,
		length: number,
		graph: WeightedGraphWithNodeID
	) {
		let { workspace } = app;
		// workspace.detachLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW);

		let pathGraphViewLeaf = workspace.getLeaf(true);
		pathGraphViewLeaf.getDisplayText = function () {
			return `${basename(from, extname(from))}->${basename(
				to,
				extname(to)
			)}${length == Infinity ? "" : ` within ${length} steps`}`;
		};
		await pathGraphViewLeaf.setViewState({
			type: VIEW_TYPE_PATHGRAPHVIEW,
			active: true,
		});

		let pathGraphView = pathGraphViewLeaf.view;
		if (!(pathGraphView instanceof PathGraphView)) {
			new Notice("Failed to open Path View. Please try again.");
			pathGraphViewLeaf.detach();
			return;
		}
		pathGraphView.setData(from, to, length, graph);

		this.app.workspace.revealLeaf(pathGraphViewLeaf);
	}

	/**
	 * Show all paths no longer than `length` from `source` to `target` in a newly opened view as text.
	 * @param from The node to start from.
	 * @param to The node to end with.
	 * @param length The maximum length of all paths shown.
	 * @param graph The graph.
	 */
	async openPathView(
		from: any,
		to: any,
		length: number,
		graph: WeightedGraphWithNodeID
	) {
		let source = graph.getID(from),
			target = graph.getID(to);
		if (source === undefined) {
			new Notice(`${from} does note exist!`);
			return;
		}
		if (target === undefined) {
			new Notice(`${to} does note exist!`);
			return;
		}
		let { workspace } = app;
		// workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);

		let pathViewLeaf = workspace.getLeaf(true);
		pathViewLeaf.getDisplayText = function () {
			return `${basename(from, extname(from))}->${basename(
				to,
				extname(to)
			)}${length == Infinity ? "" : ` within ${length} steps`}`;
		};
		await pathViewLeaf.setViewState({
			type: VIEW_TYPE_PATHVIEW,
			active: true,
		});

		let pathView = pathViewLeaf.view;
		if (!(pathView instanceof PathView)) {
			new Notice("Failed to open Path View. Please try again.");
			pathViewLeaf.detach();
			return;
		}
		pathView.setData(source, target, length, graph);

		this.app.workspace.revealLeaf(pathViewLeaf);
	}
}
