import { html } from "lit-element";
import * as d3Select from "d3-selection";
import * as force from "d3-force";
import * as d3Drag from "d3-drag";
import * as chromatic from "d3-scale-chromatic";

class ForceGraph {
  width: number;
  nodes = [];
  edges = [];
  link;
  node;
  simulation;
  colorScale = chromatic.schemeAccent;

  constructor(width: number) {
    this.width = width;
  }

  initForceDisplay = shadowRoot => {
    const svg = d3Select.select(shadowRoot.querySelector("#force-graph"));
    // link lines
    this.link = svg
      .append("g")
      .selectAll("line")
      .data(this.edges)
      .enter()
      .append("line");

    // node circles
    this.node = svg
      .append("g")
      .selectAll("circle")
      .data(this.nodes)
      .enter()
      .append("circle");

    this.node.call(
      d3Drag
        .drag()
        .on("start", this.dragstarted)
        .on("drag", this.dragged)
        .on("end", this.dragended)
    );

    this.node.exit().remove();
    this.link.exit().remove();
  };

  dragstarted = d => {
    if (!d3Select.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  };

  dragged = d => {
    d.fx = d3Select.event.x;
    d.fy = d3Select.event.y;
  };

  dragended = d => {
    if (!d3Select.event.active) this.simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
  };

  ticked = () => {
    this.link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", this.colorScale[2])
      .attr("stroke-width", 1);

    this.node
      .attr("r", 5)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("fill", this.colorScale[4]);

    this.node.append("title").text(d => d.id);
  };

  update = (nodes, links) => {
    this.nodes = nodes;
    this.edges = links;
    this.simulation = force
      .forceSimulation(this.nodes)
      .force("link", force.forceLink().links(this.edges))
      .force("charge", force.forceManyBody())
      .force("center", force.forceCenter(this.width / 2, this.width / 2))
      .on("tick", this.ticked);
  };

  renderForceGraph = () => {
    return html`
      <svg id="force-graph" width="${this.width}" height="${this.width}"></svg>
    `;
  };
}

export default ForceGraph;
