import React, { memo } from 'react';
import { Box, Divider, Drawer, styled, Toolbar, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import StepperDrawerItem from "views/common/stepper/StepperDrawerItem";
import { yearTotal } from "shared-components/utils/quantification";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import StepperSubItem from "../../../common/stepper/StepperSubItem";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(46),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(46),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const MonitoringDrawer = ({ impact, values, stepName, goToStep, isGlobal }) => {
  const indicatorIndex = Number(stepName.match(/indicators\[(\d+)\]/)?.[1]);

  const indicatorFilled = (index) => {
    return !!values.indicators[index].preInitial && !!values.indicators[index].postInitial &&
      (values.indicators[index].deadweight > 0 || values.indicators[index].deadweight === 0) &&
      (values.indicators[index].displacement > 0 || values.indicators[index].displacement === 0) &&
      (values.indicators[index].attribution > 0 || values.indicators[index].attribution === 0)
  };

  return (
    <StyledDrawer variant='permanent' open>
      <Toolbar sx={{ height: HEADER_HEIGHT }} />
      <CustomErrorBoundary>
        <Box p={4}>
          <Typography variant='h5' sx={{ mb: 4 }}>{impact.name}</Typography>
          <StepperDrawerItem
            primary='Output'
            onClick={() => goToStep('products')}
            active={['products', 'stakeholders'].includes(stepName)}
            filled={!['products', 'stakeholders'].includes(stepName)}
            activeItem={stepName}
            items={[
              {
                name: 'products',
                label: 'Products/Services/Activities',
                onClick: () => goToStep('products'),
                completed: values.productsData.some(v => yearTotal(v) > 0),
              },
              {
                name: 'stakeholders',
                label: 'Stakeholders',
                onClick: () => goToStep('stakeholders'),
                completed: isGlobal || values.stakeholdersData.some(v => yearTotal(v) > 0),
              },
            ]}
          />
          {impact.indicators.map((i, index) => (
            <StepperDrawerItem
              key={i.id}
              sx={{ mt: 2 }}
              filled
              active={indicatorIndex === index}
              onClick={() => goToStep(`indicators[${index}].prepost`)}
            >
              <Box display='flex' justifyContent='space-between' gap={2}>
                <Typography variant='subtitleBold'>Indicator {index + 1}</Typography>
                {indicatorIndex !== index && indicatorFilled(index) &&
                  <CheckCircleIcon sx={{ color: 'primary.main', width: 13 }} />}
                {indicatorIndex !== index && !indicatorFilled(index) &&
                  <RadioButtonUncheckedIcon sx={{ color: 'secondary.main', width: 13 }} />}
              </Box>
              {indicatorIndex === index && (
                <Box>
                  <Typography sx={{ mt: 0.5 }} variant='caption' color='text.secondary'>{i.name}</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='subtitleBold'>Outcome</Typography>
                  <StepperSubItem
                    mt={2}
                    item={{
                      name: `indicators[${index}].prepost`,
                      label: 'Pre/Post value',
                      onClick: () => goToStep(`indicators[${index}].prepost`),
                      completed: values.indicators[index].preInitial && values.indicators[index].postInitial,
                    }}
                    activeItem={stepName}
                  />
                </Box>
              )}
            </StepperDrawerItem>
          ))}
        </Box>
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(MonitoringDrawer);
