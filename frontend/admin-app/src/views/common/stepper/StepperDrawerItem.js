import React, { forwardRef, memo, useMemo } from 'react';
import { Box, CardActionArea, IconButton, styled, Typography, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ProgressPie from './ProgressPie';
import AppTooltip from '../AppTooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { isDefined } from "shared-components/utils/lo";
import StepperSubItem from "./StepperSubItem";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const StyledCard = styled(Box,
  { shouldForwardProp: prop => !['active', 'filled', 'grey'].includes(prop) })
(({ theme, active, filled, grey }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: grey ? theme.palette.background.fade : active || filled ? 'white' : 'transparent',
  borderStyle: 'solid',
  borderWidth: 0,
  borderLeftWidth: 6,
  borderLeftColor: active ? theme.palette.primary.main : filled ? theme.palette.secondary.main : 'transparent',
  borderRadius: 4,
  boxShadow: active || filled ? theme.shadows[1] : 'none',
}));

const StyledDeleteIcon = styled(IconButton)(() => ({
  position: 'absolute',
  top: 'calc(50% - 20px)',
  right: 16,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
}));

const StyledProgressPie = styled(ProgressPie)(({ theme, padding }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(padding ? 2 : 1),
}));

const getStyledCardActionArea = (component) => styled(component,
  { shouldForwardProp: prop => !['active', 'filled', 'grey', 'onDelete'].includes(prop) })
(({ theme, active, filled, grey, onDelete }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  flexGrow: 1,
  padding: active || filled || grey ?
    theme.spacing(2, onDelete ? 6 : 3, 2, 3) :
    theme.spacing(1, 0),
}));

const StepperDrawerItem = forwardRef((
  {
    onClick,
    primary,
    secondary,
    active,
    filled,
    icon,
    onDelete,
    grey,
    pieValue,
    tooltip,
    items = [],
    activeItem,
    completed,
    children,
    ...rest
  },
  ref
) => {
  const theme = useTheme();
  const StyledCardActionArea = useMemo(() => getStyledCardActionArea(onClick ? CardActionArea : Box), []);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete();
  };

  const itemCards = (
    <Box mt={1}>
      {items.map((item, index) => <StepperSubItem key={index} item={item} activeItem={activeItem} />)}
    </Box>
  );

  return (
    <CustomErrorBoundary>
      <StyledCard active={active} filled={filled} grey={grey} ref={ref} {...rest}>
        <StyledCardActionArea onClick={onClick} active={active} filled={filled} grey={grey} onDelete={onDelete}>
          {icon && (
            <Box
              component={icon}
              sx={{ fill: active ? theme.palette.primary.main : theme.palette.secondary.main }}
              flexShrink={0}
            />
          )}
          <Box display='flex' justifyContent='space-between' alignItems='center' flexGrow={1}>
            {children && <Box flexGrow={1}>{children}</Box>}
            {(primary || secondary || items.length > 0) && (
              <Box display='flex' flexDirection='column' justifyContent='center' flexGrow={1}>
                {primary && <Typography variant='subtitleBold'>{primary}</Typography>}
                {secondary && (
                  <Typography sx={{ mt: 0.5 }} variant='caption' color='text.secondary'>{secondary}</Typography>
                )}
                {items.length > 0 && !!active && itemCards}
              </Box>
            )}
            {items.length > 0 && !active && (
              <Box mr={filled ? 0 : 3}>
                {items.every(i => i.completed) && <CheckCircleIcon sx={{ color: 'primary.main', width: 13 }} />}
                {!items.every(i => i.completed) && (
                  <RadioButtonUncheckedIcon sx={{ color: 'secondary.main', width: 13 }} />
                )}
              </Box>
            )}
            {isDefined(completed) && (
              <Box mr={filled ? 0 : 3}>
                {completed && <CheckCircleIcon sx={{ color: 'primary.main', width: 13 }} />}
                {!completed && <RadioButtonUncheckedIcon sx={{ color: 'secondary.main', width: 13 }} />}
              </Box>
            )}
          </Box>
          {pieValue > 0 && <StyledProgressPie percent={pieValue} padding={active || filled || grey} />}
          {tooltip && <AppTooltip iconStyles={{ mr: 1.5 }}>{tooltip}</AppTooltip>}
        </StyledCardActionArea>
        {onDelete && (
          <Box component={StyledDeleteIcon} onClick={handleDelete} color='text.primary'>
            <DeleteIcon sx={{ width: 20, height: 20 }} color='text.primary' />
          </Box>
        )}
      </StyledCard>
    </CustomErrorBoundary>
  );
});

export default memo(StepperDrawerItem);
