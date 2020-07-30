export const toJson = <T = any>(response: Response): Promise<T> =>
  response.json();
