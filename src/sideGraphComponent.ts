import { LitElement, html, svg } from "lit-element";
import * as d3Scale from "d3-scale";
import * as d3Chromatic from "d3-scale-chromatic";

export enum SideGraphType {
  pathways = "pathways",
  diseases = "diseases"
}

export enum SideGraphOrientation {
  vertical = "vertical",
  horizontal = "horizontal"
}

const typesIdMap = {
  pathways: "primaryId",
  diseases: "diseaseId"
};

class SideGraphComponent extends LitElement {
  data: any[] = [];
  size: number = 0;
  width: number = 100;
  proteins: string = "";
  type: SideGraphType = SideGraphType.pathways;
  orientation: SideGraphOrientation = SideGraphOrientation.vertical;

  constructor() {
    super();
  }

  static get properties() {
    return {
      data: {},
      scale: {},
      size: {},
      width: {},
      proteins: {},
      type: {},
      orientation: {}
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.proteins.length > 0) {
      const results = await fetch(this.getUrl(this.proteins));
      const json = await results.json();
      this.data = json.results;
    }
  }

  getUrl = (proteins: string) =>
    `http://wp-np2-be.ebi.ac.uk:8086/v1/ds/proteins/${proteins}/${this.type}`;

  invertAdjacencyList = (data: []) => {
    const inverseList = {};
    data
      .filter(d => d[this.type].length > 1)
      .forEach(protein => {
        protein[this.type].forEach(item => {
          inverseList[item[typesIdMap[this.type]]]
            ? inverseList[item[typesIdMap[this.type]]].push(protein.accession)
            : (inverseList[item[typesIdMap[this.type]]] = [protein.accession]);
        });
      });
    const filteredList = {};
    Object.keys(inverseList).forEach(item => {
      if (inverseList[item].length > 1) {
        filteredList[item] = inverseList[item];
      }
    });
    return filteredList;
  };

  render() {
    if (this.data.length <= 0) {
      return;
    }
    const data = this.invertAdjacencyList(this.data);

    // Check orientation
    let width = this.width;
    let height = this.size;
    let transform = "";
    if (this.orientation === SideGraphOrientation.horizontal) {
      width = this.size;
      height = this.width;
      transform = `translate(0,${height}) rotate(-90)`;
    }

    const graphScale = d3Scale
      .scaleBand()
      .range([0, this.width])
      .domain(Object.keys(data));

    const x = d3Scale
      .scaleBand()
      .range([0, this.size])
      .domain(this.proteins.split(","));

    const colours = d3Scale
      .scaleOrdinal(d3Chromatic.schemeCategory10)
      .domain(Object.keys(data));

    return html`
      <svg width="${width}" height="${height}">
        <g transform="${transform}">
          ${Object.keys(data).map(item =>
            data[item].map(
              d =>
                svg`<rect x="${graphScale(item)}" y="${x(
                  d
                )}" height="${x.bandwidth()}" width="${graphScale.bandwidth()}" style="fill:${colours(
                  item
                )}"><title>${item}</title></>`
            )
          )}
        </g>
      </svg>
    `;
  }
}

customElements.define("side-graph-component", SideGraphComponent);
