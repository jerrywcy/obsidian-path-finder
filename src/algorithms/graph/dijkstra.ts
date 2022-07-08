import { Heap } from 'heap-js';
import type { ExtendedGraph } from 'src/algorithms/graph/types';

class Vertice {
    constructor(id: number, dis: number) {
        this.id = id;
        this.dis = dis;
    }
    id: number;
    dis: number;
}

export function dijkstra(s: number, g: ExtendedGraph, forbiddenNodes?: Map<number, boolean>, forbiddenEdges?: Map<string, boolean>): { dis: Array<number>, from: Array<number> } {
    let dis: Array<number> = [];
    let from: Array<number> = [];
    let mk: Array<boolean> = [];
    let n = g.getN();
    for (let i = 0; i <= n; i++) { dis.push(Infinity); from.push(-1); mk.push(false); }

    from[s] = 0;
    dis[s] = 0;
    let q = new Heap<Vertice>((a: Vertice, b: Vertice) => a.dis - b.dis);
    q.push(new Vertice(s, 0));
    while (!q.isEmpty()) {
        while (!q.isEmpty() &&
            (dis[(q.peek() as Vertice).id] != (q.peek() as Vertice).dis ||
                mk[(q.peek() as Vertice).id])) {
            q.pop();
        }
        if (q.isEmpty()) break;
        let { id: u } = q.pop() as Vertice;
        mk[u] = true;
        for (let { v, w } of g.getOutEdges(u)) {
            if (forbiddenNodes !== undefined &&
                forbiddenNodes.get(v))
                continue;
            if (forbiddenEdges !== undefined &&
                (forbiddenEdges.get(`${u},${v}`) || forbiddenEdges.get(`${v},${u}`)))
                continue;
            if (!mk[v] && dis[u] + w < dis[v]) {
                dis[v] = dis[u] + w;
                from[v] = u;
                q.push(new Vertice(v, dis[v]));
            }
        }
    }
    return { dis, from };
}