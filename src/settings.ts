import {
	App,
	ButtonComponent,
	Hotkey,
	Platform,
	PluginSettingTab,
	Setting,
} from "obsidian";
import PathFinderPlugin from "./main";

export interface PathFinderPluginSettings {
	nextPathHotkey?: Hotkey;
	prevPathHotkey?: Hotkey;
	openPanelHotkey?: Hotkey;
	closePanelHotkey?: Hotkey;
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
};

export class PathFinderPluginSettingTab extends PluginSettingTab {
	plugin: PathFinderPlugin;

	constructor(app: App, plugin: PathFinderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getName(hotkey: Hotkey): string {
		let ret = "";
		if (!hotkey) return "Blank";
		if ((!hotkey.modifiers || hotkey.modifiers.length == 0) && !hotkey.key)
			return "Blank";
		hotkey.modifiers.sort();
		for (let i = 0; i < hotkey.modifiers.length; i++) {
			if (i != 0) ret += " + ";
			ret += hotkey.modifiers[i];
		}
		if (hotkey.key) {
			if (ret != "") {
				ret += " + ";
			}
			if (hotkey.key.length == 1) ret += hotkey.key.toUpperCase();
			else ret += hotkey.key;
		}
		ret = ret.replaceAll("ArrowLeft", "←");
		ret = ret.replaceAll("ArrowRight", "→");
		ret = ret.replaceAll("ArrowUp", "↑");
		ret = ret.replaceAll("ArrowDown", "↓");
		if (Platform.isMacOS) {
			ret = ret.replaceAll("Meta", "⌘Command");
			ret = ret.replaceAll("Alt", "⌥Option");
		} else {
			ret = ret.replaceAll("Meta", "⊞Windows");
		}
		// console.log(ret);
		return ret;
	}

	addHotkeySetting(title: string, target: Hotkey, defaultHotkey?: Hotkey) {
		let { containerEl } = this;
		let hotkeyButton: ButtonComponent, resetButton: ButtonComponent;
		new Setting(containerEl)
			.setName(title)
			.addButton((button) => {
				hotkeyButton = button;
				button
					.setButtonText(this.getName(target))
					.setTooltip("Customize hotkey")
					.onClick(async (evt) => {
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
								let { modifiers, key } = hotkey;
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
								button.setButtonText(this.getName(hotkey));
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
				resetButton = button;
				button
					.setIcon("reset")
					.setTooltip("Restore default")
					.onClick(async (evt) => {
						if (defaultHotkey) Object.assign(target, defaultHotkey);
						else Object.assign(target, { modifiers: [], key: "" });
						hotkeyButton.setButtonText(this.getName(target));
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
	}
}
