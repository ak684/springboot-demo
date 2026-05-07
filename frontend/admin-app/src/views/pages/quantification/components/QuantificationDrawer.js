import React, { memo, useEffect, useRef, useState } from 'react';
import { Box, Divider, Drawer, styled, Toolbar, Typography } from "@mui/material";
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import StepperDrawerItem from "views/common/stepper/StepperDrawerItem";
import { getRiskItem, yearTotal } from "shared-components/utils/quantification";
import StepperSubItem from "../../../common/stepper/StepperSubItem";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";
import OnboardingTooltip from "../../../common/OnboardingTooltip";
import { getElementPosition } from "utils/onboarding";
import useUpdateEffect from "shared-components/hooks/useUpdateEffect";

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: theme.spacing(46),
  [`& .MuiDrawer-paper`]: {
    width: theme.spacing(46),
    backgroundColor: theme.palette.background.default,
    border: 'none'
  }
}));

const QuantificationDrawer = ({ impact, values, stepName, goToStep, isGlobal, preNotes, postNotes }) => {
  const [calculationModeTooltip, setCalculationModeTooltip] = useState(null);
  const indicatorIndex = Number(stepName.match(/indicators\[(\d+)\]/)?.[1]);
  const outputItemsRef = useRef();

  const indicatorFilled = (index) => {
    return (values.indicators[index].preInitial === 0 || values.indicators[index].preInitial > 0) &&
      (values.indicators[index].postInitial === 0 || values.indicators[index].postInitial > 0) &&
      (values.indicators[index].deadweight === 0 || values.indicators[index].deadweight > 0) &&
      (values.indicators[index].displacement === 0 || values.indicators[index].displacement > 0) &&
      (values.indicators[index].attribution === 0 || values.indicators[index].attribution > 0) &&
      !!getRiskItem(preNotes[values.indicators[index].id]) &&
      !!getRiskItem(postNotes[values.indicators[index].id], preNotes[values.indicators[index].id])
  };

  useUpdateEffect(() => {
    if (outputItemsRef.current) {
      setCalculationModeTooltip({
        name: 'quantificationModeSwitch',
        position: getElementPosition(outputItemsRef),
        title: 'Mode switch',
        subtitle: 'This will change the calculation mode for both products/services/activities and stakeholders',
        placement: 'right',
      });
    }
  }, [values.impactCalculationTotal]);

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
            ref={outputItemsRef}
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
                      completed: (values.indicators[index].preInitial > 0 || values.indicators[index].preInitial === 0)
                        && (values.indicators[index].postInitial > 0 || values.indicators[index].postInitial === 0)
                        && !!getRiskItem(preNotes[values.indicators[indicatorIndex].id])
                        && !!getRiskItem(postNotes[values.indicators[indicatorIndex].id], preNotes[values.indicators[indicatorIndex].id]),
                    }}
                    activeItem={stepName}
                    helperText={`${+(values.indicators[index].preInitial > 0 || values.indicators[index].preInitial === 0)
                    + (values.indicators[index].postInitial > 0 || values.indicators[index].postInitial === 0)
                    + !!getRiskItem(preNotes[values.indicators[indicatorIndex].id])
                    + !!getRiskItem(postNotes[values.indicators[indicatorIndex].id], preNotes[values.indicators[indicatorIndex].id])}/4`}
                  />
                  <StepperSubItem
                    item={{
                      name: `indicators[${index}].duration`,
                      label: 'Duration',
                      onClick: () => goToStep(`indicators[${index}].duration`),
                      completed: true,
                    }}
                    activeItem={stepName}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='subtitleBold'>Net impact</Typography>
                  <StepperSubItem
                    mt={2}
                    item={{
                      name: `indicators[${index}].deadweight`,
                      label: 'Deadweight',
                      onClick: () => goToStep(`indicators[${index}].deadweight`),
                      completed: values.indicators[index].deadweight > 0 || values.indicators[index].deadweight === 0,
                    }}
                    activeItem={stepName}
                  />
                  <StepperSubItem
                    item={{
                      name: `indicators[${index}].displacement`,
                      label: 'Displacement',
                      onClick: () => goToStep(`indicators[${index}].displacement`),
                      completed: values.indicators[index].displacement > 0 || values.indicators[index].displacement === 0,
                    }}
                    activeItem={stepName}
                  />
                  <StepperSubItem
                    item={{
                      name: `indicators[${index}].attribution`,
                      label: 'Attribution',
                      onClick: () => goToStep(`indicators[${index}].attribution`),
                      completed: values.indicators[index].attribution > 0 || values.indicators[index].attribution === 0,
                    }}
                    activeItem={stepName}
                  />
                  <StepperSubItem
                    item={{
                      name: `indicators[${index}].dropoff`,
                      label: 'Drop-off',
                      onClick: () => goToStep(`indicators[${index}].dropoff`),
                      completed: true,
                    }}
                    activeItem={stepName}
                  />
                </Box>
              )}
            </StepperDrawerItem>
          ))}
        </Box>
        <OnboardingTooltip
          open={!!calculationModeTooltip}
          onClose={() => setCalculationModeTooltip(null)}
          {...calculationModeTooltip}
        />
      </CustomErrorBoundary>
    </StyledDrawer>
  );
};

export default memo(QuantificationDrawer);
