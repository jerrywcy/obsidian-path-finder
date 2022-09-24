import { memset } from "src/utils/memset";
import { describe, test, expect } from "vitest";

describe("Memset", () => {
	test("One dimensional array", () => {
		let arr: Array<number> = [];
		memset(arr, 0, 2);
		expect(arr).toMatchObject([0, 0]);
	});
	test("Two dimensional array", () => {
		let arr: Array<Array<number>> = [];
		memset(arr, 0, 2, 2);
		expect(arr).toMatchObject([
			[0, 0],
			[0, 0],
		]);
	});
});
