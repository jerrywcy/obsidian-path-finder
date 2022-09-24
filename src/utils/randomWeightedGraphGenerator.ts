import { memset } from "./memset";
import { random } from "./random";
import { WeightedGraphData } from "./graphData";
import { WeightedGraph } from "./../algorithms/graph/weightedGraph";

export class RandomWeightedGraphGenerator {
	maxNodeCount: number;
	maxEdgeCount: number;
	graphData: WeightedGraphData;

	constructor(maxNodeCount: number, maxEdgeCount: number) {
		this.maxNodeCount = maxNodeCount;
		this.maxEdgeCount = maxEdgeCount;
	}

	generate(): WeightedGraphData {
		this.initializeGraphData();
		this.generateNodeCount();
		this.generateEdgeCount();

		this.initializeGraph();
		this.addRandomEdges();

		return this.graphData;
	}

	initializeGraphData() {
		this.graphData = new WeightedGraphData();
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
		this.graphData.graph = new WeightedGraph();
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
