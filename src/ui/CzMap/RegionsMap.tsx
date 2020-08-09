import React, { useMemo } from 'react';
import regions from './regions.json';
import SvgMap, { SvgMapProps } from './SvgMap';
import { DistrictStatsComputed } from '../../model/state';
import { valueToColor } from './common';

const RegionsMap = ({
  data,
  maxActiveCount,
  ...props
}: Omit<SvgMapProps, 'regions' | 'viewBox'> & {
  data: DistrictStatsComputed[];
  maxActiveCount: number;
}) => {
  const enhanced = useMemo(() => {
    return regions.map((r) => ({
      ...r,
      color: valueToColor(
        data.find(({ region }) => region === r.code)?.activeCount || 0,
        maxActiveCount
      ),
    }));
  }, [maxActiveCount, data]);
  return <SvgMap regions={enhanced} viewBox="0 0 357.4 233.8" {...props} />;
};

export default RegionsMap;
