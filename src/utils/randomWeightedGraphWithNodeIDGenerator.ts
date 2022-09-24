import { WeightedGraphWithNodeID } from "../algorithms/graph/weightedGraphWithNodeId";
import { random } from "./random";
import { WeightedGraphData } from "./graphData";
import { randomString } from "./randomString";
import { RandomWeightedGraphGenerator } from "../utils/randomWeightedGraphGenerator";
import { WeightedGraphWithNodeIDData } from "./weightedGraphWithNodeIdData";
import { memset } from "./memset";

export class RandomWeightedGraphWithNodeIDGenerator extends RandomWeightedGraphGenerator {
	graphData: WeightedGraphWithNodeIDData;

	constructor(maxNodeCount: number, maxEdgeCount: number) {
		super(maxNodeCount, maxEdgeCount);
	}

	generate(): WeightedGraphWithNodeIDData {
		console.log(this.graphData);
		this.initializeGraphData();
		this.generateNodeCount();
		this.generateEdgeCount();

		this.initializeGraph();
		this.addVerticeWithRandomNames();
		this.addRandomEdges();

		return Object.assign(this.graphData, super.graphData);
	}

	initializeGraphData(): void {
		this.graphData = new WeightedGraphWithNodeIDData();
		super.graphData = new WeightedGraphData();
	}

	addVerticeWithRandomNames() {
		for (let i = 1; i <= this.graphData.nodeCount; i++) {
			let name = randomString(random(1, 1000));
			if (this.graphData.graph.getID(name) !== undefined) {
				i--;
				continue;
			}
			this.graphData.graph.addVertice(name);
		}
	}
	generateNodeCount() {
		this.graphData.nodeCount = random(1, this.maxNodeCount);
	}

	generateEdgeCount() {
		this.graphData.edgeCount = random(
			1,
			Math.min(
				this.maxEdgeCount,
				(this.graphData.nodeCount * (this.graphData.nodeCount - 1)) / 2
			)
		);
	}

	initializeGraph() {
		this.graphData.graph = new WeightedGraphWithNodeID();
	}

	addRandomEdges() {
		this.initializeEdgeMatrix(this.graphData.nodeCount);
		for (let i = 1; i <= this.graphData.edgeCount; i++) {
			const source = random(1, this.graphData.nodeCount);
			const target = random(1, this.graphData.nodeCount);
			const weight = random(1, Number.MAX_SAFE_INTEGER);
			if (
				this.graphData.edgeMatrix[source][target] !== Infinity ||
				this.graphData.edgeMatrix[target][source] !== Infinity
			) {
				i--;
				continue;
			}
			this.graphData.graph.addEdge(source, target, weight);
			this.graphData.edgeMatrix[source][target] =
				this.graphData.edgeMatrix[target][source] = weight;
		}
	}

	initializeEdgeMatrix(nodeCount: number) {
		this.graphData.edgeMatrix = [];
		memset(
			this.graphData.edgeMatrix,
			Infinity,
			nodeCount + 1,
			nodeCount + 1
		);
	}
}
