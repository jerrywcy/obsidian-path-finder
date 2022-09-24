import * as d3 from "d3";
import { debounce, setIcon, Setting } from "obsidian";

const transition = "all 100ms cubic-bezier(0.02,0.01,0.47,1)";

export class GraphControlCategory {
	graphControls: GraphControl;
	settingsContainer: d3.Selection<HTMLDivElement, undefined, null, undefined>;
	settings: Setting[];
	section: d3.Selection<HTMLDivElement, undefined, null, undefined>;
	collapsibleIcon: d3.Selection<HTMLDivElement, undefined, null, undefined>;

	adjustHeight = debounce(
		function () {
			if (!this.iscollapsed()) {
				let height = 0;
				// console.log(this.settings.map((setting) => setting.settingEl));
				for (let setting of this.settings) {
					// console.log(setting.settingEl.clientHeight);
					height += setting.settingEl.clientHeight;
				}
				// console.log(height);
				this.settingsContainer.style("height", height + "px");
			}
		},
		10,
		true
	);

	iscollapsed() {
		return this.section.classed("is-collapsed");
	}

	fold() {
		// for (let setting of this.settings) {
		// 	console.log(setting.settingEl.clientHeight);
		// }
		this.collapsibleIcon.attr("transform", "rotate(-90deg)");
		this.section.classed("is-collapsed", true);
		this.settingsContainer
			.style("height", "0px")
			.style("padding-top", "0px")
			.style("padding-bottom", "0px");
		setTimeout(
			function () {
				this.settingsContainer.remove();
			}.bind(this),
			100
		);
	}

	unfold() {
		// for (let setting of this.settings) {
		// 	console.log(setting.settingEl.clientHeight);
		// }
		this.collapsibleIcon.attr("transform", null);
		this.section.classed("is-collapsed", false);
		this.section.node().appendChild(this.settingsContainer.node());
		this.settingsContainer
			.style("padding-top", "4px")
			.style("padding-bottom", "4px");
		this.adjustHeight();
	}

	toggleCollapsed(collapsed?: boolean) {
		// console.log("toggle!");
		if (collapsed === true) {
			this.fold();
		} else if (collapsed === false) {
			this.unfold();
		} else {
			if (this.iscollapsed()) this.unfold();
			else this.fold();
		}
	}

	constructor(
		graphControls: GraphControl,
		id: string,
		header: string,
		collapse: boolean = true
	) {
		this.settings = [];
		this.graphControls = graphControls;
		this.section = graphControls.container
			.append("div")
			.classed(
				`tree-item graph-control-section mod-${id} is-collapsed`,
				true
			);
		let resetButton = this.section
			.append("div")
			.classed("clickable-icon graph-controls-button mod-reset", true);
		setIcon(resetButton.node(), "lucide-rotate-ccw");
		let self = this.section
			.append("div")
			.classed("tree-item-self", true)
			.on("click", this.toggleCollapsed.bind(this));
		this.collapsibleIcon = self
			.append("div")
			.classed("tree-item-icon collapse-icon", true);
		setIcon(this.collapsibleIcon.node(), "right-triangle");
		let inner = self
			.append("div")
			.classed("tree-item-inner", true)
			.append("header")
			.classed("graph-control-section-header", true)
			.text(header);
		this.settingsContainer = d3
			.create("div")
			.classed("tree-item-children", true)
			.style("height", "0px")
			.style("transition", transition)
			.style("overflow", "hidden");
		if (collapse === false) {
			this.unfold();
		}
	}

	addSetting() {
		let setting = new Setting(this.settingsContainer.node());
		this.settings.push(setting);
		this.adjustHeight();
		return setting;
	}
}

export class GraphControl {
	container: d3.Selection<HTMLDivElement, undefined, null, undefined>;
	categories: GraphControlCategory[];

	isClose() {
		return this.container.classed("is-close");
	}

	open() {
		this.container.classed("is-close", false);
		this.categories.forEach((category) => category.adjustHeight());
	}

	close() {
		this.container.classed("is-close", true);
	}

	toggle() {
		if (this.isClose()) this.open();
		else this.close();
	}

	constructor(containerEl: HTMLElement) {
		this.categories = [];
		Array.from(
			containerEl.getElementsByClassName("graph-controls")
		).forEach((x) => containerEl.removeChild(x));
		this.container = d3
			.create("div")
			.classed("graph-controls is-close", true)
			.style("background-color", "var(--graph-control-bg)")
			.style("border", "none");
		let closeButton = this.container
			.append("div")
			.classed("clickable-icon graph-controls-button mod-close", true)
			.attr("aria-lable", "Close")
			.on("click", this.close.bind(this));
		setIcon(closeButton.node(), "lucide-x");
		let openButton = this.container
			.append("div")
			.classed("clickable-icon graph-controls-button mod-open", true)
			.attr("aria-lable", "Open graph settings")
			.on("click", this.open.bind(this));
		setIcon(openButton.node(), "gear");
		containerEl.appendChild(this.container.node());
	}

	addCategory(id: string, header: string, collapse?: boolean) {
		let category = new GraphControlCategory(this, id, header, collapse);
		this.categories.push(category);
		return category;
	}
}
