import React, { memo, useState } from 'react';
import { Box, Slider, styled, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { scoringThunks } from 'store/ducks/scoring';
import { isDefined } from 'shared-components/utils/lo';
import { description } from "shared-components/utils/scoring";
import AppTooltip from 'views/common/AppTooltip';
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledSlider = styled(Slider, { shouldForwardProp: prop => prop !== 'empty' })(({ theme, empty }) => ({
  '& .MuiSlider-track': {
    display: empty ? 'none' : 'block',
  },
  '& .MuiSlider-thumb': {
    display: empty ? 'none' : 'flex',
    position: 'relative',
    height: 12,
    width: 12,
    backgroundColor: '#fff',
    boxShadow: '0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 1px 5px rgba(0, 0, 0, 0.12)',
    '&:after': {
      position: 'absolute',
      display: 'block',
      top: 6,
      left: 6,
      width: 6,
      height: 6,
      backgroundColor: theme.palette.primary.main,
    }
  },
  '.MuiSlider-rail': {
    height: 4,
    borderRadius: '4px',
    backgroundColor: theme.palette.border,
  }
}));

const StyledTooltip = styled(AppTooltip)(() => ({
  position: 'absolute',
  right: -4,
  bottom: -4,
}));

const StyledBox = styled(Box)(() => ({
  position: 'relative',
  '& .MuiSvgIcon-root': {
    visibility: 'hidden',
  },
  '&:hover .MuiSvgIcon-root': {
    visibility: 'visible',
  }
}))

const DimensionsSlider = ({ values, value, impact, indicator, field, fieldGroup, numeric }) => {
  const valueIndex = (values || []).findIndex(v => v.name === value?.name);
  const [current, setCurrent] = useState(numeric ? value : valueIndex);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setCurrent(e.target.value);
  };

  const saveChange = (e, value) => {
    const newValue = numeric ? +value : values[value];
    dispatch(
      scoringThunks.updateScoringField(
        { field, value: newValue, impactId: impact.id, indicator, score: impact.scoring.at(-1) }
      )
    );
  }

  return (
    <CustomErrorBoundary>
      <StyledBox px={1}>
        <StyledSlider
          valueLabelDisplay='off'
          value={current}
          onChange={handleChange}
          onChangeCommitted={saveChange}
          min={numeric ? 1 : 0}
          max={numeric ? 100 : values.length - 1}
          marks={!numeric && isDefined(value)}
          empty={!isDefined(current) || current < 0}
        />
        {isDefined(current) && current > -1 && (
          <Typography variant='captionBold'>
            {numeric ? `${current}%` : values[current]?.shortName}
          </Typography>
        )}
        {(!isDefined(current) || current < 0) &&
          <Typography variant='captionBold' color='text.disabled'>No data</Typography>
        }
        <StyledTooltip>{description[fieldGroup][impact.positive ? 'positive' : 'negative']}</StyledTooltip>
      </StyledBox>
    </CustomErrorBoundary>
  );
};

export default memo(DimensionsSlider);
