export type AdjList = { [vertex: string]: string[] };

type Interactor = {
  id: string;
};

type Entry = {
  accession: string;
  interactions: Interactor[];
};

class Graph {
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

export { processData };
