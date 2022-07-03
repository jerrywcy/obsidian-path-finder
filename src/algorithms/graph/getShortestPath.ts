
import { dijkstra } from './dijkstra';
import { Graph } from './types';

export function getShortestPath(s: number, t: number, g: Graph): Array<number> {
    if (s == t) return [0, s];

    let { dis, from } = dijkstra(s, g);

    if (!from[t]) { return [-1]; }

    let ret: Array<number> = [];
    for (let u = t; u; u = from[u]) {
        ret.push(u);
    }
    ret.reverse();
    ret = [dis[t], ...ret];
    return ret;
}