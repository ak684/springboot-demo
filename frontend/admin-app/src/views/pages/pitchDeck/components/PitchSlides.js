import React, { memo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  styled,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import PitchSlidePreview from "./PitchSlidePreview";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from "@mui/icons-material/Menu";
import { getImpactIndex } from "shared-components/utils/impact";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(),
  width: 44,
  padding: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.2)',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    left: 0,
    right: 0,
    top: 'unset',
    bottom: 0,
    height: 56,
    width: 'unset',
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  width: 480,
  [theme.breakpoints.down('sm')]: {
    width: 350,
  }
}));

const StyledSlideLabel = styled(Box)(({ theme, selected }) => ({
  width: 4,
  height: 20,
  borderRadius: '100px',
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.secondary.light,
  [theme.breakpoints.down('sm')]: {
    width: 20,
    height: 4,
  },
}));

const PitchSlides = ({ step, steps, goToStep, venture, clientView }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));

  const stepClicked = (step) => {
    setDrawerOpen(false);
    goToStep(step.name);
  };

  const slidePreviewMapper = (s) => {
    const SlideComponent = s.component;
    const index = steps.indexOf(s);
    return (
      <PitchSlidePreview
        key={s.name}
        selected={step === index}
        onClick={() => stepClicked(s)}
        step={s}
        index={index}
      >
        <SlideComponent venture={venture} {...s.props} preview />
      </PitchSlidePreview>
    );
  }

  return (
    <CustomErrorBoundary>
      <StyledWrapper onMouseEnter={() => isMobileView ? null : setDrawerOpen(true)}>
        {isMobileView && (
          <IconButton
            size='small'
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '4px',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon sx={{ color: 'white' }} />
          </IconButton>
        )}
        <Box
          display='flex'
          flexGrow={1}
          flexDirection={{ xs: 'row', sm: 'column' }}
          alignItems='center'
          justifyContent='center'
          gap={{ xs: 0.25, sm: 1 }}
        >
          {!drawerOpen && steps.map((s, index) => <StyledSlideLabel key={index} selected={step === index} />)}
        </Box>
        <Drawer
          anchor='left'
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {!clientView && <Toolbar sx={{ minHeight: HEADER_HEIGHT + 'px !important', height: HEADER_HEIGHT }} />}
          <StyledAccordion disableGutters defaultExpanded={steps[step].section === 'overview'}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='bodyBold'>Overview</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box display='flex' flexDirection='column' gap={2}>
                {steps.filter(s => s.section === 'overview').map(slidePreviewMapper)}
              </Box>
            </AccordionDetails>
          </StyledAccordion>
          {venture.impacts.map(impact => (
            <StyledAccordion key={impact.id}
              disableGutters
              defaultExpanded={steps[step].name.includes(`[${impact.id}]`)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box>
                  <Typography variant='bodyBold'>
                    {impact.positive ? 'Innovation impact' : 'Negative impact'} {getImpactIndex(impact, venture.impacts)}:
                  </Typography>
                  <Typography variant='body'>
                    {impact.name}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {steps.filter(s => s.section === 'impact' && s.props?.impact?.id === impact.id).map(slidePreviewMapper)}
              </AccordionDetails>
            </StyledAccordion>
          ))}
        </Drawer>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(PitchSlides);
