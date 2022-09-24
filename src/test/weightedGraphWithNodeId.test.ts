import { random } from "src/utils/random";
import { randomString } from "src/utils/randomString";
import { RandomWeightedGraphWithNodeIDGenerator } from "src/utils/randomWeightedGraphWithNodeIdGenerator";
import { describe, test, expect } from "vitest";

describe("Weighted Graph With Node ID", () => {
	const generator = new RandomWeightedGraphWithNodeIDGenerator(100, 1000);
	const { nodeCount, edgeCount, graph, edgeMatrix } = generator.generate();
	const nameToID = new Map<any, number>();
	const IDToName = new Map<number, any>();
	for (let i = 1; i <= nodeCount; i++) {
		let name = randomString(random(1, 1000));
		if (nameToID.get(name)) {
			i--;
			continue;
		}
		nameToID.set(name, i);
		IDToName.set(i, name);
	}

	test("Get Name", () => {});
});
