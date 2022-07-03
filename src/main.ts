import { normalizePath, Notice, Plugin, MarkdownView, TFile } from 'obsidian';

import { Graph } from "src/algorithms/graph/types"
import { getShortestPath } from './algorithms/graph/getShortestPath';
import { getAllPaths } from './algorithms/graph/getAllPaths';
import { AllPathsModal, ShortestPathModal } from './modals';
import { PathView, VIEW_TYPE_PATHVIEW } from './view';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'find-shortest-path',
			name: 'Find Shortest Path',
			callback: () => {
				new ShortestPathModal(this.app, this.findShortestPath.bind(this)).open();
			}
		});

		this.addCommand({
			id: 'find-all-paths',
			name: 'Find All Path',
			callback: () => {
				new AllPathsModal(this.app, this.findAllPaths.bind(this)).open();
			}
		});
		// this.addCommand({
		// 	id: 'open-pathview',
		// 	name: 'Open PathView',
		// 	callback: () => {
		// 		this.activatePathView();
		// 	}
		// });

		// this.registerView(
		// 	VIEW_TYPE_PATHVIEW,
		// 	(leaf) => new PathView(leaf)
		// );
	}

	onunload() {
		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);
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

		let { g, filePathToID, IDToFilePath } = this.buildGraphFromLinks();

		let s = filePathToID.get(from) as number, t = filePathToID.get(to) as number;

		let route = getShortestPath(s, t, g);
		if (route[0] == 0) {
			new Notice("From and To are the same file!");
		}
		else if (route[0] == -1) {
			new Notice("From has no route that lead to To.");
		}
		else {
			let data = `There are ${route[0] + 1} notes in the route.`
			for (let i = 1; i < route.length; i++) {
				data += `\n${IDToFilePath.get(route[i])}`;
				console.log(route[i]);
			}
			new Notice(data);
		}
	}

	findAllPaths(from: string, to: string, length: number) {
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

		let { g, filePathToID, IDToFilePath } = this.buildGraphFromLinks();

		let s = filePathToID.get(from) as number, t = filePathToID.get(to) as number;

		let paths = getAllPaths(s, t, length, g);
		if (s == t) {
			new Notice(`${from} and ${to} are the same file!`);
		}
		else if (paths.length == 0) {
			new Notice(`${from} has no path that lead to ${to}.`);
		}
		else {
			let data = `There are ${paths.length} paths.\n`
			for (let i of paths) {
				data += "\n---\n"
				for (let j of i) {
					data += `${IDToFilePath.get(j)}\n`
				}
			}
			new Notice(data);
			const filePath = "_log.md";
			if (!adapter.exists(filePath)) {
				vault.create(filePath, data);
			}
			else {
				adapter.write(filePath, data);
			}
			let leaf = workspace.getLeaf(true);
			leaf.openFile(vault.getAbstractFileByPath(filePath) as TFile);
		}
	}

	buildGraphFromLinks(): {
		g: Graph;
		filePathToID: Map<string, number>;
		IDToFilePath: Map<number, string>;
	} {
		let g = new Graph();
		let filePathToID = new Map<string, number>();
		let IDToFilePath = new Map<number, string>();
		let n = 0, m = 0;
		let { resolvedLinks } = app.metadataCache;
		console.log(resolvedLinks);
		for (let fromFilePath in resolvedLinks) {
			for (let toFilePath in resolvedLinks[fromFilePath]) {
				let u = filePathToID.get(fromFilePath);
				let v = filePathToID.get(toFilePath);
				if (u === undefined) {
					n++;
					filePathToID.set(fromFilePath, n);
					IDToFilePath.set(n, fromFilePath);
					u = n;
				}
				if (v === undefined) {
					n++;
					filePathToID.set(toFilePath, n);
					IDToFilePath.set(n, toFilePath);
					v = n;
				}
				console.log(u, v);
				g.addEdge(u as number, v as number, 1);
				g.addEdge(v as number, u as number, 1);
			}
		}
		console.log(g);
		return { g, filePathToID, IDToFilePath }
	}

	async activatePathView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PATHVIEW);

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_PATHVIEW,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_PATHVIEW)[0]
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}