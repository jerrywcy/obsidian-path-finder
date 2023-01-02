import * as d3 from 'd3'
import { getNextPath } from "src/algorithms/graph/getNextPath.ts"
import { setIcon } from "obsidian"

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
export function ForceGraphWithLabels(container, nextPath,
    {
        nodes, // an iterable of node objects (typically [{id}, …])
        links // an iterable of link objects (typically [{source, target}, …])
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
        linkSource = ({ source }) => source, // given d in links, returns a node identifier string
        linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
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
        linkType = ({ type }) => type
    } = {}) {
    let g = document.getElementsByClassName("view-content")[0],
        x = g.clientWidth,
        y = g.clientHeight;
    width = x, height = y;
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    const LG = d3.map(links, linkType).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    let existLink = new Map();
    nodes = d3.map(nodes, (_, i) => ({ id: N[i], group: nodeGroup(_) }));
    links = d3.map(links, (_, i) => {
        existLink.set(`${LS[i]}|${LT[i]}`, true);
        return { source: LS[i], target: LT[i], type: LG[i] }
    });

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

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

    const link = svg.append("g")
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

    const node = svg.append("g")
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
        .classed("fixed", d => d.fx !== undefined)
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

    function setSelection(flag) {
        return function (evt, from) {
            setNodeClass(node.filter(to => {
                let u = from.id, v = to.id;
                return existLink.get(`${u}|${v}`) || existLink.get(`${v}|${u}`);
            }), "selected", flag);
            setNodeClass(node.filter(to => {
                let u = from.id, v = to.id;
                return !(existLink.get(`${u}|${v}`) || existLink.get(`${v}|${u}`)) && u !== v;
            }), "unselected", flag);
            setNodeClass(d3.select(this), "center", flag);

            setLinkClass(link.filter(d => {
                return d.source.id == from.id || d.target.id == from.id;
            }), "selected", flag);
            setLinkClass(link.filter(d => {
                return !(d.source.id == from.id || d.target.id == from.id);
            }), "unselected", flag);
        }
    }

    function setNodeClass(selection, cls, flag = true) {
        selection
            .classed(cls, flag);
        selection
            .select("circle")
            .classed(cls, flag);
        selection
            .select("text")
            .classed(cls, flag);
    }

    function setLinkClass(selection, cls, flag = true) {
        selection
            .classed(cls, flag);
    }

    node.append("circle")
        .classed("node-circle", true);

    if (W) link.attr("stroke-width", ({ index: i }) => W[i]);
    if (L) link.attr("stroke", ({ index: i }) => L[i]);
    if (G) node.attr("fill", ({ index: i }) => color(G[i]));
    if (T)
        node.append("text")
            .attr("x", 0)
            .attr("y", -30)
            .attr("align", "center")
            .text(({ index: i }) => T[i])
            .classed("node-text", true);
    // .clone(true).lower()
    // .classed("outer", true);

    if (invalidation != null) invalidation.then(() => simulation.stop());

    simulation
        .on("tick", ticked);

    let zoom = d3.zoom();
    svg.call(d3.zoom()
        .filter((evt) => {
            return (!evt.ctrlKey && evt.type !== 'click') || evt.type === "mousedown";
        })
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", zoomed));
    const ratio = 0.8;
    svg.selectAll("g").attr("transform", `scale(${ratio})`)
    function zoomed({ transform }) {
        svg.selectAll("g").attr("transform", transform);
        simulation.alpha(1).restart();
    }

    function ticked() {
        link.attr("d", linkArc);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function linkArc(d) {
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

    function click(event, d) {
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

    function intern(value) {
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

    function clamp(x, lo, hi) {
        return x < lo ? lo : x > hi ? hi : x;
    }

    function drag(simulation) {
        function dragstarted(event, d) {
            d3.select(this)
                .classed("fixed", true);
            if (!event.active) simulation.alphaTarget(1).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = clamp(event.x, - Infinity, Infinity);
            d.fy = clamp(event.y, - Infinity, Infinity);
            simulation.alpha(1).restart();
        }

        function dragended(event, d) {
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
        .style("height", "calc(100%-80px)")
        .append("div")
        .classed("path-finder panel-display", true);
    let paths = [], index = 0;
    updatePathContent();

    leftButtonDiv
        .on("click", function (evt, d) {
            if (index > 0) index--;
            updatePathContent();
        })

    rightButtonDiv
        .on("click", function (evt, d) {
            index++;
            updatePathContent();
        })

    function updatePathContent() {
        if (index >= paths.length) {
            let res = nextPath.next();
            if (res.value === undefined) {
                new Notice("No more paths available!");
            }
            else {
                paths.push(res.value);
            }
            index = paths.length - 1;
        }
        if (index < 0) index = 0;
        panelTitle.text(`${index + 1}/${paths.length}`);
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
            .text(d => nodeTitle({ id: d }))
            .on("mouseover", function (evt, u) {
                setNodeClass(node
                    .filter(d => {
                        let v = d.id;
                        return u === v;
                    }), "center", true);
                d3.select(this)
                    .classed("selected", true)
            })
            .on("mouseout", function (evt, u) {
                setNodeClass(node
                    .filter(d => {
                        let v = d.id;
                        return u === v;
                    }), "center", false);
                d3.select(this)
                    .classed("selected", false);
            });
    }

    function setSelectedPath(nodeMap, linkMap, flag) {
        setNodeClass(node
            .filter((d) => {
                return nodeMap.get(d.id);
            }), "selected", flag);
        setNodeClass(node
            .filter((d) => {
                return !nodeMap.get(d.id);
            }), "unselected", flag);
        setLinkClass(link
            .filter((d) => {
                return linkMap.get(`${d.source.id}|${d.target.id}`) ||
                    linkMap.get(`${d.target.id}|${d.source.id}`);
            }), "selected", flag);
        setLinkClass(link
            .filter((d) => {
                return !(linkMap.get(`${d.source.id}|${d.target.id}`) ||
                    linkMap.get(`${d.target.id}|${d.source.id}`));
            }), "unselected", flag);
    }

    graphContainerNode = graphContainer.node();
    panelContainerNode = panelContainer.node();
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