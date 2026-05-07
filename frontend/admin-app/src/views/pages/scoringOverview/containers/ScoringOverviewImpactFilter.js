import React, { Fragment, memo, useState } from 'react';
import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Typography,
  useTheme
} from "@mui/material";
import impactColors from '../data/colors';
import Card from "@mui/material/Card";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link, useParams } from "react-router-dom";
import navigation from "shared-components/utils/navigation";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getTypography } from "shared-components/utils/typography";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

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
}))

const containsBy = (arr, val, prop) => !!arr.find(item => item[prop] === val[prop]);

const ScoringOverviewImpactFilter = ({ impacts, selected, setSelected, details, toggleDetails }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [impact, setImpact] = useState(null);
  const theme = useTheme();
  const { ventureId } = useParams();

  const openMenu = (e, impact) => {
    setMenuAnchorEl(e.currentTarget);
    setImpact(impact);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setImpact(null);
  };

  const toggleSelectImpact = (impact) => {
    if (containsBy(selected, impact, 'id')) {
      setSelected(selected.filter(i => i.id !== impact.id));
    } else {
      setSelected([...selected, impact]);
    }
  }

  return (
    <CustomErrorBoundary>
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
          {impacts.map((impact, index) => (
            <Fragment key={index}>
              <Divider />
              <Box p={2} display='flex' alignItems='flex-start' justifyContent='space-between' gap={2}>
                <Box display='flex' alignItems='flex-start' gap={2}>
                  <Checkbox checked={containsBy(selected, impact, 'id')} onChange={() => toggleSelectImpact(impact)} />
                  <StyledImpactIcon backgroundColor={impactColors[index % impactColors.length]}>
                    IA{index + 1}
                  </StyledImpactIcon>
                  <Typography variant='caption'>
                    Impact area {index + 1}: {impact.name} {!impact.positive && '(Negative impact)'}
                  </Typography>
                </Box>
                <IconButton aria-haspopup='true' onClick={(e) => openMenu(e, impact)} color='text.primary'>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Fragment>
          ))}
        </Collapse>
        <Menu anchorEl={menuAnchorEl} open={!!menuAnchorEl} onClose={closeMenu} onClick={closeMenu}>
          <MenuItem component={Link} to={`/ventures/${ventureId}/impacts/${impact?.id}?step=0`}>
            <Typography>Edit logic</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => navigation.goToScoring(ventureId, impact?.id)}>
            <Typography>Edit score</Typography>
          </MenuItem>
        </Menu>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(ScoringOverviewImpactFilter);
