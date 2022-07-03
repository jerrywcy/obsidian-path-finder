

class Edge {
    u: number;
    v: number;
    w: number;
    next: number;

    constructor(u: number, v: number, w: number, next: number) {
        this.u = u;
        this.v = v;
        this.w = w;
        this.next = next;
    }

    toString() {
        return `u: ${this.u}, v: ${this.v}, w: ${this.w}, next:${this.next}`;
    }
}

export class Graph {
    n: number = 0;
    g: Array<Edge>;
    head: Array<number>;
    exist: Map<string, number>;

    constructor() {
        this.g = [new Edge(0, 0, 0, 0)];
        this.head = [0];
        this.exist = new Map<string, number>();
    }

    addEdge(u: number, v: number, w: number): void {
        if (this.exist.has(`${u},${v},${w}`)) return;
        this.n = Math.max(this.n, Math.max(u, v));
        this.g.push(new Edge(u, v, w, this.head[u] ?? 0));
        this.head[u] = this.g.length - 1;
        this.exist.set(`${u},${v},${w}`, this.head[u]);
    }

    getOutEdges(u: number): Array<Edge> {
        if (this.head[u] === undefined) return [];
        let ret = new Array<Edge>();
        for (let i = this.head[u]; i; i = this.g[i].next) {
            ret.push(this.g[i]);
        }
        return ret;
    }

    getN(): number {
        return this.n;
    }

    getM(): number {
        return this.g.length - 1;
    }

    toString() {
        let ret = "";
        for (let x of this.g) {
            ret += x.toString() + "\n";
        }
        for (let i = 1; i < this.head.length; i++) {
            ret += `head[${i}]=${this.head[i]}\n`;
        }
        return ret;
    }
}