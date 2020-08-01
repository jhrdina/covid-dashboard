export const toJson = <T = any>(response: Response): Promise<T> =>
  response.json();

export const mzcrUrl = (resource: string) =>
  `https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/${resource}.min.json`;
