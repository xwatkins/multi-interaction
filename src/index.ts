import { LitElement, html, svg } from "lit-element";
import * as d3Select from "d3-selection";
import * as scale from "d3-scale";
import { fetchData, getJson } from "./fetchData";
import { processData, AdjList } from "./processData";

class MultiInteraction extends LitElement {
  margin = { top: 80, right: 10, bottom: 10, left: 80 };
  width = 1200;
  height = 1200;

  proteins: string = "";
  proteinList: string[] = [];
  graph: { adjList: AdjList } = { adjList: {} };

  static get properties() {
    return {
      proteins: { type: String },
      graph: {}
    };
  }

  constructor() {
    super();
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

  getColor = (accession: string, interactor?: string) => {
    if (
      (!interactor && this.proteinList.includes(accession)) ||
      (interactor &&
        this.proteinList.includes(accession) &&
        this.proteinList.includes(interactor))
    ) {
      return "rgb(31, 119, 180)";
    } else {
      return "rgb(127, 127, 127)";
    }
  };

  render() {
    if (Object.keys(this.graph).length <= 0) {
      return;
    }
    const x = scale
      .scaleBand()
      .range([0, this.width])
      .domain(Object.keys(this.graph.adjList));

    return html`
      <style>
        html {
          font-family: Arial, Helvetica, sans-serif;
        }
        .axis {
          font-size: 10px;
        }
        line {
          stroke: #fff;
        }
        .background {
          fill: #eee;
        }
      </style>
      <svg
        width="${this.width + this.margin.left + this.margin.right}"
        height="${this.height + this.margin.top + this.margin.bottom}"
      >
        <g transform="translate(${this.margin.left},${this.margin.top})">
          <rect
            class="background"
            width="${this.width}"
            height="${this.height}"
          />
          ${Object.keys(this.graph.adjList).map(item => {
            return svg`
            <g transform="translate(0, ${x(item)})">
              <line x2="${this.width}"></line>
              ${this.graph.adjList[item].map(interactor => {
                return svg`<rect x="${x(
                  interactor
                )}" width="${x.bandwidth()}" height="${x.bandwidth()}"
                style="fill: ${this.getColor(item, interactor)}"
                />`;
              })}
              <text class="axis" dy=".65em" text-anchor="end" style="fill:${this.getColor(
                item
              )}"
              >${item}</text
            >

            </g>
            <g transform="translate(${x(item)})rotate(-90)">
              <line x1="-${this.width}"></line>
              <text class="axis" dy=".65em" text-anchor="start" style="fill:${this.getColor(
                item
              )}"
            >${item}</text
          >
            </g>
            `;
          })}
        </g>
      </svg>
    `;
  }
}

customElements.define("multi-interaction", MultiInteraction);
