import { normalizePath, Notice, Plugin } from 'obsidian';

import { ExtendedGraph } from "src/algorithms/graph/types"
import { getShortestPath } from './algorithms/graph/getShortestPath';
import { getAllPathsAsGraph } from './algorithms/graph/getAllPathsAsGraph';
import { AllPathsAsGraphModal, AllPathsModal, ShortestPathModal } from './modals';
import { PathGraphView, PathView, VIEW_TYPE_PATHGRAPHVIEW, VIEW_TYPE_PATHVIEW } from './view';

export default class MyPlugin extends Plugin {
	async onload() {
		console.log("Loading Path Finder plugin");

		this.addCommand({
			id: 'find-shortest-path',
			name: 'Find Shortest Path',
			callback: () => {
				new ShortestPathModal(this.app, this.findShortestPath.bind(this)).open();
			}
		});

		this.addCommand({
			id: 'find-all-paths-as-graph',
			name: 'Find All Path As Graph',
			callback: () => {
				new AllPathsAsGraphModal(this.app, this.findAllPathsAsGraph.bind(this)).open();
			}
		});

		this.addCommand({
			id: 'find-all-paths',
			name: 'Find All Path',
			callback: () => {
				new AllPathsModal(this.app, this.findAllPaths.bind(this)).open();
			}
		});

		this.registerView(
			VIEW_TYPE_PATHGRAPHVIEW,
			(leaf) => new PathGraphView(leaf)
		);

		this.registerView(
			VIEW_TYPE_PATHVIEW,
			(leaf) => new PathView(leaf)
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);
	}

	findShortestPath(from: string, to: string): void {
		from = normalizePath(from);
		to = normalizePath(to);
		let { vault } = app;
		let { adapter } = vault;

		if (!adapter.exists(from)) {
			new Notice(`${from} path does not exist.`);
			return;
		}
		if (!adapter.exists(to)) {
			new Notice(`${to} path does not exist.`);
			return;
		}

		let g = this.buildGraphFromLinks();

		let path = getShortestPath(from, to, g);
		if (path === undefined) {
			new Notice("From has no route that lead to To.");
		}
		else {
			this.openPathGraphView(from, to, path);
		}
	}

	findAllPathsAsGraph(from: string, to: string, length: number) {
		from = normalizePath(from);
		to = normalizePath(to);
		let { vault, workspace } = app;
		let { adapter } = vault;

		if (!adapter.exists(from)) {
			new Notice(`${from} path does not exist.`);
			return;
		}
		if (!adapter.exists(to)) {
			new Notice(`${to} path does not exist.`);
			return;
		}

		let g = this.buildGraphFromLinks();

		let paths = getAllPathsAsGraph(from, to, length, g);
		new Notice("Done!");
		if (from === to) {
			new Notice(`${from} and ${to} are the same file!`);
		}
		else if (!paths) {
			new Notice(`${from} has no path that lead to ${to}.`);
		}
		else {
			this.openPathGraphView(from, to, paths);
		}
	}

	findAllPaths(from: string, to: string, length: number, time: number) {
		from = normalizePath(from);
		to = normalizePath(to);
		let { vault, workspace } = app;
		let { adapter } = vault;

		if (!adapter.exists(from)) {
			new Notice(`${from} path does not exist.`);
			return;
		}
		if (!adapter.exists(to)) {
			new Notice(`${to} path does not exist.`);
			return;
		}

		let g = this.buildGraphFromLinks();

		let paths = getAllPathsAsGraph(from, to, length, g);
		new Notice("Done!");
		if (from === to) {
			new Notice(`${from} and ${to} are the same file!`);
		}
		else if (!paths) {
			new Notice(`${from} has no path that lead to ${to}.`);
		}
		else {
			this.openPathView(from, to, paths);
		}
	}

	buildGraphFromLinks(): ExtendedGraph {
		let g = new ExtendedGraph();
		let { resolvedLinks } = app.metadataCache;
		for (let fromFilePath in resolvedLinks) {
			for (let toFilePath in resolvedLinks[fromFilePath]) {
				g.addEdgeExtended(fromFilePath, toFilePath, 1);
				g.addEdgeExtended(toFilePath, fromFilePath, 1);
			}
		}
		return g;
	}

	async openPathGraphView(s: any, t: any, g: ExtendedGraph) {
		let { workspace } = app;
		workspace.detachLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW);

		await workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_PATHGRAPHVIEW,
			active: true,
		});

		let pathGraphViewLeaf = workspace.getLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW)[0];
		let pathGraphView = pathGraphViewLeaf.view;
		if (!(pathGraphView instanceof PathGraphView)) {
			new Notice("Failed to open Path View. Please try again.")
			pathGraphViewLeaf.detach();
			return;
		}
		pathGraphView.setData(s, t, g);

		// this.app.workspace.revealLeaf(
		// 	this.app.workspace.getLeavesOfType(VIEW_TYPE_PATHGRAPHVIEW)[0]
		// );
	}

	async openPathView(from: any, to: any, g: ExtendedGraph) {
		let s = g.getID(from), t = g.getID(to);
		if (s === undefined) {
			new Notice(`${from} does note exist!`);
			return;
		}
		if (t === undefined) {
			new Notice(`${to} does note exist!`);
			return;
		}
		let { workspace } = app;
		workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);

		await workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_PATHVIEW,
			active: true,
		});

		let pathViewLeaf = workspace.getLeavesOfType(VIEW_TYPE_PATHVIEW)[0];
		let pathView = pathViewLeaf.view;
		if (!(pathView instanceof PathView)) {
			new Notice("Failed to open Path View. Please try again.")
			pathViewLeaf.detach();
			return;
		}
		pathView.setData(s, t, g);

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_PATHVIEW)[0]
		);
	}
}