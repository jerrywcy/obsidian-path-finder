import { App, Modal, Notice, Setting } from "obsidian";
import { SuggestFile, GenericTextSuggester } from "src/generic_text_suggester";

function getFilesWithAliases(): SuggestFile[] {
	let markdownFiles = app.vault.getMarkdownFiles();
	let markdownFilesWithAlias: SuggestFile[] = [];
	for (let file of markdownFiles) {
		markdownFilesWithAlias.push(
			new SuggestFile(file.basename, file.path, true)
		);
		let aliases = app.metadataCache.getFileCache(file)?.frontmatter?.alias;
		if (aliases !== undefined) {
			try {
				for (let alias of aliases) {
					if (typeof alias === "string")
						markdownFilesWithAlias.push(
							new SuggestFile(alias, file.path, false)
						);
				}
			} catch (error) {
				console.log(
					`Path Finder Plugin: Wrong alias format in file ${file.path}. Please consider change it.`
				);
			}
		}
	}
	return markdownFilesWithAlias;
}

export class PathsModal extends Modal {
	from: string;
	to: string;
	length: number = 10;
	operation: "shortest_path" | "all_paths_as_graph" | "all_paths";
	callback: (from: string, to: string, length?: number) => void;

	constructor(
		app: App,
		callback: (from: string, to: string, length?: number) => void,
		operation: "shortest_path" | "all_paths_as_graph" | "all_paths"
	) {
		super(app);
		this.callback = callback;
		this.operation = operation;
	}

	onOpen() {
		const { contentEl } = this;
		if (this.operation == "all_paths") {
			contentEl.createEl("h1", { text: "Get All Paths As Text" });
		}
		if (this.operation == "shortest_path") {
			contentEl.createEl("h1", { text: "Get Shortest Path As Graph" });
		}
		if (this.operation == "all_paths_as_graph") {
			contentEl.createEl("h1", { text: "Get All Paths As Graph" });
		}
		const markdownFilesWithAlias = getFilesWithAliases();
		new Setting(contentEl)
			.setDesc("The file to start from. Use full path from vault root.")
			.setName("From")
			.addText((textComponent) => {
				new GenericTextSuggester(
					this.app,
					textComponent.inputEl,
					markdownFilesWithAlias
				);
				textComponent.onChange((path) => {
					this.from = path;
				});
			});
		new Setting(contentEl)
			.setDesc("The file to end with. Use full path from vault root.")
			.setName("To")
			.addText((textComponent) => {
				new GenericTextSuggester(
					this.app,
					textComponent.inputEl,
					markdownFilesWithAlias
				);
				textComponent.onChange((path) => {
					this.to = path;
				});
			});
		if (this.operation != "shortest_path") {
			new Setting(contentEl)
				.setName("Length")
				.setDesc(
					"The maximum length of paths. Set 0 to show all paths regardless of length."
				)
				.addText((textComponent) => {
					textComponent.setPlaceholder("10").onChange((length) => {
						this.length = parseInt(length);
					});
				});
		}
		new Setting(contentEl).addButton((button) => {
			button
				.setButtonText("Confirm")
				.setCta()
				.onClick(async () => {
					if (app.vault.getAbstractFileByPath(this.from) === null) {
						new Notice(`${this.from} is not a legal path.`);
						return;
					}
					if (app.vault.getAbstractFileByPath(this.to) === null) {
						new Notice(`${this.to}  is not a legal path.`);
						return;
					}
					if (isNaN(this.length) || this.length < 0) {
						new Notice(`Illegal maximum path length.`);
						return;
					}
					if (this.length == 0) this.length = Infinity;
					if (this.operation == "shortest_path") {
						this.callback(this.from, this.to);
					} else {
						this.callback(this.from, this.to, this.length);
					}
					this.close();
				});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

