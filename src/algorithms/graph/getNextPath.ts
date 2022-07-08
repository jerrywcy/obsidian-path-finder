
import type { ExtendedGraph } from 'src/algorithms/graph/types';
import { dijkstra } from './dijkstra';
import { Heap } from 'heap-js';
import { map } from 'd3';

function buildPath(s: number, t: number, from: Array<number>): Array<number> {
    let ret = [];
    for (let i = t; i > 0; i = from[i]) {
        ret.push(i);
    }
    ret = ret.reverse();
    if (ret[0] !== s) return undefined;
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

export function* getNextPath(s: number, t: number, g: ExtendedGraph): Generator<Array<any> | undefined> {
    let pathMap = new Map<string, boolean>();

    if (s == t) return [s];

    let path = buildPath(s, t, dijkstra(s, g).from);
    if (path === undefined) { return undefined; }

    let forbiddenEdges = new Map<number, Map<string, boolean>>;
    pathMap.set(path.toString(), true);
    yield (path.map(x => g.getName(x)));

    let q = new Heap<Path>((a: Path, b: Path) => {
        if (a.path.length != b.path.length) return a.path.length - b.path.length;
        return a.id - b.id;
    });
    while (path.length <= g.getN()) {
        let forbiddenNodes = new Map<number, boolean>();
        for (let i = 0; i < path.length - 1; i++) {
            if (forbiddenEdges.get(path[i]) === undefined) {
                forbiddenEdges.set(path[i], new Map<string, boolean>());
            }
            forbiddenEdges.get(path[i])?.set(`${path[i]},${path[i + 1]}`, true);
            forbiddenEdges.get(path[i])?.set(`${path[i + 1]},${path[i]}`, true);
        }
        for (let i = 0; i < path.length - 1; i++) {
            let { from } = dijkstra(path[i], g, forbiddenNodes, forbiddenEdges.get(path[i]));
            let deviatePath: Array<any> | undefined = buildPath(path[i], t, from);
            if (deviatePath !== undefined) {
                let res = new Path(i, path.slice(0, i).concat(deviatePath));
                q.push(res);
            }
            forbiddenNodes.set(path[i], true);
        }
        while (!q.isEmpty() && pathMap.has(q.peek().path.toString()))
            q.pop();
        if (q.isEmpty()) { return undefined; }
        path = (q.peek() as Path).path;
        q.pop();
        console.log(path);
        pathMap.set(path.toString(), true);
        yield path.map(x => g.getName(x));
    }
    return undefined;
}