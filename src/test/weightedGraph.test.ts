import { describe, expect, test } from "vitest";
import { RandomWeightedGraphGenerator } from "src/utils/randomWeightedGraphGenerator";

describe("Graph", () => {
	const generator = new RandomWeightedGraphGenerator(1000, 100000);
	const { nodeCount, edgeCount, graph, edgeMatrix } = generator.generate();
	test("Get Node Count", () => {
		expect(graph.getNodeCount()).toBe(nodeCount);
	});
	test("Get Edge Count", () => {
		expect(graph.getEdgeCount()).toBe(edgeCount);
	});
	test("Get Out Edges", () => {
		let tmpEdgeCount = 0;
		for (let source = 1; source <= nodeCount; source++) {
			const outEdges = graph.getOutEdges(source);
			for (let { target, weight } of outEdges) {
				expect(edgeMatrix[source][target]).toBe(weight);
				expect(edgeMatrix[target][source]).toBe(weight);
				tmpEdgeCount++;
			}
		}
		expect(tmpEdgeCount).toBe(edgeCount);
	});
});
