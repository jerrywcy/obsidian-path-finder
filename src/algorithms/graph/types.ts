

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
    n: number;
    g: Array<Edge>;
    head: Array<number>;
    edgeID: Map<string, number>;

    constructor() {
        this.n = 0;
        this.g = [new Edge(0, 0, 0, -1)];
        this.head = [0];
        this.edgeID = new Map<string, number>();
    }

    addEdge(u: number, v: number, w: number): void {
        if (this.edgeID.has(`${u},${v}`)) return;
        this.g.push(new Edge(u, v, w, this.head[u] ?? -1));
        this.head[u] = this.g.length - 1;
        this.edgeID.set(`${u},${v}`, this.head[u]);
    }
    getOutEdges(u: number): Array<Edge> {
        if (this.head[u] === undefined) return [];
        let ret = new Array<Edge>();
        for (let i = this.head[u]; this.g[i] !== undefined; i = this.g[i].next) {
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

export class ExtendedGraph extends Graph {
    nameToID: Map<any, number>;
    IDToName: Map<number, any>;

    constructor() {
        super();
        this.nameToID = new Map<any, number>();
        this.IDToName = new Map<number, any>();
    }

    addVertice(x: any) {
        this.n++;
        this.nameToID.set(x, this.n);
        this.IDToName.set(this.n, x);
        return this.n;
    }
    getID(x: any) { return this.nameToID.get(x); }

    getName(u: number) { return this.IDToName.get(u); }
    getOutEdgesExtended(u: any): Array<Edge> {
        return super
            .getOutEdges(this.getID(u) ?? this.addVertice(u));
    }

    addEdgeExtended(u: any, v: any, w: number) {
        super.addEdge(
            this.getID(u) ?? this.addVertice(u),
            this.getID(v) ?? this.addVertice(v),
            w);
    }
}