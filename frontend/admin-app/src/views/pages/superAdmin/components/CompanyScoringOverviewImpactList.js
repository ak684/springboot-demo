import React, { Fragment, memo } from 'react';
import {
  Box,
  Card,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  styled,
  Typography,
  useTheme
} from '@mui/material';
import impactColors from '../../scoringOverview/data/colors';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getTypography } from 'shared-components/utils/typography';

const StyledImpactIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 36,
  height: 36,
  color: 'white',
  ...getTypography('captionBold'),
  borderRadius: '50%',
}));

const containsBy = (arr, val, prop) => !!arr.find(item => item[prop] === val[prop]);

const CompanyScoringOverviewImpactList = ({ impacts, selected, setSelected, details, toggleDetails }) => {
  const theme = useTheme();

  const toggleSelectImpact = (value) => {
    if (containsBy(selected, value, 'id')) {
      setSelected(selected.filter(i => i.id !== value.id));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <Card sx={{ border: `1px solid ${theme.palette.border}` }}>
      <Box p={2} display='flex' alignItems='center' justifyContent='space-between' gap={2}>
        <Box display='flex' alignItems='center' gap={2}>
          <StyledImpactIcon backgroundColor={theme.palette.primary.main}>
            ALL
          </StyledImpactIcon>
          <Typography variant='captionBold'>{selected.length}/{impacts.length} impact areas</Typography>
        </Box>
        <Box display='flex' alignItems='center' onClick={toggleDetails} sx={{ cursor: 'pointer' }}>
          <Typography variant='caption' color='primary.main'>{details ? 'Hide' : 'Show'} details</Typography>
          <IconButton aria-haspopup='true'>
            {details
              ? <ExpandLessIcon sx={{ color: 'primary.main' }} />
              : <KeyboardArrowDownIcon sx={{ color: 'primary.main' }} />
            }
          </IconButton>
        </Box>
      </Box>
      <Collapse in={details} timeout="auto" unmountOnExit>
        {impacts.map((value, index) => (
          <Fragment key={value.id || index}>
            <Divider />
            <Box p={2} display='flex' alignItems='flex-start' justifyContent='space-between' gap={2}>
              <Box display='flex' alignItems='flex-start' gap={2}>
                <Checkbox checked={containsBy(selected, value, 'id')} onChange={() => toggleSelectImpact(value)} />
                <StyledImpactIcon backgroundColor={impactColors[index % impactColors.length]}>
                  IA{index + 1}
                </StyledImpactIcon>
                <Box>
                  <Typography
                    variant='caption'
                    component='div'
                    sx={{ fontWeight: 600, mb: 0.5 }}
                    color={value.positive ? 'success.main' : 'error.main'}
                  >
                    {value.positive ? 'Positive Impact' : 'Negative Impact'}
                  </Typography>
                  <Typography variant='caption'>
                    Impact area {index + 1}: {value.name}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fragment>
        ))}
      </Collapse>
    </Card>
  );
};

export default memo(CompanyScoringOverviewImpactList);
