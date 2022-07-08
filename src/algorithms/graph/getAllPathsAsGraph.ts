import { Notice } from 'obsidian';
import { ExtendedGraph } from 'src/algorithms/graph/types';
import { dijkstra } from './dijkstra';

let inGraph: Array<boolean>;
let mk: Array<boolean>;
let dis: Array<number>;

export function getAllPathsAsGraph(from: any, to: any, length: number, g: ExtendedGraph): ExtendedGraph | undefined {
    let ret = new ExtendedGraph();
    ret.addVertice(from);
    if (from == to) return ret;

    let s = g.getID(from), t = g.getID(to);
    if (s === undefined) {
        new Notice(`${from} does not exist!`);
        return;
    }
    if (t === undefined) {
        new Notice(`${to} does not exist!`);
        return;
    }
    let dis1 = dijkstra(s, g).dis;
    if (dis1[t] > length || dis1[t] === Infinity) return undefined;
    let dis2 = dijkstra(t, g).dis;
    if (dis2[s] > length || dis2[s] === Infinity) return undefined;
    dis = [];
    for (let i = 1; i <= g.getN(); i++) {
        dis[i] = dis1[i] + dis2[i];
    }

    inGraph = []; inGraph[t] = true;
    mk = [];

    dfs(s, t, length, g);

    for (let i = 1; i <= g.getM(); i++) {
        let { u, v, w } = g.g[i];
        if (inGraph[u] && inGraph[v]) {
            ret.addEdgeExtended(g.getName(u), g.getName(v), w);
        }
    }

    return ret;
}

function dfs(u: number, t: number, length: number, g: ExtendedGraph): boolean {
    if (dis[u] > length || dis[u] === Infinity) return false;
    if (inGraph[u]) return true;
    if (mk[u]) return false;
    let ret = false;
    mk[u] = true;
    for (let { v } of g.getOutEdges(u)) {
        let res = dfs(v, t, length, g);
        ret ||= res;
    }
    if (ret) inGraph[u] = true;
    return ret;
}