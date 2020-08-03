import React, { useRef } from 'react';
import { SHAPE_KEYS } from './common';

export interface MapRegion {
  shape: string;
  type: string;
  code: string;
  color: string;
}

export interface SvgMapProps {
  regions: MapRegion[];
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

const SvgMap = ({
  regions,
  onPointerMove,
  onFinalChange,
  style = {},
  viewBox,
}: SvgMapProps) => {
  const lastNotified = useRef<string | undefined>(undefined);
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
            style: {
              stroke: '#888',
              fill: color,
              strokeWidth: 1,
              strokeLinejoin: 'bevel',
            },
            key: code,
            'data-id': code,
            [SHAPE_KEYS[elType]]: shape,
          })
        )}
      </g>
    </svg>
  );
};

export default SvgMap;