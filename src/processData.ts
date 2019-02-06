export type AdjList = { [vertex: string]: string[] };

export enum sort {
  "count",
  "alpha"
}

type Interactor = {
  id: string;
};

type Entry = {
  accession: string;
  interactions: Interactor[];
};

export class Graph {
  adjList: AdjList = {};

  addVertex = (vertex: string) => {
    this.adjList[vertex] = [];
  };

  addEdge = (vertex1: string, vertex2: string) => {
    if (
      typeof this.adjList[vertex1] !== "undefined" &&
      typeof this.adjList[vertex2] !== "undefined"
    ) {
      this.adjList[vertex1].push(vertex2);
      this.adjList[vertex2].push(vertex1);
    }
  };

  doesInteract = (vertex1: string, vertex2: string) => {
    return this.adjList[vertex1].includes(vertex2);
  };

  getNodes() {
    return Object.keys(this.adjList).map(d => {
      return {
        id: d
      };
    });
  }

  getEdges() {
    const nodes = Object.keys(this.adjList);
    const edges = nodes.map((acc, i) =>
      this.adjList[acc].map(id => {
        return {
          source: i,
          target: nodes.lastIndexOf(id)
        };
      })
    );
    return edges.flat(2);
  }

  printGraph = () => {
    console.log(this.adjList);
  };
}

const processData = (data: any[]) => {
  const graph = new Graph();
  data.forEach(resArray => {
    resArray.forEach((entry: Entry) => {
      graph.addVertex(entry.accession);
      entry.interactions.forEach(interactor => {
        graph.addEdge(entry.accession, interactor.id);
      });
    });
  });
  return graph;
};

const sortData = (data: AdjList, attribute: sort) => {
  switch (attribute) {
    case sort.count:
      return Object.keys(data)
        .sort((a, b) => {
          return data[b].length - data[a].length;
        })
        .reduce((a, v) => {
          a[v] = data[v];
          return a;
        }, {});
    case sort.alpha:
      return Object.keys(data)
        .sort()
        .reduce((a, v) => {
          a[v] = data[v];
          return a;
        }, {});
    default:
      return data;
  }
};

export { processData, sortData };
