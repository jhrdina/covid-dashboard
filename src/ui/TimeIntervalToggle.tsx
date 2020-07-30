import React, { useCallback } from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { TIME_INTERVALS } from '../model/state';

const TimeIntervalToggle = ({
  value,
  onChange,
}: {
  value: number;
  onChange?: (value: number) => void;
}) => {
  const handleChange = useCallback(
    (e, newValue: number) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );
  return (
    <ToggleButtonGroup
      size="small"
      value={value}
      exclusive
      onChange={handleChange}
    >
      {TIME_INTERVALS.map((x) => (
        <ToggleButton key={x.id} value={x.milliseconds}>
          {x.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default TimeIntervalToggle;
