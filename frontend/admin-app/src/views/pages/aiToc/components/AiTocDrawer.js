import React, { Fragment, memo, useState } from 'react';
import { Box, Drawer, IconButton, styled, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import StepperDivider from 'views/common/stepper/StepperDivider';
import StepperDrawerItem from 'views/common/stepper/StepperDrawerItem';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import CloseIcon from "@mui/icons-material/Close";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(45),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(45),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const getItems = (values, goToStep) => [
  {
    name: 'name',
    label: 'Initial data',
    items: [
      { name: 'name', label: 'Venture name', onClick: () => goToStep('name'), completed: !!values.name },
      { name: 'url', label: 'Website', onClick: () => goToStep('url'), completed: !!values.url },
      {
        name: 'activities',
        label: 'Key activities',
        onClick: () => goToStep('activities'),
        completed: !!values.activities
      },
      {
        name: 'geography',
        label: 'Geographic range',
        onClick: () => goToStep('geography'),
        completed: !!values.geography
      },
    ]
  },
  {
    name: 'questions[0]',
    label: 'AI Questions',
    items: [
      {
        name: 'questions[0]',
        label: 'Question 1',
        onClick: () => goToStep('questions[0]'),
        completed: !!values.answer1
      },
      {
        name: 'questions[1]',
        label: 'Question 2',
        onClick: () => goToStep('questions[1]'),
        completed: !!values.answer2
      },
      {
        name: 'questions[2]',
        label: 'Question 3',
        onClick: () => goToStep('questions[2]'),
        completed: !!values.answer3
      },
    ]
  },
  { name: 'result', label: 'Result' },
];

const AiTocDrawer = ({ values, stepName, goToStep, refining }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const items = getItems(values, goToStep);
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const drawerOpen = !isMobileView || open;
  const drawerVariant = isMobileView ? 'temporary' : 'permanent';

  if (refining) {
    items.splice(2, 0, { name: 'instructions', label: 'Refining', completed: !!values.instructions });
  }

  return (
    <CustomErrorBoundary>
      <Box>
        {!drawerOpen && (
          <Box
            display={{ xs: 'flex', sm: 'none' }}
            position='fixed'
            left={0}
            width={32}
            top={0}
            bottom={0}
            backgroundColor='rgba(0, 0, 0, 0.2)'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            gap={0.5}
            sx={{ cursor: 'pointer' }}
            onClick={() => setOpen(true)}
          >
            {items.map((i, index) => (
              <Box
                key={index}
                width={4}
                height={60}
                sx={{ borderRadius: '20px' }}
                backgroundColor={i.name === stepName || i.items?.some(item => item.name === stepName) ? 'primary.main' : 'white'}
              />
            ))}
          </Box>
        )}
        <StyledDrawer variant={drawerVariant} open={drawerOpen} onClose={() => setOpen(false)}>
          <Toolbar sx={{ height: HEADER_HEIGHT }} />
          <CustomErrorBoundary>
            <Box p={{ xs: 3, sm: 4 }}>
              {items.map((i, index) => (
                <Fragment key={i.label}>
                  <StepperDrawerItem
                    primary={i.label}
                    active={i.name === stepName || i.items?.some(item => item.name === stepName)}
                    filled={items.findIndex(item => item.name === stepName || item.items?.some(subitem => subitem.name === stepName)) >= index}
                    items={i.items}
                    activeItem={stepName}
                    completed={i.completed}
                  />
                  {index < items.length - 1 && <StepperDivider />}
                </Fragment>
              ))}
            </Box>
            <Box
              position='absolute'
              bottom={16}
              right={0}
              px={3}
              display={{ xs: 'flex', sm: 'none' }}
              justifyContent='flex-end'
            >
              <IconButton onClick={() => setOpen(false)}>
                <CloseIcon sx={{ color: 'text.primary' }} />
              </IconButton>
            </Box>
          </CustomErrorBoundary>
        </StyledDrawer>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(AiTocDrawer);
