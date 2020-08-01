import React, { useMemo, useCallback } from 'react';
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
import { DistrictStatsComputed } from '../../model/state';
import 'react-vis/dist/style.css';

export interface GraphProps {
  data: DistrictStatsComputed[];
  needle?: number;
  onChangeNeedle?: (needle: number) => void;
}

const formatDate = (date: Date) =>
  `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`;

const Graph = ({ data, onChangeNeedle, needle }: GraphProps) => {
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
    let startDate = new Date();
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
      xDomain: [startDate, new Date()],
      yDomain: [minY, maxY],
    };
  }, [data]);

  const handleNearestX = useCallback(
    (value: LineSeriesPoint, { event }) => {
      if (
        (typeof event.buttons === 'undefined' || event.buttons === 1) &&
        onChangeNeedle
      ) {
        onChangeNeedle(value.x);
      }
    },
    [onChangeNeedle]
  );

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <FlexibleXYPlot
          xDomain={xDomain}
          yDomain={yDomain}
          xType="time"
          style={{
            fontSize: 12,
          }}
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
      <div style={{ padding: 16, opacity: needle ? 1 : 0 }}>
        {formatDate(new Date(detailPoint?.x || 0))}:{' '}
        <strong>{detailPoint?.y}</strong> aktivních nakažených ⤴️
      </div>
    </div>
  );
};

export default Graph;
