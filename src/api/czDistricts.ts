import { toJson, mzcrUrl } from './runtime';
import DistrictStatsRecord from '../model/DistrictStatsRecord';

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
