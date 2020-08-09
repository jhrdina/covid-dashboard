import React, { useRef, useMemo } from 'react';
import { SHAPE_KEYS } from './common';
import { makeStyles } from '@material-ui/core/styles';

export interface MapRegion {
  shape: string;
  type: string;
  code: string;
  color: string;
}

export interface SvgMapProps {
  regions: MapRegion[];
  selectedRegionCode?: string;
  style?: React.CSSProperties;
  viewBox: string;
  onPointerMove?: (id: string | undefined) => void;
  onFinalChange?: (id: string | undefined) => void;
}

const getAttributeFromEventTarget = (
  e: React.PointerEvent<SVGSVGElement>,
  attributeName: string
): string | undefined => {
  const el = document.elementFromPoint(e.clientX, e.clientY) as
    | SVGElement
    | undefined;
  return el && el.dataset ? el.dataset[attributeName] : undefined;
};

const useStyles = makeStyles({
  region: {
    stroke: '#888',
    strokeWidth: 1,
    strokeLinejoin: 'bevel',
  },
  regionSelection: {
    fill: 'none',
    stroke: '#444',
    strokeWidth: 3,
    strokeLinejoin: 'bevel',
  },
});

const SvgMap = ({
  regions,
  onPointerMove,
  onFinalChange,
  selectedRegionCode,
  style = {},
  viewBox,
}: SvgMapProps) => {
  const classes = useStyles();
  const lastNotified = useRef<string | undefined>(undefined);
  const selectedRegion = useMemo(
    () =>
      typeof selectedRegionCode !== 'undefined'
        ? regions.find(({ code }) => code === selectedRegionCode)
        : undefined,
    [selectedRegionCode, regions]
  );
  return (
    <svg
      viewBox={viewBox}
      style={{ touchAction: 'none', ...style }}
      onPointerMove={(e) => {
        const id = getAttributeFromEventTarget(e, 'id');
        if (id !== lastNotified.current && e.buttons === 1 && onPointerMove) {
          lastNotified.current = id;
          onPointerMove(id);
        }
      }}
      onPointerDown={(e) => {
        const id = getAttributeFromEventTarget(e, 'id');
        if (id !== lastNotified.current && onPointerMove) {
          lastNotified.current = id;
          onPointerMove(id);
        }
      }}
      onPointerUp={(e) => {
        const id = getAttributeFromEventTarget(e, 'id');
        if (id !== lastNotified.current) {
          if (onPointerMove) {
            onPointerMove(id);
          }
        }
        if (onFinalChange) {
          onFinalChange(id);
        }
        lastNotified.current = undefined;
      }}
    >
      <g>
        {regions.map(({ type: elType, color, shape, code }) =>
          React.createElement(elType, {
            className: classes.region,
            style: { fill: color },
            key: code,
            'data-id': code,
            [SHAPE_KEYS[elType]]: shape,
          })
        )}
        {selectedRegion &&
          React.createElement(selectedRegion.type, {
            className: classes.regionSelection,
            [SHAPE_KEYS[selectedRegion.type]]: selectedRegion.shape,
          })}
      </g>
    </svg>
  );
};

export default SvgMap;
