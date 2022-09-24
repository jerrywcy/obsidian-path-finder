import { memset } from "src/utils/memset";
import { random } from "src/utils/random";
import { describe, test, expect } from "vitest";

describe("Random", () => {
	const LIMIT = 100000;
	test("Lower Bound", () => {
		for (let i = 1; i <= LIMIT; i++) {
			expect(random(1, LIMIT)).toBeGreaterThanOrEqual(1);
		}
	});
	test("Upper Bound", () => {
		for (let i = 1; i <= LIMIT; i++) {
			expect(random(1, LIMIT)).toBeLessThanOrEqual(LIMIT);
		}
	});
	test("Distribution", () => {
		let count: Array<number> = [];
		memset(count, 0, LIMIT + 1);
		for (let i = 1; i <= LIMIT * 10; i++) {
			count[random(1, LIMIT)]++;
		}
		let variance = 0;
		for (let i = 1; i <= LIMIT; i++) {
			variance += (count[i] - 10) ** 2;
		}
		variance = Math.sqrt(variance);
		expect(variance).toBeLessThan(LIMIT / 10);
	});
});
