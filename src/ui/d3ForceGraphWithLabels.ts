import * as d3 from 'd3'
import { Notice, setIcon } from "obsidian"
import { ExtendedGraph } from 'src/algorithms/graph/types';

class Node {
    // Internal property
    index?: number;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
    vx?: number;
    vy?: number;

    // Custom property
    id?: any;
    group?: any;
}

class Link {
    // Internal property
    index?: number;
    source?: Node;
    target?: Node;

    // Custom property
    type?: string;
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
export async function ForceGraphWithLabels(
    container: Element,
    nextPath: AsyncGenerator<Array<any> | undefined>,
    {
        graph,
        getNodes,
        getLinks
        // nodes, // an iterable of node objects (typically [{id}, …])
        // links // an iterable of link objects (typically [{source, target}, …])
    }: {
        // nodes: any[];
        // links: any[];
        graph: ExtendedGraph;
        getNodes: (g: ExtendedGraph) => any[];
        getLinks: (g: ExtendedGraph) => any[];
    }, {
        nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
        nodeGroup, // given d in nodes, returns an (ordinal) value for color
        nodeGroups, // an array of ordinal values representing the node groups
        nodeTitle, // given d in nodes, a title string
        nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
        nodeStroke = "#fff", // node stroke color
        nodeStrokeWidth = 1.5, // node stroke width, in pixels
        nodeStrokeOpacity = 1, // node stroke opacity
        nodeRadius = 5, // node radius, in pixels
        nodeStrength = -400,
        linkSource = ({ source }: Link) => source, // given d in links, returns a node identifier string
        linkTarget = ({ target }: Link) => target, // given d in links, returns a node identifier string
        linkStroke = "#999", // link stroke color
        linkStrokeOpacity = 0.6, // link stroke opacity
        linkStrokeWidth = 3, // given d in links, returns a stroke width in pixels
        linkStrokeLinecap = "round", // link stroke linecap
        linkStrength,
        colors = d3.schemeTableau10, // an array of color strings, for the node groups
        width = 2000, // outer width, in pixels
        height = 2000, // outer height, in pixels
        invalidation, // when this promise resolves, stop the simulation

        nodeTextFill = "currentColor",
        nodeTextStroke = "black",
        linkGroups,
        linkType = ({ type }: Link) => type
    }: {
        nodeId?: (d: Node, i?: number) => any;
        nodeGroup?: (d: Node, i?: number) => any;
        nodeGroups?: any[];
        nodeTitle?: (d: Node, i?: number) => any;
        nodeFill?: any;
        nodeStroke?: any;
        nodeStrokeWidth?: any;
        nodeStrokeOpacity?: number;
        nodeRadius?: any;
        nodeStrength?: any;
        linkSource?: (d: Link, i?: number) => any;
        linkTarget?: (d: Link, i?: number) => any;
        linkStroke?: any;
        linkStrokeOpacity?: any;
        linkStrokeWidth?: any;
        linkStrokeLinecap?: any;
        linkStrength?: any;
        colors?: any;
        width?: any;
        height?: any;
        invalidation?: Promise<any>;

        nodeTextFill?: any;
        nodeTextStroke?: any;
        linkGroups?: any[];
        linkType?: any;
    } = {}) {
    let global = document.getElementsByClassName("view-content")[0],
        x = global.clientWidth,
        y = global.clientHeight;
    width = x, height = y;
    let nodes = getNodes(graph), links = getLinks(graph);

    // Compute values.
    let N = d3.map(nodes, nodeId).map(intern);
    let LS = d3.map(links, linkSource).map(intern);
    let LT = d3.map(links, linkTarget).map(intern);
    let LG = d3.map(links, linkType).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    let T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    let G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    let W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    let L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    let existLink = new Map();

    nodes = nodes.map((d: any, i: number) => {
        return { id: N[i], group: nodeGroup(d) }
    });
    links = links.map((d: any, i: number) => {
        existLink.set(`${LS[i]}|${LT[i]}`, true);
        return { source: LS[i], target: LT[i], type: LG[i] }
    });

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    let color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
    // .force("x", d3.forceX())
    // .force("y", d3.forceY());

    container.setAttribute("style", "padding: 0px; overflow: hidden; position: relative;");

    const graphContainer = d3.create("div")
        .classed("path-finder force-graph", true);

    const svg = graphContainer.append("svg")
        .classed("path-finder path-graph", true)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("font", "12px sans-serif");

    svg.append("defs")
        // .selectAll("marker")
        .append("marker")
        // .data(linkGroups)
        // .join("marker")
        // .attr("id", d => `arrow-${d}`)
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "var(--text-normal)")
        .attr("d", "M0,-5L10,0L0,5");

    let link = svg.append("g")
        .attr("fill", "none")
        // .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        // .attr("stroke-opacity", linkStrokeOpacity)
        // .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        // .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("path")
        .data(links)
        .join("path")
        .classed("link", true)
        // .attr("marker-end", d => `url(#arrow-${d.type})`);
        .attr("marker-end", `url(#arrow)`);

    let node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .classed("node", true)
        .classed("fixed", (d: Node) => d.fx !== undefined)
        .call(drag(simulation))
        .on("click", click);

    // svg.on("SVGResize", fixSourceAndDestination);

    // fixSourceAndDestination();

    // function fixSourceAndDestination() {
    //     console.log("SVG Resized!");
    //     node.classed("fixed", d => {
    //         if (d.group == "source") {
    //             d.fx = 0;
    //             d.fy = 0;
    //             return true;
    //         }
    //         if (d.group == "destination") {
    //             d.fx = width;
    //             d.fy = height;
    //             return true;
    //         }
    //         return false;
    //     })
    // }

    node.on("mouseover", setSelection(true))
        .on("mouseout", setSelection(false));

    function setSelection(flag: boolean) {
        return function (evt: any, from: Node) {
            setNodeClass(node.filter((to: Node) => {
                let u = from.id, v = to.id;
                return existLink.get(`${u}|${v}`) || existLink.get(`${v}|${u}`);
            }), "selected", flag);
            setNodeClass(node.filter((to: Node) => {
                let u = from.id, v = to.id;
                return !(existLink.get(`${u}|${v}`) || existLink.get(`${v}|${u}`)) && u !== v;
            }), "unselected", flag);
            setNodeClass(d3.select(this), "center", flag);

            setLinkClass(link.filter((d: Link) => {
                return d.source.id == from.id || d.target.id == from.id;
            }), "selected", flag);
            setLinkClass(link.filter((d: Link) => {
                return !(d.source.id == from.id || d.target.id == from.id);
            }), "unselected", flag);
        }
    }

    function setNodeClass(
        selection: d3.Selection<SVGGElement | d3.BaseType, unknown, SVGGElement, undefined>,
        cls: string,
        flag: boolean = true
    ) {
        selection
            .classed(cls, flag);
        selection
            .select("circle")
            .classed(cls, flag);
        selection
            .select("text")
            .classed(cls, flag);
    }

    function setLinkClass(
        selection: d3.Selection<d3.BaseType | SVGPathElement, unknown, SVGGElement, undefined>,
        cls: string,
        flag: boolean = true
    ) {
        selection
            .classed(cls, flag);
    }

    node.append("circle")
        .classed("node-circle", true);

    if (W) link.attr("stroke-width", ({ index: i }: Link): any => W[i]);
    if (L) link.attr("stroke", ({ index: i }: Link): any => L[i]);
    if (G) node.attr("fill", ({ index: i }: Node): any => color(G[i]));
    if (T)
        node.append("text")
            .attr("x", 0)
            .attr("y", -30)
            .attr("align", "center")
            .text(({ index: i }: Node) => T[i])
            .classed("node-text", true);
    // .clone(true).lower()
    // .classed("outer", true); 

    if (invalidation != null) invalidation.then(() => simulation.stop());

    simulation
        .on("tick", ticked);

    svg.call(d3.zoom()
        .filter((evt) => {
            return (!evt.ctrlKey && evt.type !== 'click') || evt.type === "mousedown";
        })
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", zoomed)); ``
    function zoomed({ transform }: { transform: string }) {
        svg.selectAll("g").attr("transform", transform);
        simulation.alpha(1).restart();
    }

    function ticked() {
        link.attr("d", linkArc);
        node.attr("transform", (d: Node) => `translate(${d.x},${d.y})`);
    }

    function linkArc(d: Link) {
        if (d.type == "monodirectional") {
            const angle = Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x);
            const fromX = d.source.x, fromY = d.source.y;
            const toX = d.target.x + (nodeRadius + nodeStrokeWidth) * Math.cos(angle), toY = d.target.y + (nodeRadius + nodeStrokeWidth) * Math.sin(angle);
            return `
                M${fromX},${fromY}
                L${toX},${toY}`
        }
        else {
            const dis = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
            const angle = Math.atan2(d.source.y - d.target.y, d.source.x - d.target.x);
            const fromX = d.source.x, fromY = d.source.y;
            const toX = d.target.x + (nodeRadius + nodeStrokeWidth) * Math.cos(angle), toY = d.target.y + (nodeRadius + nodeStrokeWidth) * Math.sin(angle);
            return `
                M${fromX},${fromY}
                A${dis},${dis} 0 0,1 ${toX},${toY}
            `;
        }
    }

    function click(evt: MouseEvent, d: Node) {
        if (d3.select(this).classed("fixed")) {
            delete d.fx;
            delete d.fy;
            d3.select(this).classed("fixed", false);
        }
        else {
            d.fx = d.x;
            d.fy = d.y;
            d3.select(this).classed("fixed", true);
        }
        // if (!event.active) simulation.alpha(1).restart();
    }

    function intern(value: any) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    // function ticked() {
    //     link
    //         .attr("x1", d => d.source.x)
    //         .attr("y1", d => d.source.y)
    //         .attr("x2", d => d.target.x)
    //         .attr("y2", d => d.target.y);

    //     node
    //         .attr("cx", d => d.x)
    //         .attr("cy", d => d.y);
    // }

    function clamp(x: number, lo: number, hi: number) {
        return x < lo ? lo : x > hi ? hi : x;
    }

    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
        function dragstarted(event: any, d: Node) {
            d3.select(this)
                .classed("fixed", true);
            if (!event.active) simulation.alphaTarget(1).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: Node) {
            d.fx = clamp(event.x, - Infinity, Infinity);
            d.fy = clamp(event.y, - Infinity, Infinity);
            simulation.alpha(1).restart();
        }

        function dragended(event: any, d: Node) {
            if (!event.active) simulation.alphaTarget(0);
            // d.fx = null;
            // d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    let panelContainer = d3.create("div")
        .classed("path-finder panel-container is-close", true);
    let panelTitleContainer = panelContainer.append("div")
        .classed("path-finder panel-title", true);
    let leftButtonDiv = panelTitleContainer
        .append("div")
        .classed("path-finder panel-button mod-prev", true);
    let panelTitle = panelTitleContainer.append("p")
        .text("1/1")
        .classed("path-finder panel-title title-text", true);
    let rightButtonDiv = panelTitleContainer
        .append("div")
        .classed("path-finder panel-button mod-next", true);
    let pathContainer = panelContainer
        .append("div")
        .classed("path-finder panel-display", true);
    let paths: Array<any> = [], index = 0;
    let calculationComplete = false;
    getAllPaths();

    async function getAllPaths() {
        for await (let path of nextPath) {
            paths.push(path);
            for (let u of path) {
                if (graph.getID(u) === undefined) graph.addVertice(u);
            }
            for (let i = 0; i < path.length - 1; i++) {
                graph.addEdgeExtended(path[i], path[i + 1], 1);
                graph.addEdgeExtended(path[i + 1], path[i], 1);
            }
            update();
            updatePathContent();
        }
        calculationComplete = true;
    }

    leftButtonDiv
        .on("click", function (evt, d) {
            index--;
            updatePathContent();
        })

    rightButtonDiv
        .on("click", function (evt, d) {
            index++;
            updatePathContent();
        })

    function update() {
        let nodes = getNodes(graph);
        let links = getLinks(graph);

        // Compute values.
        let N = d3.map(nodes, nodeId).map(intern);
        let LS = d3.map(links, linkSource).map(intern);
        let LT = d3.map(links, linkTarget).map(intern);
        let LG = d3.map(links, linkType).map(intern);
        if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
        let T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
        let G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
        // Compute default domains.
        if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
        // Construct the scales.
        let color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

        nodes = d3.map(nodes, (_, i) => ({ id: N[i], group: nodeGroup(_) }));
        links = d3.map(links, (_, i) => {
            existLink.set(`${LS[i]}|${LT[i]}`, true);
            return { source: LS[i], target: LT[i], type: LG[i] }
        });
        const old = new Map(node.data().map((d: Node) => [d.id, d]));
        nodes = nodes.map((d: Node) => Object.assign(old.get(d.id) || {}, d));
        links = links.map((d: Node) => Object.assign({}, d));

        node = node
            .data(nodes, (d: Node) => d.id)
            .join(
                enter => enter
                    .append("g")
                    .call(enter => enter
                        .append("circle")
                        .classed("node-circle", true)
                    )
                    .call(enter => enter
                        .append("text")
                        .attr("x", 0)
                        .attr("y", -30)
                        .attr("align", "center")
                        .text(d => nodeTitle(d))
                        .classed("node-text", true)
                    )
                    .call(enter => enter
                        .attr("fill", (d): any => color(nodeGroup(d)))
                    )
            )
            .classed("node", true)
            .classed("fixed", (d: Node) => d.fx !== undefined)
            .call(drag(simulation))
            .on("click", click)
            .on("mouseover", setSelection(true))
            .on("mouseout", setSelection(false))
        link = link
            .data(links, (d: Link) => `${d.source}|${d.target}`)
            .join("path")
            .classed("link", true)
            .attr("marker-end", `url(#arrow)`)

        const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
        if (linkStrength !== undefined) forceLink.strength(linkStrength);
        simulation.nodes(nodes);
        simulation.force("link", forceLink);
        simulation.alpha(1).restart().tick();
    }

    function updatePathContent() {
        let pathsLength = paths.length;
        if (index >= pathsLength) {
            if (!calculationComplete) {
                new Notice("No more paths available!");
            }
            else {
                new Notice("Still Calculating!");
            }
            index = pathsLength - 1;
        }
        if (index < 0) index = 0;
        panelTitle.text(`${index + 1}/${pathsLength}`);
        let path = paths[index];
        setNodeClass(node, "center", false);
        setNodeClass(node, "selected", false);
        setNodeClass(node, "unselected", false);
        setLinkClass(link, "center", false);
        setLinkClass(link, "selected", false);
        setLinkClass(link, "unselected", false);
        if (!panelContainer.classed("is-close")) {
            let nodeMap = new Map();
            for (let x of path) nodeMap.set(x, true);
            let linkMap = new Map();
            for (let i = 0; i < path.length - 1; i++) {
                linkMap.set(`${path[i]}|${path[i + 1]}`, true);
            }
            setSelectedPath(nodeMap, linkMap, true);
        }
        panelContainer
            .on("mouseover", () => {
                if (!panelContainer.classed("is-close")) {
                    let nodeMap = new Map();
                    for (let x of path) nodeMap.set(x, true);
                    let linkMap = new Map();
                    for (let i = 0; i < path.length - 1; i++) {
                        linkMap.set(`${path[i]}|${path[i + 1]}`, true);
                    }
                    setSelectedPath(nodeMap, linkMap, true);
                }
            })
            .on("mouseout", () => {
                if (!panelContainer.classed("is-close")) {
                    let nodeMap = new Map();
                    for (let x of path) nodeMap.set(x, true);
                    let linkMap = new Map();
                    for (let i = 0; i < path.length - 1; i++) {
                        linkMap.set(`${path[i]}|${path[i + 1]}`, true);
                    }
                    setSelectedPath(nodeMap, linkMap, false);
                }
            })
        pathContainer
            .selectAll("div.path-finder.panel-display.path-item")
            .remove();
        pathContainer
            .selectAll("div.path-finder.panel-display.path-item")
            .data(path)
            .enter()
            .append("div")
            .classed("path-finder panel-display path-item", true)
            .text((d) => nodeTitle({ id: d }))
            .on("mouseover", function (evt: any, u: any) {
                setNodeClass(node
                    .filter((d: Node) => {
                        let v = d.id;
                        return u === v;
                    }), "center", true);
                d3.select(this)
                    .classed("selected", true)
            })
            .on("mouseout", function (evt: any, u: any) {
                setNodeClass(node
                    .filter((d: Node) => {
                        let v = d.id;
                        return u === v;
                    }), "center", false);
                d3.select(this)
                    .classed("selected", false);
            });
    }

    function setSelectedPath(nodeMap: Map<any, boolean>, linkMap: Map<any, boolean>, flag: boolean) {
        setNodeClass(node
            .filter((d: Node) => {
                return nodeMap.get(d.id);
            }), "selected", flag);
        setNodeClass(node
            .filter((d: Node) => {
                return !nodeMap.get(d.id);
            }), "unselected", flag);
        setLinkClass(link
            .filter((d: Link) => {
                return linkMap.get(`${d.source.id}|${d.target.id}`) ||
                    linkMap.get(`${d.target.id}|${d.source.id}`);
            }), "selected", flag);
        setLinkClass(link
            .filter((d: Link) => {
                return !(linkMap.get(`${d.source.id}|${d.target.id}`) ||
                    linkMap.get(`${d.target.id}|${d.source.id}`));
            }), "unselected", flag);
    }

    let graphContainerNode: HTMLDivElement = graphContainer.node();
    let panelContainerNode: HTMLDivElement = panelContainer.node();
    container.appendChild(graphContainerNode);
    container.appendChild(panelContainerNode);

    const closeButton = panelContainerNode.createDiv();
    closeButton.addClasses([
        "path-finder",
        "panel-button",
        "mod-close"
    ]);
    setIcon(closeButton, "cross", 20);
    closeButton.style.display = "none";
    closeButton.onClickEvent(function (evt) {
        this.style.display = "none";
        panelContainerNode.toggleClass("is-close", true);
        let path = paths[index];
        let nodeMap = new Map();
        for (let x of path) nodeMap.set(x, true);
        let linkMap = new Map();
        for (let i = 0; i < path.length - 1; i++) {
            linkMap.set(`${path[i]}|${path[i + 1]}`, true);
        }
        setSelectedPath(nodeMap, linkMap, false);
    })
    closeButton.setAttribute("aria-label", "Close");

    const openButton = panelContainerNode.createDiv();
    openButton.addClasses([
        "path-finder",
        "panel-button",
        "mod-open"
    ]);
    setIcon(openButton, "right-triangle", 20);
    openButton.onClickEvent(function (evt) {
        panelContainerNode.toggleClass("is-close", false);
        closeButton.style.display = "flex";
    })
    openButton.setAttribute("aria-label", "Open");

    panelContainerNode.addEventListener("mouseenter", function (evt) {
        if (!this.hasClass("is-close"))
            closeButton.style.display = "flex";
    })
    panelContainerNode.addEventListener("mouseleave", function (evt) {
        if (!this.hasClass("is-close"))
            closeButton.style.display = "none";
    })

    const leftButtonContainer = leftButtonDiv.node();
    setIcon(leftButtonContainer, "left-arrow", 20);
    const rightButtonContainer = rightButtonDiv.node();
    setIcon(rightButtonContainer, "right-arrow", 20);
}