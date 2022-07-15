/** Class representing an edge. */
class Edge {
    /** The starting node of the edge. */
    u: number;
    /** The ending node of the edge. */
    v: number;
    /** The weight of the edge. */
    w: number;
    /** The next edge that start with `u` */
    next: number;

    /**
     * Construct a new edge.
     * @param u The starting node of the edge.
     * @param v The ending node of the edge.
     * @param w The weight of the edge.
     * @param next The next edge that start with `u`
     */
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

/** Class representing a graph whose nodes are of type number. */
export class Graph {
    /** The number of nodes in the graph. */
    n: number;
    /** The array containing all edges in the graph. 0-indexed. */
    edges: Array<Edge>;
    /** head[u]: The index of the first edge starting with `u` in `edges` */
    head: Array<number>;
    /** Map an edge to its index. Edge is stored in the form of `u,v`. */
    edgeID: Map<string, number>;

    /**
     * Construct and initialize a new graph.
     */
    constructor() {
        this.n = 0;
        this.edges = [new Edge(0, 0, 0, -1)];
        this.head = [0];
        this.edgeID = new Map<string, number>();
    }

    /**
     * Add a new edge in the graph.
     * @param u The starting node of the edge.
     * @param v The ending node of the edge.
     * @param w The weight of the edge.
     */
    addEdge(u: number, v: number, w: number) {
        if (this.edgeID.has(`${u},${v}`)) return;
        this.edges.push(new Edge(u, v, w, this.head[u] ?? -1));
        this.head[u] = this.edges.length - 1;
        this.edgeID.set(`${u},${v}`, this.head[u]);
    }

    /**
     * Get all edges starting from `u`.
     * @param u The node to get out edges of.
     * @returns An array of edges that start from `u`.
     */
    getOutEdges(u: number): Array<Edge> {
        if (this.head[u] === undefined) return [];
        let ret = new Array<Edge>();
        for (let i = this.head[u]; this.edges[i] !== undefined; i = this.edges[i].next) {
            ret.push(this.edges[i]);
        }
        return ret;
    }

    /**
     * Get the number of nodes in the graph.
     * @returns The number of nodes in the graph.
     */
    getN(): number {
        return this.n;
    }

    /**
     * Get the number of edges in the graph.
     * @returns The number of edges in the graph.
     */
    getM(): number {
        return this.edges.length - 1;
    }

    toString() {
        let ret = "";
        for (let x of this.edges) {
            ret += x.toString() + "\n";
        }
        for (let i = 1; i < this.head.length; i++) {
            ret += `head[${i}]=${this.head[i]}\n`;
        }
        return ret;
    }
}

/** Class representing a graph whose nodes are of type any. */
export class ExtendedGraph extends Graph {
    /** Map the name of the node to its index. */
    nameToID: Map<any, number>;
    /** Map the index of the node to its name. */
    IDToName: Map<number, any>;

    /** 
     * Construct and initialize a new graph.
     */
    constructor() {
        super();
        this.nameToID = new Map<any, number>();
        this.IDToName = new Map<number, any>();
    }

    /**
     * Add a node into the graph and returns its index.
     * @param x The name of the node to add.
     * @returns The index of the new node.
     */
    addVertice(x: any) {
        this.n++;
        this.nameToID.set(x, this.n);
        this.IDToName.set(this.n, x);
        return this.n;
    }

    /**
     * Get the index of a given node.
     * @param x The name of the node to look up for.
     * @returns The index of the node if it exist, or undefined if it doesn't exist.
     */
    getID(x: any) { return this.nameToID.get(x); }

    /**
     * Get the name of a given node.
     * @param u The index of the node to get name for.
     * @returns The name of the node.
     */
    getName(u: number) { return this.IDToName.get(u); }

    /**
     * Get all edges starting from `u`.
     * @param u The name of the node to get out edges for.
     * @returns An array of edges that start from `u`.
     */
    getOutEdgesExtended(u: any): Array<Edge> {
        return super
            .getOutEdges(this.getID(u) ?? this.addVertice(u));
    }

    /**
     * Add an edge into the graph.
     * @param u The starting node of the edge.
     * @param v The ending node of the edge.
     * @param w The weight of the edge.
     */
    addEdgeExtended(u: any, v: any, w: number) {
        super.addEdge(
            this.getID(u) ?? this.addVertice(u),
            this.getID(v) ?? this.addVertice(v),
            w);
    }
}