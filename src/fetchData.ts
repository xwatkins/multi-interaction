const url = "https://www.ebi.ac.uk/proteins/api/proteins/interaction/";

const getJson = async (responses: any[]) => {
  const promises = responses.map(res => res.json());
  return Promise.all(promises);
};

const fetchData = async (accessions: string[]) => {
  const promises = accessions.map(accession =>
    fetch(`${url}${accession}.json`)
  );
  return Promise.all(promises);
};

export { getJson, fetchData };
