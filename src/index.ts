import { LitElement, html, svg } from "lit-element";
import * as scale from "d3-scale";
import * as chromatic from "d3-scale-chromatic";
import { fetchData, getJson } from "./fetchData";
import { processData, Graph, sortData, sort } from "./processData";
import ForceGraph from "./forceGraph";
import "./sideGraphComponent";
import { SideGraphType, SideGraphOrientation } from "./sideGraphComponent";

enum Visualisation {
  force,
  adjacency
}

class MultiInteraction extends LitElement {
  width = 1000;
  height = 1000;
  margin = 100;
  fontSize = 10;
  forceGraph: ForceGraph;

  colorScale = chromatic.schemeAccent;

  // Properties
  proteins: string = "";
  proteinList: string[] = [];
  graph: Graph = new Graph();
  sort: sort = sort.count;
  visualisation: Visualisation = Visualisation.force;

  static get properties() {
    return {
      proteins: { type: String },
      graph: {},
      sort: {},
      visualisation: {}
    };
  }

  constructor() {
    super();
    this.forceGraph = new ForceGraph(this.width);
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

  changeSortOrder = () => {
    this.sort = sort[this.sort + 1] ? this.sort + 1 : this.sort - 1;
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
      <div class="adjacency-grid">
        <div></div>
        <div>
          <side-graph-component
            size="${this.width}"
            width="${this.margin}"
            proteins="${Object.keys(sortedList).join(",")}"
            type="${SideGraphType.diseases}"
            orientation="${SideGraphOrientation.horizontal}"
          ></side-graph-component>
        </div>
        <div>
          <side-graph-component
            size="${this.width}"
            width="${this.margin}"
            proteins="${Object.keys(sortedList).join(",")}"
            type="${SideGraphType.pathways}"
            orientation="${SideGraphOrientation.vertical}"
          ></side-graph-component>
        </div>
        <div>
          <svg
            width="${this.width}"
            height="${this.height}"
            id="adjacency-graph"
          >
            <g>
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
                ><title>${item}:${interactor}</title></rect>`;
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
        </div>
      </div>
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
        .adjacency-grid {
          margin-top: 2em;
          display: grid;
          grid-template-columns: ${this.margin}px ${this.width}px;
        }
      </style>
      <div>
        <button @click="${e => this.handleSwitchClick(Visualisation.force)}">
          Force directed graph
        </button>
        <button
          @click="${e => this.handleSwitchClick(Visualisation.adjacency)}"
        >
          Adjacency graph
        </button>
        <button @click="${this.changeSortOrder}">Change sort</button>
      </div>
      <div>
        ${this.visualisation === Visualisation.adjacency
          ? this.renderAdjacencyGraph()
          : ""}
        ${this.visualisation === Visualisation.force
          ? this.forceGraph.renderForceGraph()
          : ""}
      </div>
    `;
  }

  handleSwitchClick = (type: Visualisation) => {
    this.visualisation = type;
  };
}

customElements.define("multi-interaction", MultiInteraction);
