import { toJson, mzcrUrl } from './runtime';
import DistrictStatsRecord from '../model/DistrictStatsRecord';

interface MzcrResponse<T> {
  data: T[];
}

interface PersonRecord {
  datum: string;
  kraj_nuts_kod: string;
  okres_lau_kod: string;
  pohlavi: 'M' | 'Z';
  vek: number;
}

interface AbroadInfectionMixin {
  nakaza_v_zahranici: boolean;
  nakaza_zeme_csu_kod: string;
}

/** 1.2.2020 -> 2020-2-1 */
const normalizeDate = (origDate: string) => {
  const [date, month, year] = origDate.split('.');
  return `${year}-${parseInt(month) < 10 ? '0' : ''}${month}-${
    parseInt(date) < 10 ? '0' : ''
  }${date}`;
};

const incrementField = (
  grouped: Record<string, DistrictStatsRecord>,
  {
    district,
    region,
    isoDate,
    field,
  }: {
    district: string;
    region: string;
    isoDate: string;
    field: keyof DistrictStatsRecord;
  }
) => {
  const groupKey = `${district}_${isoDate}`;
  if (!grouped[groupKey]) {
    grouped[groupKey] = {
      date: new Date(isoDate),
      infectedCount: 0,
      curedCount: 0,
      deathCount: 0,
      district: district,
      region: region,
    };
  }
  grouped[groupKey][field]++;
};

export const get = (): Promise<DistrictStatsRecord[]> =>
  Promise.all([
    fetch(mzcrUrl('osoby')).then(toJson),
    fetch(mzcrUrl('vyleceni')).then(toJson),
    fetch(mzcrUrl('umrti')).then(toJson),
  ]).then(
    ([{ data: osoby }, { data: vyleceni }, { data: umrti }]: [
      MzcrResponse<PersonRecord & AbroadInfectionMixin>,
      MzcrResponse<PersonRecord>,
      MzcrResponse<PersonRecord>
    ]) => {
      const groupedByDateDistrict: Record<string, DistrictStatsRecord> = {};

      const datasetToIncrementedField: [
        PersonRecord[],
        keyof DistrictStatsRecord
      ][] = [
        [osoby, 'infectedCount'],
        [vyleceni, 'curedCount'],
        [umrti, 'deathCount'],
      ];

      datasetToIncrementedField.forEach(([personList, fieldToIncrement]) => {
        personList.forEach((person) => {
          incrementField(groupedByDateDistrict, {
            district: person.okres_lau_kod,
            region: person.kraj_nuts_kod,
            isoDate: normalizeDate(person.datum),
            field: fieldToIncrement,
          });
        });
      });

      let flattened = Object.values(groupedByDateDistrict).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      const groupedByDistrict: Record<string, DistrictStatsRecord[]> = {};
      flattened.forEach((record) => {
        if (!groupedByDistrict[record.district]) {
          groupedByDistrict[record.district] = [];
        }

        const districtRecords = groupedByDistrict[record.district];
        if (districtRecords.length > 1) {
          const prevRecord = districtRecords[districtRecords.length - 1];
          record.infectedCount += prevRecord.infectedCount;
          record.curedCount += prevRecord.curedCount;
          record.deathCount += prevRecord.deathCount;
        }
        districtRecords.push(record);
      });

      // if (flattened.length > 1) {
      //   for (let i = 1; i < flattened.length; i++) {
      //     flattened[i].infectedCount += flattened[i - 1].infectedCount;
      //     flattened[i].curedCount += flattened[i - 1].curedCount;
      //     flattened[i].deathCount += flattened[i - 1].deathCount;
      //   }
      // }

      return flattened;
    }
  );
