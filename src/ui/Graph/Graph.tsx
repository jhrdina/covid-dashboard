import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  FlexibleXYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  LineSeries,
  Crosshair,
  LineSeriesPoint,
} from 'react-vis';
import locale from '../../l10n/cs-CZ/dateFormat.json';
import { timeFormatDefaultLocale, TimeLocaleDefinition } from 'd3-time-format';

import { DistrictStatsComputed } from '../../model/state';
import 'react-vis/dist/style.css';
import today from '../../utils/today';

export interface GraphProps {
  data: DistrictStatsComputed[];
  needle?: number;
  onChangeNeedle?: (needle: number) => void;
}

const formatDate = (date: Date) =>
  `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`;

const Graph = ({ data, onChangeNeedle, needle }: GraphProps) => {
  useEffect(() => {
    timeFormatDefaultLocale(locale as TimeLocaleDefinition);
  }, []);

  const derivedData = useMemo<LineSeriesPoint[]>(() => {
    return data.map((item) => ({
      x: item.date.getTime(),
      y: item.activeCount,
    }));
  }, [data]);

  const detailPoint = useMemo(
    () => (needle ? derivedData.find((item) => item.x === needle) : undefined),
    [derivedData, needle]
  );

  const { xDomain, yDomain } = useMemo(() => {
    let startDate = today();
    let defaultValue = data.length > 0 ? data[0].activeCount : 0;
    let minY = defaultValue;
    let maxY = defaultValue;

    data.forEach((item) => {
      if (item.date.getTime() < startDate.getTime()) {
        startDate = item.date;
      }
      if (item.activeCount < minY) {
        minY = item.activeCount;
      }
      if (item.activeCount > maxY) {
        maxY = item.activeCount;
      }
    });

    return {
      xDomain: [startDate, today()],
      yDomain: [0, maxY],
    };
  }, [data]);

  const nearestXRef = useRef(today().getTime());

  const handleNearestX = useCallback(
    (value: LineSeriesPoint, { event }) => {
      nearestXRef.current = value.x;
      if (
        (typeof event.buttons === 'undefined' || event.buttons === 1) &&
        onChangeNeedle
      ) {
        onChangeNeedle(value.x);
      }
    },
    [onChangeNeedle]
  );

  const handleClick = useCallback(() => {
    if (onChangeNeedle) {
      onChangeNeedle(nearestXRef.current);
    }
  }, [onChangeNeedle]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <FlexibleXYPlot
          xDomain={xDomain}
          yDomain={yDomain}
          xType="time"
          style={{
            fontSize: 12,
          }}
          onClick={handleClick}
        >
          <VerticalGridLines />
          <HorizontalGridLines />
          <XAxis tickLabelAngle={-45} />
          <YAxis />
          <LineSeries
            data={derivedData}
            onNearestX={handleNearestX}
            style={{
              fill: 'none',
            }}
          />
          <Crosshair
            style={{
              box: { display: 'none' },
              line: { backgroundColor: '#bbb' },
            }}
            values={detailPoint ? [detailPoint] : undefined}
          />
        </FlexibleXYPlot>
      </div>
      <div style={{ padding: 16, opacity: needle ? 1 : 0, userSelect: 'text' }}>
        {formatDate(new Date(detailPoint?.x || 0))}:{' '}
        <strong>{detailPoint?.y}</strong> aktivních nakažených ⤴️
      </div>
    </div>
  );
};

export default Graph;
