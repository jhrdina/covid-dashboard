import React from 'react';
import districts from './districts.json';
import SvgMap, { SvgMapProps } from './SvgMap';

const DistrictsMap = (props: Omit<SvgMapProps, 'data' | 'viewBox'>) => (
  <SvgMap data={districts} viewBox="0 0 748 500.3" {...props} />
);

export default DistrictsMap;
