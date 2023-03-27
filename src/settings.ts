import {
	App,
	ButtonComponent,
	Hotkey,
	Platform,
	PluginSettingTab,
	Setting,
	sanitizeHTMLToDom,
} from "obsidian";
import PathFinderPlugin from "./main";

export type GraphFilterMode = "Include" | "Exclude";

export interface GraphFilter {
	regexp: string;
	mode: GraphFilterMode;
}

export function isFiltered(filter: GraphFilter, x: string): boolean {
	if (filter.regexp == "") return false;
	return (
		(filter.mode == "Exclude" && RegExp(filter.regexp).test(x)) ||
		(filter.mode == "Include" && !RegExp(filter.regexp).test(x))
	);
}

export interface PathFinderPluginSettings {
	nextPathHotkey?: Hotkey;
	prevPathHotkey?: Hotkey;
	openPanelHotkey?: Hotkey;
	closePanelHotkey?: Hotkey;
	filter: GraphFilter;
}

function formatHotkey(hotkey: Hotkey) {
	if (isBlank(hotkey)) {
		return "Blank";
	}
	function isBlank(hotkey: Hotkey): boolean {
		return (
			!hotkey ||
			((!hotkey.modifiers || hotkey.modifiers.length == 0) && !hotkey.key)
		);
	}
	return formatHotkey(hotkey);
	function formatHotkey(hotkey: Hotkey): string {
		hotkey.modifiers.sort();
		let result = hotkey.modifiers.join(" + ");
		if (hotkey.key) {
			if (result != "") {
				result += " + ";
			}
			if (hotkey.key.length == 1) result += hotkey.key.toUpperCase();
			else result += hotkey.key;
		}
		result = replaceArrow(result);
		result = replaceModifiers(result);

		return result;
		function replaceArrow(result: string): string {
			return result
				.replaceAll("ArrowLeft", "←")
				.replaceAll("ArrowRight", "→")
				.replaceAll("ArrowUp", "↑")
				.replaceAll("ArrowDown", "↓");
		}
		function replaceModifiers(result: string): string {
			if (Platform.isMacOS) {
				return result
					.replaceAll("Meta", "⌘Command")
					.replaceAll("Alt", "⌥Option");
			} else {
				return result.replaceAll("Meta", "⊞Windows");
			}
		}
	}
}

export const DEFAULT_SETTINGS: PathFinderPluginSettings = {
	nextPathHotkey: {
		modifiers: [],
		key: "ArrowRight",
	},
	prevPathHotkey: {
		modifiers: [],
		key: "ArrowLeft",
	},
	openPanelHotkey: {
		modifiers: [],
		key: "o",
	},
	closePanelHotkey: {
		modifiers: [],
		key: "w",
	},

	filter: {
		regexp: "",
		mode: "Exclude",
	},
};

export class PathFinderPluginSettingTab extends PluginSettingTab {
	plugin: PathFinderPlugin;

	constructor(app: App, plugin: PathFinderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	addHotkeySetting(title: string, target: Hotkey, defaultHotkey?: Hotkey) {
		let { containerEl } = this;
		let hotkeyButton: ButtonComponent;
		new Setting(containerEl)
			.setName(title)
			.addButton((button) => {
				hotkeyButton = button;
				button
					.setButtonText(formatHotkey(target))
					.setTooltip("Customize hotkey")
					.onClick(async () => {
						let controller = new AbortController();
						button.setCta();
						let blankHotkey: Hotkey = {
							modifiers: [],
							key: "",
						};
						let hotkey: Hotkey = {
							modifiers: [],
							key: "",
						};
						global.addEventListener(
							"keydown",
							async (evt: KeyboardEvent) => {
								// console.log("Hotkey Setting", evt);
								let { modifiers } = hotkey;
								if (evt.key == "Escape") {
									button.setButtonText("Blank");
									Object.assign(target, blankHotkey);
									await this.plugin.saveSettings();
									// console.log("This is an Escape!");
									button.removeCta();
									controller.abort();
									// console.log(target);
									evt.stopImmediatePropagation();
									return;
								}
								if (evt.ctrlKey) {
									if (evt.key == "Control") {
										Object.assign(hotkey, blankHotkey);
										return;
									}
									// console.log("This is a Control!");
									if (!modifiers.includes("Ctrl"))
										modifiers.push("Ctrl");
								}
								if (evt.shiftKey) {
									if (evt.key == "Shift") {
										Object.assign(hotkey, blankHotkey);
										return;
									}
									// console.log("This is a Shift!");
									if (!modifiers.includes("Shift"))
										modifiers.push("Shift");
								}
								if (evt.altKey) {
									if (evt.key == "Alt") {
										Object.assign(hotkey, blankHotkey);
										return;
									}
									// console.log("This is an Alt!");
									if (!modifiers.includes("Alt"))
										modifiers.push("Alt");
								}
								if (evt.metaKey) {
									if (evt.key == "Meta") {
										Object.assign(hotkey, blankHotkey);
										return;
									}
									// console.log("This is a Meta!");
									if (!modifiers.includes("Meta"))
										modifiers.push("Meta");
								}
								// console.log("This is a " + evt.key);
								hotkey.key = evt.key;
								button.setButtonText(formatHotkey(hotkey));
								Object.assign(target, hotkey);
								await this.plugin.saveSettings();
								button.removeCta();
								controller.abort();
							},
							{
								capture: true,
								signal: controller.signal,
							}
						);
					});
			})
			.addButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Restore default")
					.onClick(async () => {
						if (defaultHotkey) Object.assign(target, defaultHotkey);
						else Object.assign(target, { modifiers: [], key: "" });
						hotkeyButton.setButtonText(formatHotkey(target));
						await this.plugin.saveSettings();
					});
			});
	}

	display(): void {
		let { containerEl } = this;
		let { settings } = this.plugin;

		containerEl.empty();
		containerEl.createEl("h1", { text: "Hotkey Settings" });
		// console.log(settings);

		this.addHotkeySetting(
			"Previous Path",
			settings.prevPathHotkey,
			DEFAULT_SETTINGS.prevPathHotkey
		);
		this.addHotkeySetting(
			"Next Path",
			settings.nextPathHotkey,
			DEFAULT_SETTINGS.nextPathHotkey
		);
		this.addHotkeySetting(
			"Open Panel",
			settings.openPanelHotkey,
			DEFAULT_SETTINGS.openPanelHotkey
		);
		this.addHotkeySetting(
			"Close Panel",
			settings.closePanelHotkey,
			DEFAULT_SETTINGS.closePanelHotkey
		);
		new Setting(containerEl)
			.setName("Filter")
			.setDesc(
				sanitizeHTMLToDom(
					`Write plain text or regex.<br>
The filter string will be matched everywhere in the file path(from vault root to file).<br>
<a href="https://javascript.info/regular-expressions">Regex Tutorial</a>`
				)
			)
			.addText((text) => {
				text.setValue(settings.filter.regexp).onChange((regexp) => {
					settings.filter.regexp = regexp;
				});
			});

		new Setting(containerEl)
			.setName("Filter Mode")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("Include", "Include")
					.addOption("Exclude", "Exclude")
					.setValue(settings.filter.mode)
					.onChange((mode: GraphFilterMode) => {
						settings.filter.mode = mode;
					});
			});
	}
}
