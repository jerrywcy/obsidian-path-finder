
import { Graph } from 'src/algorithms/graph/types';
import { dijkstra } from './dijkstra';

const inf = 0x3f3f3f3f;

let mk: Map<number, boolean>;
let dis: Array<number>;
let stack: Array<number>;
let ret: Array<Array<number>>;

export function getAllPaths(s: number, t: number, length: number, g: Graph): Array<Array<number>> {
    if (s == t) return [[s]];
    dis = dijkstra(s, g).dis;

    stack = [];
    ret = [];
    mk = new Map<number, boolean>();
    dfs(s, t, length, g);

    return ret;
}

function dfs(u: number, dest: number, d: number, g: Graph): void {
    if (u == dest) {
        ret.push([...stack, u]);
        console.log(ret.last());
        return;
    }
    if (dis[u] > d) return;
    stack.push(u); mk.set(u, true);
    for (let { v } of g.getOutEdges(u)) {
        if (!mk.get(v)) {
            dfs(v, dest, d - 1, g);
        }
    }
    stack.pop(); mk.set(u, false);
}