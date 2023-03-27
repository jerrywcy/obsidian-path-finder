// Credits go to phibr0's Obsidian Dictionary Plugin: https://github.com/phibr0/obsidian-dictionary

import { TextInputSuggest } from "./suggest";
import { App } from "obsidian";
import { setIcon } from "obsidian";

export class SuggestFile {
	constructor(name: string, path: string, origin: boolean) {
		this.name = name;
		this.path = path;
		this.origin = origin;
	}
	name: string;
	path: string;
	origin: boolean;
}

export class GenericTextSuggester extends TextInputSuggest<SuggestFile> {
	constructor(
		public app: App,
		public inputEl: HTMLInputElement | HTMLTextAreaElement,
		private items: SuggestFile[]
	) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): SuggestFile[] {
		const inputLowerCase: string = inputStr.toLowerCase();

		const filtered = this.items.filter((item) => {
			if (!item.name.toLowerCase())
				console.log(JSON.parse(JSON.stringify(item)));
			if (item.name?.toLowerCase()?.contains(inputLowerCase)) return item;
			if (
				item.path?.toLowerCase()?.contains(inputLowerCase) &&
				item?.origin
			)
				return item;
		});

		if (!filtered) this.close();
		if (filtered?.length > 0)
			return filtered.sort((a, b) => {
				// if (a.origin && !b.origin) return -1;
				// if (!a.origin && b.origin) return 1;
				const aFileName = a.name.toLowerCase(),
					bFileName = b.name.toLowerCase();
				const aFilePath = a.path.toLowerCase(),
					bFilePath = b.path.toLowerCase();
				const aFileNamePos = aFileName.indexOf(inputLowerCase),
					bFileNamePos = bFileName.indexOf(inputLowerCase);
				if (aFileNamePos !== -1 && bFileNamePos !== -1) {
					if (aFileNamePos !== bFileNamePos)
						return aFileNamePos - bFileNamePos;
					else {
						return aFileName.length - bFileName.length;
					}
				} else if (aFileName.indexOf(inputLowerCase) === -1) {
					return 1;
				} else if (bFileName.indexOf(inputLowerCase) === -1) {
					return -1;
				}
				const aFilePathPos = aFilePath.indexOf(inputLowerCase);
				const bFilePathPos = bFilePath.indexOf(inputLowerCase);
				if (aFilePathPos !== bFilePathPos)
					return aFilePathPos - bFilePathPos;
				else return aFilePath.length - bFilePath.length;
			});
		return [];
	}

	selectSuggestion(item: SuggestFile): void {
		this.inputEl.value = item.path;
		this.inputEl.trigger("input");
		this.close();
	}

	renderSuggestion(value: SuggestFile, el: HTMLElement): void {
		if (value) {
			// el.setText(value);
			let suggestContainer = el.createDiv();
			suggestContainer.addClasses(["path-finder", "suggest-item"]);
			let title = suggestContainer.createDiv({ text: value.name });
			title.addClasses(["path-finder", "suggest-item", "item-name"]);
			let content = suggestContainer.createDiv({ text: value.path });
			content.addClasses(["path-finder", "suggest-item", "item-path"]);
			if (!value.origin) {
				let icon = suggestContainer.createDiv();
				setIcon(icon, "forward-arrow");
				icon.addClasses(["path-finder", "alias-icon"]);
			}
		}
	}
}

