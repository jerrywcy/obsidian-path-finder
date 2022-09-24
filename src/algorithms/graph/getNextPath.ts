import type { WeightedGraphWithNodeID } from "src/algorithms/graph/weightedGraphWithNodeId";
import { dijkstra } from "./dijkstra";
import { Heap } from "heap-js";

/**
 *
 * @param source The source node.
 * @param target The target node.
 * @param from from[u]: The node before {u} on the shortest path fron {source} to {u}.
 * @returns An array of numbers starting with {source}, ending with {target}, representing the path if the path exist, or undefined if such a path does not exist.
 */
function buildPath(
	source: number,
	target: number,
	from: Array<number>
): Array<number> | undefined {
	let ret = [];
	for (let i = target; i > 0; i = from[i]) {
		ret.push(i);
	}
	ret = ret.reverse();
	if (ret[0] !== source) return undefined;
	return ret;
}

class Path {
	constructor(id: number, path: Array<number>) {
		this.id = id;
		this.path = path;
	}
	id: number;
	path: Array<number>;
}

/**
 * Generate all paths from {source} to {target} no longer than {length} from the shortest to the longest using Yen's algorithm.
 * @param source The source node.
 * @param target The target node.
 * @param length The maximum length of all paths generated.
 * @param graph The graph.
 * @returns An async generator.
 *
 * Generate the next shortest path from {source} to {target} each time next() is called.
 *
 * Returns undefined when all paths no longer than {length} have been found.
 */
export async function* getNextPath(
	source: number,
	target: number,
	length: number,
	graph: WeightedGraphWithNodeID
): AsyncGenerator<Array<any> | undefined> {
	let pathMap = new Map<string, boolean>();

	if (source == target) {
		yield [source];
		return undefined;
	}

	let path = buildPath(source, target, dijkstra(source, graph).from);
	if (path === undefined) {
		return undefined;
	}

	let forbiddenEdges = new Map<number, Map<string, boolean>>();
	pathMap.set(path.toString(), true);
	yield path.map((x) => graph.getName(x));

	let q = new Heap<Path>((a: Path, b: Path) => {
		if (a.path.length != b.path.length)
			return a.path.length - b.path.length;
		return a.id - b.id;
	});
	q.push(new Path(-1, path));
	while (!q.isEmpty() && path.length <= graph.getNodeCount()) {
		let { path } = q.pop();
		let forbiddenNodes = new Map<number, boolean>();
		for (let i = 0; i < path.length - 1; i++) {
			if (forbiddenEdges.get(path[i]) === undefined) {
				forbiddenEdges.set(path[i], new Map<string, boolean>());
			}
			forbiddenEdges.get(path[i]).set(`${path[i]},${path[i + 1]}`, true);
			forbiddenEdges.get(path[i]).set(`${path[i + 1]},${path[i]}`, true);
		}
		for (let i = 0; i < path.length - 1; i++) {
			let { from } = dijkstra(
				path[i],
				graph,
				forbiddenNodes,
				forbiddenEdges.get(path[i])
			);
			let deviatePath: Array<any> | undefined = buildPath(
				path[i],
				target,
				from
			);
			if (deviatePath !== undefined) {
				let res = new Path(i, path.slice(0, i).concat(deviatePath));
				q.push(res);
			}
			forbiddenNodes.set(path[i], true);
		}
		while (!q.isEmpty() && pathMap.has(q.peek().path.toString())) q.pop();
		if (q.isEmpty()) {
			return undefined;
		}
		path = q.pop().path;
		if (path.length > length) {
			return undefined;
		}
		pathMap.set(path.toString(), true);
		yield path.map((x) => graph.getName(x));
	}
	return undefined;
}
