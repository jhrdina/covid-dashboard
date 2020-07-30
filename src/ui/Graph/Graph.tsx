import React, { useMemo, useCallback, useState } from 'react';
import {
  FlexibleXYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  LineSeries,
  Crosshair,
} from 'react-vis';
import { DistrictStatsComputed } from '../../model/state';

export interface GraphProps {
  data: DistrictStatsComputed[];
}

const Graph = ({ data }: GraphProps) => {
  const derivedData = useMemo(() => {
    return data.map((item) => ({
      x: item.date.getTime(),
      y: item.activeCount,
    }));
  }, [data]);

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

  const [detailActiveCount, setDetailActiveCount] = useState<number | null>(
    null
  );

  const handleNearestX = useCallback((value) => {
    setDetailActiveCount(value.y);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          <Crosshair />
        </FlexibleXYPlot>
      </div>
      <div style={{ padding: 16, opacity: detailActiveCount !== null ? 1 : 0 }}>
        {detailActiveCount} aktivních nakažených ⤴️
      </div>
    </div>
  );
};

export default Graph;
