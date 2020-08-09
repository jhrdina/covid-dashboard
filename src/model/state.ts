import { get as getCzDistricts } from '../api/czDistrictsBig';

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { AppThunk, RootState } from './store';
import DistrictStatsRecord from './DistrictStatsRecord';
import today from '../utils/today';
import { DAY_MS } from '../utils/constants';
import { dateToIsoDate } from '../utils/dateUtils';

const DEFAULT_REGION = 'CZ064'; // Jihomoravský kraj
const DEFAULT_DISTRICT = 'CZ0642'; // Brno-město

export enum DataView {
  Country = 'country',
  Region = 'region',
  District = 'district',
}

type TimeInterval = {
  id: string;
  label: string;
  days: number;
};

export const TIME_INTERVALS: TimeInterval[] = [
  { id: '14days', label: '14 dní', days: 14 },
  { id: '30days', label: '30 dní', days: 30 },
  { id: '60days', label: '60 dní', days: 60 },
  { id: 'all', label: 'vše', days: 1000000 },
];

interface State {
  // Main data
  rawData: DistrictStatsRecord[];

  // Persistent settings
  dataView: DataView;
  regionCode: string;
  districtCode: string;
  timeIntervalDays: number;

  // Temporary settings
  needle: Date;
  loaded: boolean;
}

const initialState: State = {
  // Main data
  rawData: [],

  // Persistent settings
  dataView:
    (window.localStorage.getItem('dataView') as DataView) || DataView.Region,
  regionCode: window.localStorage.getItem('regionCode') || DEFAULT_REGION,
  districtCode: window.localStorage.getItem('districtCode') || DEFAULT_DISTRICT,
  timeIntervalDays:
    parseInt(window.localStorage.getItem('timeIntervalDays') || '') ||
    TIME_INTERVALS.find(({ id }) => id === '30days')!.days,

  // Temporary settings
  needle: new Date(0),
  loaded: false,
};

export const rootSlice = createSlice({
  name: 'root',
  initialState,
  reducers: {
    fetchDataSuccess: (state, action: PayloadAction<DistrictStatsRecord[]>) => {
      state.rawData = action.payload;

      let maxTimestamp = 0;
      action.payload.forEach((item) => {
        if (item.date.getTime() > maxTimestamp) {
          maxTimestamp = item.date.getTime();
        }
      });
      state.needle = new Date(maxTimestamp);
      state.loaded = true;
    },
    setDistrictCode: (state, action: PayloadAction<string>) => {
      state.districtCode = action.payload;
    },
    setRegionCode: (state, action: PayloadAction<string>) => {
      state.regionCode = action.payload;
    },
    switchDataView: (state, action: PayloadAction<DataView>) => {
      state.dataView = action.payload;
    },
    setTimeIntervalDays: (state, action: PayloadAction<number>) => {
      state.timeIntervalDays = action.payload;
    },
    setNeedle: (state, action: PayloadAction<Date>) => {
      state.needle = action.payload;
    },
  },
});

export const getItemsToPersist = ({
  dataView,
  regionCode,
  districtCode,
  timeIntervalDays,
}: State) =>
  ({
    dataView,
    regionCode,
    districtCode,
    timeIntervalDays,
  } as any);

export const {
  setDistrictCode,
  setRegionCode,
  switchDataView,
  setNeedle,
  setTimeIntervalDays,
} = rootSlice.actions;

export const fetchDataAsync = (): AppThunk => (dispatch) => {
  getCzDistricts().then((data) =>
    dispatch(rootSlice.actions.fetchDataSuccess(data))
  );
};

// Selectors

export const selectRawData = (state: RootState) => state.root.rawData;
export const selectDataView = (state: RootState) => state.root.dataView;
export const selectRegionCode = (state: RootState) => state.root.regionCode;
export const selectDistrictCode = (state: RootState) => state.root.districtCode;
export const selectTimeIntervalDays = (state: RootState) =>
  state.root.timeIntervalDays;
export const selectNeedle = (state: RootState) => state.root.needle;

const TODAY = today();

export interface DistrictStatsComputed extends DistrictStatsRecord {
  activeCount: number;
}

export const groupByRegion = (items: DistrictStatsRecord[]) => {
  const groups: Record<string, DistrictStatsRecord> = {};
  items.forEach((item) => {
    const key = `${dateToIsoDate(item.date)}_${item.region}`;
    if (!groups[key]) {
      groups[key] = { ...item, district: '' };
    } else {
      const existing = groups[key];
      groups[key] = {
        ...existing,
        curedCount: existing.curedCount + item.curedCount,
        deathCount: existing.deathCount + item.deathCount,
        infectedCount: existing.infectedCount + item.infectedCount,
      };
    }
  });

  return Object.values(groups);
};

export const getMaxActiveCount = (items: DistrictStatsComputed[]) => {
  let maxActiveCount = 0;
  items.forEach((x) => {
    if (x.activeCount > maxActiveCount) {
      maxActiveCount = x.activeCount;
    }
  });
  return maxActiveCount;
};

export const select = (state: RootState) => state.root;

export const selectDataWithDataView = createSelector(
  selectRawData,
  selectDataView,
  (rawData, dataView) => {
    let filtered =
      dataView === DataView.Region ? groupByRegion(rawData) : rawData;

    return filtered.map(
      (x): DistrictStatsComputed => {
        return {
          ...x,
          activeCount: x.infectedCount - x.deathCount - x.curedCount,
        };
      }
    );
  }
);

export const selectMaxActiveCount = createSelector(
  selectDataWithDataView,
  (data) => getMaxActiveCount(data)
);

export const selectDataForMap = createSelector(
  selectDataWithDataView,
  selectNeedle,
  (data, needle) => data.filter((x) => x.date.getTime() === needle.getTime())
);

export const selectDataForGraph = createSelector(
  selectDataWithDataView,
  selectDataView,
  selectRegionCode,
  selectDistrictCode,
  selectTimeIntervalDays,
  (rawData, dataView, regionCode, districtCode, timeIntervalDays) => {
    return rawData.filter((x) => {
      return (
        ((dataView === DataView.District && x.district === districtCode) ||
          (dataView === DataView.Region && x.region === regionCode)) &&
        TODAY.getTime() - x.date.getTime() <= timeIntervalDays * DAY_MS
      );
    });
  }
);

export default rootSlice.reducer;
