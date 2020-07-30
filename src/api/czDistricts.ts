import { toJson } from './runtime';

const mzcrUrl = (resource: string) =>
  `https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/${resource}.min.json`;

export interface DistrictStatsRecord {
  curedCount: number;
  date: Date;
  deathCount: number;
  district: string;
  infectedCount: number;
  region: string;
}

interface GetResponse {
  data: {
    datum: string;
    kraj_nuts_kod: string;
    kumulativni_pocet_nakazenych: number;
    kumulativni_pocet_umrti: number;
    kumulativni_pocet_vylecenych: number;
    okres_lau_kod: string;
  }[];
}

export const get = (): Promise<DistrictStatsRecord[]> =>
  fetch(mzcrUrl('kraj-okres-nakazeni-vyleceni-umrti'))
    .then(toJson)
    .then(({ data: rawItems }: GetResponse) => {
      const parsedItems: DistrictStatsRecord[] = [];
      rawItems.forEach((d) => {
        // const district = districtById(d.okres_lau_kod);
        // if (!district) {
        //   console.warn(`Couldn't find a district with ID ${d.okres_lau_kod}`);
        //   return;
        // }
        // const region = regionById(d.kraj_nuts_kod);
        // if (!region) {
        //   console.warn(`Couldn't find a region with ID ${d.kraj_nuts_kod}`);
        //   return;
        // }

        parsedItems.push({
          curedCount: d.kumulativni_pocet_vylecenych,
          date: new Date(d.datum),
          deathCount: d.kumulativni_pocet_umrti,
          district: d.okres_lau_kod,
          infectedCount: d.kumulativni_pocet_nakazenych,
          region: d.kraj_nuts_kod,
        });
      });

      return parsedItems;
    });
