/** Class representing an edge. */
class Edge {
	source: number;
	target: number;
	weight: number;
	/** The next edge that start with `source` */
	next: number;

	constructor(source: number, target: number, weight: number, next: number) {
		this.source = source;
		this.target = target;
		this.weight = weight;
		this.next = next;
	}

	toString() {
		return `u: ${this.source}, v: ${this.target}, w: ${this.weight}, next:${this.next}`;
	}
}

/** Class representing a graph whose nodes are of type number. */
export class WeightedGraph {
	nodeCount: number;
	edges: Array<Edge>;
	head: Array<number>;
	/** Map an edge to its index. Edge is stored in the form of `u,v`. */
	edgeID: Map<string, number>;

	constructor() {
		this.nodeCount = 0;
		this.edges = [new Edge(0, 0, 0, -1)];
		this.head = [0];
		this.edgeID = new Map<string, number>();
	}

	addEdge(source: number, target: number, weight: number) {
		this.nodeCount = Math.max(this.nodeCount, Math.max(source, target));
		if (this.edgeID.has(`${source},${target}`)) return;
		this.edges.push(
			new Edge(source, target, weight, this.head[source] ?? -1)
		);
		this.head[source] = this.edges.length - 1;
		this.edgeID.set(`${source},${target}`, this.head[source]);
	}

	*getOutEdges(source: number): Generator<Edge> {
		if (this.head[source] === undefined) return;
		for (
			let i = this.head[source];
			this.edges[i] !== undefined;
			i = this.edges[i].next
		) {
			yield this.edges[i];
		}
		return;
	}

	getNodeCount(): number {
		return this.nodeCount;
	}

	getEdgeCount(): number {
		return this.edges.length - 1;
	}

	toString() {
		let ret = "";
		for (let x of this.edges) {
			ret += x.toString() + "\n";
		}
		for (let i = 1; i < this.head.length; i++) {
			ret += `head[${i}]=${this.head[i]}\n`;
		}
		return ret;
	}
}
