import { WeightedGraph } from "./weighted_graph";

export class WeightedGraphWithNodeID extends WeightedGraph {
	nameToID: Map<any, number>;
	IDToName: Map<number, any>;

	constructor() {
		super();
		this.nameToID = new Map<any, number>();
		this.IDToName = new Map<number, any>();
	}

	addVerticeAndReturnID(name: any) {
		if (this.getID(name) === undefined) this.addVertice(name);
		return this.getID(name);
	}

	addVertice(name: any) {
		this.nodeCount++;
		this.nameToID.set(name, this.nodeCount);
		this.IDToName.set(this.nodeCount, name);
	}

	getID(name: any) {
		return this.nameToID.get(name);
	}

	getName(id: number) {
		return this.IDToName.get(id);
	}

	addEdgeExtended(source: any, target: any, weight: number) {
		super.addEdge(
			this.addVerticeAndReturnID(source),
			this.addVerticeAndReturnID(target),
			weight
		);
	}
}
