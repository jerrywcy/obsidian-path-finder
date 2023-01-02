import { random } from "src/utils/random";
import { RandomWeightedGraphWithNodeIDGenerator } from "src/utils/random_weighted_graph_with_node_id_generator";
import { describe, test, expect } from "vitest";

describe("Weighted Graph With Node ID", () => {
	const generator = new RandomWeightedGraphWithNodeIDGenerator(100, 1000);
	const { nodeCount, graph, nameToID, IDToName } = generator.generate();

	test("Get Name", () => {
		for (let i = 1; i <= graph.getNodeCount(); i++) {
			expect(graph.getName(i)).toBe(IDToName.get(i));
		}
	});

	test("Get ID", () => {
		for (let name of nameToID.keys()) {
			expect(graph.getID(name)).toBe(nameToID.get(name));
		}
	});

	test("Add Edge Extended", () => {
		let source = random(1, nodeCount),
			target = random(1, nodeCount),
			weight = random(1, Number.MAX_SAFE_INTEGER);
		while (target == source) target = random(1, nodeCount);
		let sourceNodeName = graph.getName(source),
			targetNodeName = graph.getName(target);
		graph.addEdgeExtended(sourceNodeName, targetNodeName, weight);
		let sourceNodeOutEdges = Array.from(graph.getOutEdges(source));
		let targetNodeOutEdges = Array.from(graph.getOutEdges(target));
		expect(
			sourceNodeOutEdges.filter((edge) => {
				return (
					edge.source === source &&
					edge.target == target &&
					edge.weight == weight
				);
			})
		).toBeTruthy();
		expect(
			targetNodeOutEdges.filter((edge) => {
				return (
					edge.source === source &&
					edge.target == target &&
					edge.weight == weight
				);
			})
		).toBeTruthy();
	});
});
