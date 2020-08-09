import React, { useMemo } from 'react';
import districts from './districts.json';
import SvgMap, { SvgMapProps } from './SvgMap';
import { DistrictStatsComputed } from '../../model/state';
import { valueToColor } from './common';

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
      color: valueToColor(
        data.find(({ district }) => district === x.code)?.activeCount || 0,
        maxActiveCount
      ),
    }));
  }, [maxActiveCount, data]);

  return <SvgMap regions={enhanced} viewBox="0 0 748 500.3" {...props} />;
};

export default DistrictsMap;
