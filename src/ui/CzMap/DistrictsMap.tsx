import React, { useMemo } from 'react';
import districts from './districts.json';
import SvgMap, { SvgMapProps } from './SvgMap';
import { interpolateReds } from 'd3-scale-chromatic';
import { DistrictStatsComputed } from '../../model/state';

const DistrictsMap = ({
  data,
  maxActiveCount,
  ...props
}: Omit<SvgMapProps, 'regions' | 'viewBox'> & {
  data: DistrictStatsComputed[];
  maxActiveCount: number;
}) => {
  const enhanced = useMemo(() => {
    return districts.map((x) => ({
      ...x,
      color: interpolateReds(
        (data.find(({ district }) => district === x.code)?.activeCount || 0) /
          (maxActiveCount || 1)
      ),
    }));
  }, [maxActiveCount, data]);

  return <SvgMap regions={enhanced} viewBox="0 0 748 500.3" {...props} />;
};

export default DistrictsMap;
