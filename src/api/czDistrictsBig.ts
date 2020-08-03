import { toJson, mzcrUrl } from './runtime';
import DistrictStatsRecord from '../model/DistrictStatsRecord';
import { all as allDistricts, getRegion } from '../model/district';
import today from '../utils/today';
import { DAY_MS } from '../utils/constants';

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
const formatIsoDate = (year: number, month: number, date: number) =>
  `${year}-${month < 10 ? '0' : ''}${month}-${date < 10 ? '0' : ''}${date}`;

const normalizeDate = (origDate: string) => {
  const [date, month, year] = origDate.split('.');
  return formatIsoDate(parseInt(year), parseInt(month), parseInt(date));
};

const dateToIsoDate = (date: Date) =>
  formatIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );

const makeKey = (items: string[]) => items.join('_');

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
  const groupKey = makeKey([district, isoDate]);
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
            isoDate:
              personList === umrti ? normalizeDate(person.datum) : person.datum,
            field: fieldToIncrement,
          });
        });
      });

      // Add intermediate records for each day
      // const groupedByDateDistrict: Record<string, DistrictStatsRecord> = {};
      const START_TIMESTAMP = new Date('2020-03-01').getTime();
      const startDate = new Date(START_TIMESTAMP);
      const startTimestampIsoDate = dateToIsoDate(startDate);

      // Make sure there is a record for every district at the first date
      allDistricts.forEach(({ id: districtId }) => {
        const groupKey = makeKey([districtId, startTimestampIsoDate]);
        if (!groupedByDateDistrict[groupKey]) {
          groupedByDateDistrict[groupKey] = {
            infectedCount: 0,
            curedCount: 0,
            deathCount: 0,
            date: startDate,
            district: districtId,
            region: getRegion(districtId),
          };
        }
      });

      // Go one date after another and
      // - fill missing records by copying numbers from previous days
      // - accumulate records with numbers
      for (
        let timestamp = START_TIMESTAMP + DAY_MS;
        timestamp <= today().getTime();
        timestamp += DAY_MS
      ) {
        const date = new Date(timestamp);
        allDistricts.forEach(({ id: districtId }) => {
          const prevRecord =
            groupedByDateDistrict[
              makeKey([districtId, dateToIsoDate(new Date(timestamp - DAY_MS))])
            ];

          const groupKey = makeKey([districtId, dateToIsoDate(date)]);
          if (groupedByDateDistrict[groupKey]) {
            // There was a change
            const record = groupedByDateDistrict[groupKey];
            record.infectedCount += prevRecord.infectedCount;
            record.curedCount += prevRecord.curedCount;
            record.deathCount += prevRecord.deathCount;
          } else {
            // Just copy the previous record
            groupedByDateDistrict[groupKey] = {
              ...prevRecord,
              date,
            };
          }
        });
      }

      let flattened = Object.values(groupedByDateDistrict).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      return flattened;
    }
  );
