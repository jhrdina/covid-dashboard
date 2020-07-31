import React, { useCallback, useEffect } from 'react';
import DistrictsMap from './ui/CzMap/DistrictsMap';
import RegionsMap from './ui/CzMap/RegionsMap';
import { styled, makeStyles } from '@material-ui/core/styles';
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
  selectDataForMap,
  selectMaxActiveCount,
  setNeedle,
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
  alignItems: 'center',
  padding: '8px 16px',
});

const LinksBox = styled('div')({
  fontSize: 14,
  flex: 1,
  textAlign: 'right',
});

const SourceLink = styled('a')({
  display: 'block',
  color: 'gray',
});

const useStyles = makeStyles({
  select: {
    padding: '10px 14px',
  },
});

const App = () => {
  const maxActiveCount = useSelector(selectMaxActiveCount);
  const dataForMap = useSelector(selectDataForMap);
  const rawData = useSelector(selectDataForGraph);
  const dispatch = useDispatch();
  const {
    dataView,
    regionCode,
    districtCode,
    timeIntervalMs,
    needle,
  } = useSelector(select);

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
          {/* <MenuItem value={DataView.Country}>Stát</MenuItem> */}
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
          data={dataForMap}
          maxActiveCount={maxActiveCount}
          style={{ flex: 1 }}
          onPointerMove={(code) => {
            if (code) {
              dispatch(setDistrictCode(code));
            }
          }}
        />
      )}
      {dataView === DataView.Region && (
        <RegionsMap
          data={dataForMap}
          maxActiveCount={maxActiveCount}
          style={{ flex: 1 }}
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
        <LinksBox>
          <SourceLink
            href="https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19"
            target="_blank"
            rel="noopener noreferrer"
          >
            Zdroj dat
          </SourceLink>
          <SourceLink
            href="https://github.com/jhrdina/covid-dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            Zdrojový kód
          </SourceLink>
        </LinksBox>
      </Toolbar>
      <Graph
        data={rawData}
        needle={needle.getTime()}
        onChangeNeedle={(needle) => dispatch(setNeedle(new Date(needle)))}
      />
    </Wrapper>
  );
};

export default App;
