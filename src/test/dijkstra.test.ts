import { describe, test, expect } from "vitest";
import { RandomWeightedGraphGenerator } from "src/utils/random_weighted_graph_generator";
import { dijkstra } from "src/algorithms/graph/dijkstra";
import { random } from "src/utils/random";
import { WeightedGraph } from "src/algorithms/graph/weighted_graph";
import { memset } from "src/utils/memset";

describe("Dijkstra", () => {
	let generator = new RandomWeightedGraphGenerator(10, 10);
	let { graph, nodeCount } = generator.generate();
	let source = random(1, nodeCount);
	let { dis } = dijkstra(source, graph);
	test("dist", () => {
		for (let i = 1; i <= nodeCount; i++) {
			expect(dis[i]).toBe(getDis(graph, source, i));
		}
	});
});

let distance = Infinity;
let mark: Array<boolean> = [];

function dfs(
	graph: WeightedGraph,
	current: number,
	target: number,
	dis: number
) {
	if (current == target) {
		distance = Math.min(distance, dis);
		return;
	}
	mark[current] = true;
	for (let { target: v, weight } of graph.getOutEdges(current)) {
		if (mark[v] === false) {
			dfs(graph, v, target, dis + weight);
		}
	}
	mark[current] = false;
}

function getDis(graph: WeightedGraph, source: number, target: number) {
	distance = Infinity;
	memset(mark, false, graph.getNodeCount());
	dfs(graph, source, target, 0);
	return distance;
}
