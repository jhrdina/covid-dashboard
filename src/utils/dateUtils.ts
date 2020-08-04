export const formatIsoDate = (year: number, month: number, date: number) =>
  `${year}-${month < 10 ? '0' : ''}${month}-${date < 10 ? '0' : ''}${date}`;

/** 1.2.2020 -> 2020-02-01 */
export const normalizeDate = (origDate: string) => {
  const [date, month, year] = origDate.split('.');
  return formatIsoDate(parseInt(year), parseInt(month), parseInt(date));
};

export const dateToIsoDate = (date: Date) =>
  formatIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
