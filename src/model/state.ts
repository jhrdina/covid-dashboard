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
  },
});

export const {
  setDistrictCode,
  setRegionCode,
  switchDataView,
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

const TODAY = new Date();

export interface DistrictStatsComputed extends DistrictStatsRecord {
  activeCount: number;
}

export const select = (state: RootState) => state.root;
export const selectDataForGraph = createSelector(
  selectRawData,
  selectDataView,
  selectRegionCode,
  selectDistrictCode,
  selectTimeIntervalMs,
  (rawData, dataView, regionCode, districtCode, timeIntervalMs) => {
    let filtered = rawData.filter((x) => {
      return (
        ((dataView === DataView.District && x.district === districtCode) ||
          (dataView === DataView.Region && x.region === regionCode)) &&
        TODAY.getTime() - x.date.getTime() <= timeIntervalMs
      );
    });

    if (dataView === DataView.Region) {
      // Group by region
      const groups: Record<string, DistrictStatsRecord> = {};
      filtered.forEach((item) => {
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
      console.log(groups);
      filtered = [];
      Object.keys(groups).forEach((groupId) => filtered.push(groups[groupId]));
    }

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

export default rootSlice.reducer;
