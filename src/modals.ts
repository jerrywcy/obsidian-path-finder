import { App, Modal, Setting } from "obsidian";
import { GenericTextSuggester } from "./genericTextSuggester";

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
        contentEl.setText('Get Route!');
        let markdownFiles = app.vault.getMarkdownFiles();
        new Setting(contentEl)
            .setName("From")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.name));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            })
        new Setting(contentEl)
            .setName("To")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.name));
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
                    .onClick((evt) => {
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

export class AllPathsModal extends Modal {
    from: string = "2.md";
    to: string = "4.md";
    length: number = 10;
    callback: (from: string, to: string, length: number) => void;

    constructor(app: App, callback: (from: string, to: string, length: number) => void) {
        super(app);
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        const markdownFiles = app.vault.getMarkdownFiles();
        new Setting(contentEl)
            .setName("From")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.name));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            });
        new Setting(contentEl)
            .setName("To")
            .addText(textComponent => {
                new GenericTextSuggester(this.app, textComponent.inputEl, markdownFiles.map(f => f.name));
                textComponent
                    .onChange((path) => {
                        this.to = path;
                    })
            });
        new Setting(contentEl)
            .setName("Length")
            .addText(textComponent => {
                textComponent
                    .onChange((length) => {
                        this.length = parseInt(length);
                    })
            });
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText("Close")
                    .setCta()
                    .onClick((evt) => {
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