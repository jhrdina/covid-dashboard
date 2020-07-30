const indexBy = <T, K extends keyof T>(
  arr: Array<T>,
  keyName: K
): Record<K, T> => {
  const obj: any = {};
  arr.forEach((item) => {
    const key = item[keyName];
    obj[key] = item;
  });
  return obj;
};

export default indexBy;
