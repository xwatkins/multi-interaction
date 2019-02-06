import { LitElement, html, property, svg } from "lit-element";
import * as d3Select from "d3-selection";
import * as scale from "d3-scale";
import * as force from "d3-force";
import * as chromatic from "d3-scale-chromatic";
import * as d3Drag from "d3-drag";
import { fetchData, getJson } from "./fetchData";
import { processData, Graph, sortData, sort } from "./processData";

class MultiInteraction extends LitElement {
  margin = { top: 80, right: 10, bottom: 10, left: 80 };
  width = 1300;
  height = 1300;
  fontSize = 10;

  colorScale = chromatic.schemeAccent;
  nodes = [];
  links = [];
  node;
  link;
  simulation;

  // @property()
  proteins: string = "";

  // @property()
  proteinList: string[] = [];

  // @property()
  graph: Graph = new Graph();

  // @property()
  sort: sort = sort.count;

  static get properties() {
    return {
      proteins: { type: String },
      graph: {},
      sort: {}
    };
  }

  constructor() {
    super();
    // this.randomize();
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.proteins) {
      this.proteinList = this.proteins.split(",");
      const data = await fetchData(this.proteinList);
      const jsonData = await getJson(data);
      this.graph = processData(jsonData);
    }
  }

  randomize = () => {
    setTimeout(() => {
      this.sort = sort[this.sort + 1] ? this.sort + 1 : this.sort - 1;
      this.randomize();
    }, 5000);
  };

  getColor = (accession: string, interactor?: string) => {
    if (
      (!interactor && this.proteinList.includes(accession)) ||
      (interactor &&
        this.proteinList.includes(accession) &&
        this.proteinList.includes(interactor))
    ) {
      return this.colorScale[6];
    } else {
      return this.colorScale[4];
    }
  };

  renderAdjacencyGraph = () => {
    const { adjList } = this.graph;
    if (typeof adjList === "undefined") {
      return;
    }

    const sortedList = sortData(adjList, this.sort);

    const x = scale
      .scaleBand()
      .range([0, this.width])
      .domain(Object.keys(sortedList));

    return html`
      <svg
        width="${this.width + this.margin.left + this.margin.right}"
        height="${this.height + this.margin.top + this.margin.bottom}"
        id="adjacency-graph"
      >
        <g transform="translate(${this.margin.left},${this.margin.top})">
          <rect
            class="background"
            width="${this.width}"
            height="${this.height}"
          />
          ${Object.keys(sortedList).map(item => {
            return svg`
            <g transform="translate(0, ${x(item)})">
              <line x2="${this.width}"></line>
              ${sortedList[item].map(interactor => {
                return svg`<rect x="${x(
                  interactor
                )}" width="${x.bandwidth()}" height="${x.bandwidth()}"
                style="fill: ${this.getColor(item, interactor)}"
                />`;
              })}
              <text class="axis" dy=".65em" text-anchor="end" style="display:${
                this.fontSize <= x.bandwidth() ? "block" : "none"
              }">${item}</text
            >

            </g>
            <g transform="translate(${x(item)})rotate(-90)">
              <line x1="-${this.width}"></line>
              <text class="axis" dy=".65em" text-anchor="start" style="display:${
                this.fontSize <= x.bandwidth() ? "block" : "none"
              }">${item}</text
          >
            </g>
            `;
          })}
        </g>
      </svg>
    `;
  };

  initForceDisplay = () => {
    const svg = d3Select.select(this.shadowRoot.querySelector("#force-graph"));
    // set the data and properties of link lines
    this.link = svg
      .append("g")
      .selectAll("line")
      .data(this.links)
      .enter()
      .append("line");

    // set the data and properties of node circles
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
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      })
      .attr("stroke", this.colorScale[2])
      .attr("stroke-width", 1);

    this.node
      .attr("r", 5)
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("fill", this.colorScale[4]);

    this.node.append("title").text(d => d.id);
  };

  renderForceGraph = () => {
    return html`
      <svg
        id="force-graph"
        width="${this.width + this.margin.left + this.margin.right}"
        height="${this.height + this.margin.top + this.margin.bottom}"
      ></svg>
    `;
  };

  updated() {
    this.nodes = this.graph.getNodes();
    this.links = this.graph.getEdges();
    this.simulation = force
      .forceSimulation(this.nodes)
      .force("link", force.forceLink().links(this.links))
      .force("charge", force.forceManyBody())
      .force("center", force.forceCenter(this.width / 2, this.height / 2))
      .on("tick", this.ticked);
    this.initForceDisplay();
  }

  render() {
    return html`
      <style>
        :host {
          font-family: Arial, Helvetica, sans-serif;
        }
        .axis {
          font-size: ${this.fontSize}px;
        }
        #adjacency-graph line {
          stroke: #fff;
        }
        .background {
          fill: #f1f1f1;
        }
      </style>
      ${this.renderAdjacencyGraph()} ${this.renderForceGraph()}
    `;
  }
}

customElements.define("multi-interaction", MultiInteraction);
