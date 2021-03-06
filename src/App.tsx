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
  setTimeIntervalDays,
  selectDataForMap,
  selectMaxActiveCount,
  setNeedle,
} from './model/state';
import { all as allDistricts } from './model/district';
import { all as allRegions } from './model/region';
import Graph from './ui/Graph/Graph';
import TimeIntervalToggle from './ui/TimeIntervalToggle';
import CircularProgress from '@material-ui/core/CircularProgress';

const Wrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  color: '#333333',
  userSelect: 'none',
});

const Toolbar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
});

const Spacer = styled('div')({ flex: 1 });

const LinksBox = styled('div')({
  fontSize: 14,
  textAlign: 'right',
});

const NoData = styled('div')({
  flex: 1,
  padding: '8px 16px',
  fontSize: 14,
  color: 'gray',
  textAlign: 'center',
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
    timeIntervalDays,
    needle,
    loaded,
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

  const selectedRegionCode =
    dataView === DataView.Region ? regionCode : districtCode;

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
          value={selectedRegionCode}
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
          selectedRegionCode={selectedRegionCode}
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
          selectedRegionCode={selectedRegionCode}
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
          value={timeIntervalDays}
          onChange={(newTimeIntervalMs) => {
            dispatch(setTimeIntervalDays(newTimeIntervalMs));
          }}
        />
        <Spacer />
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
      {loaded ? (
        rawData.length > 0 ? (
          <Graph
            data={rawData}
            needle={needle.getTime()}
            onChangeNeedle={(needle) => dispatch(setNeedle(new Date(needle)))}
          />
        ) : (
          <NoData>Žádná data</NoData>
        )
      ) : (
        <NoData>
          <CircularProgress />
          <div style={{ marginTop: 8 }}>Načítání dat...</div>
        </NoData>
      )}
    </Wrapper>
  );
};

export default App;
