import { DistrictStatsRecord, get as getCzDistricts } from '../api/czDistricts';

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { AppThunk, RootState } from './store';

const DEFAULT_REGION = 'CZ064'; // Jihomoravský kraj
const DEFAULT_DISTRICT = 'CZ0642'; // Brno-město

export enum DataView {
  Country = 'country',
  Region = 'region',
  District = 'district',
}

const DAY_MS = 1000 * 60 * 60 * 24;

type TimeInterval = {
  id: string;
  label: string;
  milliseconds: number;
};

export const TIME_INTERVALS: TimeInterval[] = [
  { id: '7days', label: '7 dní', milliseconds: 7 * DAY_MS },
  { id: '14days', label: '14 dní', milliseconds: 14 * DAY_MS },
  { id: '30days', label: '30 dní', milliseconds: 30 * DAY_MS },
  { id: 'all', label: 'vše', milliseconds: 1000000 * DAY_MS },
];

interface State {
  // Main data
  rawData: DistrictStatsRecord[];

  // Persistent settings
  dataView: DataView;
  regionCode: string;
  districtCode: string;
  timeIntervalMs: number;

  // Temporary settings
  needle: Date;
}

const initialState: State = {
  // Main data
  rawData: [],

  // Persistent settings
  dataView:
    (window.localStorage.getItem('dataView') as DataView) || DataView.Region,
  regionCode: window.localStorage.getItem('regionCode') || DEFAULT_REGION,
  districtCode: window.localStorage.getItem('districtCode') || DEFAULT_DISTRICT,
  timeIntervalMs:
    parseInt(window.localStorage.getItem('timeIntervalMs') || '') ||
    TIME_INTERVALS.find(({ id }) => id === '14days')!.milliseconds,

  // Temporary settings
  needle: new Date(),
};

export const rootSlice = createSlice({
  name: 'root',
  initialState,
  reducers: {
    fetchDataSuccess: (state, action: PayloadAction<DistrictStatsRecord[]>) => {
      state.rawData = action.payload;
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
    setTimeIntervalMs: (state, action: PayloadAction<number>) => {
      state.timeIntervalMs = action.payload;
    },
    setNeedle: (state, action: PayloadAction<Date>) => {
      state.needle = action.payload;
    },
  },
});

export const {
  setDistrictCode,
  setRegionCode,
  switchDataView,
  setNeedle,
  setTimeIntervalMs,
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
export const selectTimeIntervalMs = (state: RootState) =>
  state.root.timeIntervalMs;
export const selectNeedle = (state: RootState) => state.root.needle;

const TODAY = new Date();

export interface DistrictStatsComputed extends DistrictStatsRecord {
  activeCount: number;
}

export const groupByRegion = (items: DistrictStatsRecord[]) => {
  const groups: Record<string, DistrictStatsRecord> = {};
  items.forEach((item) => {
    const key = `${item.date.getUTCFullYear()}-${item.date.getUTCMonth()}-${item.date.getUTCDate()}_${
      item.region
    }`;
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

  const newItems: DistrictStatsRecord[] = [];
  Object.keys(groups).forEach((groupId) => newItems.push(groups[groupId]));
  return newItems;
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
  selectTimeIntervalMs,
  (rawData, dataView, regionCode, districtCode, timeIntervalMs) => {
    return rawData.filter((x) => {
      return (
        ((dataView === DataView.District && x.district === districtCode) ||
          (dataView === DataView.Region && x.region === regionCode)) &&
        TODAY.getTime() - x.date.getTime() <= timeIntervalMs
      );
    });
  }
);

export default rootSlice.reducer;
