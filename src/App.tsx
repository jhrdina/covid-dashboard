import React, { useCallback, useEffect } from 'react';
import DistrictsMap from './ui/CzMap/DistrictsMap';
import RegionsMap from './ui/CzMap/RegionsMap';
import { styled, withStyles, makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { useSelector, useDispatch } from 'react-redux';
import {
  DataView,
  select,
  fetchDataAsync,
  setRegionCode,
  setDistrictCode,
  switchDataView,
  selectDataForGraph,
  setTimeIntervalMs,
} from './model/state';
import { all as allDistricts } from './model/district';
import { all as allRegions } from './model/region';
import Graph from './ui/Graph/Graph';
import TimeIntervalToggle from './ui/TimeIntervalToggle';

const Wrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
});

const Toolbar = styled('div')({
  display: 'flex',
  padding: '8px 16px',
});

const useStyles = makeStyles({
  select: {
    padding: '10px 14px',
  },
});

const App = () => {
  const rawData = useSelector(selectDataForGraph);
  const dispatch = useDispatch();
  const { dataView, regionCode, districtCode, timeIntervalMs } = useSelector(
    select
  );

  const handleRegionDistrictChange = useCallback(
    (event) => {
      const code: string | null = event.target.value;
      if (code) {
        dispatch(
          dataView === DataView.Region
            ? setRegionCode(code)
            : setDistrictCode(code)
        );
      }
    },
    [dataView, dispatch]
  );

  const handleDataViewChange = useCallback(
    (event) => {
      const dataView: DataView = event.target.value;
      dispatch(switchDataView(dataView));
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(fetchDataAsync());
  }, [dispatch]);

  const classes = useStyles();

  return (
    <Wrapper>
      <Toolbar>
        <Select
          variant="outlined"
          style={{ marginRight: 8 }}
          classes={{ outlined: classes.select }}
          value={dataView}
          onChange={handleDataViewChange}
        >
          <MenuItem value={DataView.Country}>Stát</MenuItem>
          <MenuItem value={DataView.Region}>Kraj</MenuItem>
          <MenuItem value={DataView.District}>Okres</MenuItem>
        </Select>
        <Select
          variant="outlined"
          classes={{ outlined: classes.select }}
          value={dataView === DataView.Region ? regionCode : districtCode}
          onChange={handleRegionDistrictChange}
        >
          {(dataView === DataView.Region ? allRegions : allDistricts).map(
            ({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            )
          )}
        </Select>
      </Toolbar>
      {dataView === DataView.District && (
        <DistrictsMap
          onPointerMove={(code) => {
            if (code) {
              dispatch(setDistrictCode(code));
            }
          }}
        />
      )}
      {dataView === DataView.Region && (
        <RegionsMap
          onPointerMove={(code) => {
            if (code) {
              dispatch(setRegionCode(code));
            }
          }}
        />
      )}
      <Toolbar>
        <TimeIntervalToggle
          value={timeIntervalMs}
          onChange={(newTimeIntervalMs) => {
            dispatch(setTimeIntervalMs(newTimeIntervalMs));
          }}
        />
      </Toolbar>
      <Graph data={rawData} />
    </Wrapper>
  );
};

export default App;
