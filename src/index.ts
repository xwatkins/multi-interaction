import { LitElement, html, svg } from "lit-element";
import * as scale from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { fetchData, getJson } from "./fetchData";
import { processData, Graph, sortData, sort } from "./processData";
import ForceGraph from "./forceGraph";

class MultiInteraction extends LitElement {
  margin = { top: 80, right: 10, bottom: 10, left: 80 };
  width = 1300;
  height = 1300;
  fontSize = 10;
  forceGraph;

  colorScale = chromatic.schemeAccent;

  // Properties
  proteins: string = "";
  proteinList: string[] = [];
  graph: Graph = new Graph();
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
    this.forceGraph = new ForceGraph(this.width);
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

  updated() {
    this.forceGraph.update(this.graph.getNodes(), this.graph.getEdges());
    this.forceGraph.initForceDisplay(this.shadowRoot);
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
      ${this.renderAdjacencyGraph()} ${this.forceGraph.renderForceGraph()}
    `;
  }
}

customElements.define("multi-interaction", MultiInteraction);
