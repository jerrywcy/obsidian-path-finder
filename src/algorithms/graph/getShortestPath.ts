
import { Notice } from 'obsidian';
import { dijkstra } from './dijkstra';
import { ExtendedGraph, Graph } from './types';

export function getShortestPath(from: any, to: any, g: ExtendedGraph): ExtendedGraph | undefined {
    let s = g.getID(from);
    let t = g.getID(to);
    if (s === undefined) {
        new Notice(`${from} does not exist!`);
        return;
    }
    if (t === undefined) {
        new Notice(`${to} does not exist!`);
        return;
    }

    let ret = new ExtendedGraph();
    ret.addVertice(from)
    if (s == t) return ret;

    let { from: f } = dijkstra(s, g);

    if (f[t] == -1) { return; }

    for (let u = t; u != s; u = f[u]) {
        ret.addEdgeExtended(g.getName(u), g.getName(f[u]), 1);
        ret.addEdgeExtended(g.getName(f[u]), g.getName(u), 1);
    }
    return ret;
}