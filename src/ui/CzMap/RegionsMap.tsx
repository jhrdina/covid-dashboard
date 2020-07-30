import React from 'react';
import regions from './regions.json';
import SvgMap, { SvgMapProps } from './SvgMap';

const RegionsMap = (props: Omit<SvgMapProps, 'data' | 'viewBox'>) => (
  <SvgMap data={regions} viewBox="0 0 357.4 233.8" {...props} />
);

export default RegionsMap;
