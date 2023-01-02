import { GraphControl, GraphControlCategory } from "./graph_control";

export class ForceGraphControl extends GraphControl {
	forceCategory: ForceCategory;
	filterCategory: FilterCategory;

	constructor(containerEl: HTMLElement) {
		super(containerEl);
		this.addFilterCategory();
		this.addForceCategory();
	}

	addFilterCategory() {
		this.filterCategory = super.addCategory("filter", "Filter");
	}

	addForceCategory() {
		this.forceCategory = super.addCategory("force", "Force");
	}
}

class ForceCategory extends GraphControlCategory {}

class FilterCategory extends GraphControlCategory {}
