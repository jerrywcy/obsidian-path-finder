import { App, Modal, Notice, Setting } from "obsidian";
import { GenericTextSuggester } from "./genericTextSuggester";

async function legal(path: string) {
    if (!path) return false;
    return await app.vault.adapter.exists(path);
}

export class ShortestPathModal extends Modal {
    from: string;
    to: string;
    callback: (from: string, to: string) => void;

    constructor(app: App, callback: (from: string, to: string) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: "Get Shortest Path" });
        let markdownFiles = app.vault.getMarkdownFiles();
        new Setting(contentEl)
            .setName("From")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.from = path;
                    })
            })
        new Setting(contentEl)
            .setName("To")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            })
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Close")
                    .setCta()
                    .onClick(async (evt) => {
                        if (!(await legal(this.from))) {
                            new Notice(`${this.from} is not a legal path.`);
                            return;
                        }
                        if (!(await legal(this.to))) {
                            new Notice(`${this.to}  is not a legal path.`);
                            return;
                        }
                        this.callback(this.from, this.to);
                        this.close();
                    })
            })
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class AllPathsAsGraphModal extends Modal {
    from: string;
    to: string;
    length: number = 10;
    callback: (from: string, to: string, length: number) => void;

    constructor(app: App, callback: (from: string, to: string, length: number) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        const markdownFiles = app.vault.getMarkdownFiles();
        contentEl.createEl("h1", { text: "Get All Paths As Graph" });
        new Setting(contentEl)
            .setName("From")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.from = path;
                    })
            });
        new Setting(contentEl)
            .setName("To")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            });
        new Setting(contentEl)
            .setName("Length")
            .addText(textComponent => {
                textComponent
                    .setPlaceholder("10")
                    .onChange((length) => {
                        this.length = parseInt(length);
                    })
            });
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Close")
                    .setCta()
                    .onClick(async (evt) => {
                        if (!(await legal(this.from))) {
                            new Notice(`${this.from} is not a legal path.`);
                            return;
                        }
                        if (!(await legal(this.to))) {
                            new Notice(`${this.to}  is not a legal path.`);
                            return;
                        }
                        if (isNaN(this.length) || this.length < 0) {
                            new Notice(`Illegal maximum path length.`);
                            return;
                        }
                        if (this.length == 0) this.length = Infinity;
                        this.callback(this.from, this.to, this.length);
                        this.close();
                    })
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class AllPathsModal extends Modal {
    from: string;
    to: string;
    length: number = 10;
    callback: (from: string, to: string, length: number) => void;

    constructor(app: App, callback: (from: string, to: string, length: number) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        const markdownFiles = app.vault.getMarkdownFiles();
        contentEl.createEl("h1", { text: "Get All Paths As Text" });
        new Setting(contentEl)
            .setName("From")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.from = path;
                    })
            });
        new Setting(contentEl)
            .setName("To")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.path));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            });
        new Setting(contentEl)
            .setName("Length")
            .addText(textComponent => {
                textComponent
                    .setPlaceholder("10")
                    .onChange((length) => {
                        this.length = parseInt(length);
                    })
            });
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Close")
                    .setCta()
                    .onClick(async (evt) => {
                        if (!(await legal(this.from))) {
                            new Notice(`${this.from} is not a legal path.`);
                            return;
                        }
                        if (!(await legal(this.to))) {
                            new Notice(`${this.to}  is not a legal path.`);
                            return;
                        }
                        if (isNaN(this.length)) {
                            new Notice(`Illegal maximum path length.`);
                            return;
                        }
                        if (this.length === 0) this.length = Infinity;
                        this.callback(this.from, this.to, this.length);
                        this.close();
                    })
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}