import React, { memo } from 'react';
import { Box } from "@mui/material";
import StepperSubItem from "../../../common/stepper/StepperSubItem";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const PublicProfileImpactDetailsDrawer = ({ impact, stepName, goToStep }) => {
  return (
    <CustomErrorBoundary>
      <Box minWidth={240} display='flex' flexDirection='column' gap={1}>
        <StepperSubItem
          item={{
            name: 'statusQuo',
            label: 'Status Quo',
            onClick: () => goToStep('statusQuo'),
            completed: stepName === 'statusQuo',
          }}
          activeItem={stepName}
        />
        <StepperSubItem
          item={{
            name: 'innovation',
            label: 'Innovation',
            onClick: () => goToStep('innovation'),
            completed: stepName === 'innovation ',
          }}
          activeItem={stepName}
        />
        <StepperSubItem
          item={{
            name: 'stakeholders',
            label: 'Stakeholders',
            onClick: () => goToStep('stakeholders'),
            completed: stepName === 'stakeholders ',
          }}
          activeItem={stepName}
        />
        <StepperSubItem
          item={{
            name: 'change',
            label: 'Change',
            onClick: () => goToStep('change'),
            completed: stepName === 'change ',
          }}
          activeItem={stepName}
        />
        {impact.indicators.map((i, index) => (
          <StepperSubItem
            key={i.id}
            item={{
              name: `indicators[${index}]`,
              label: `Indicator ${index + 1}`,
              onClick: () => goToStep(`indicators[${index}]`),
              completed: stepName === `indicators[${index}]`,
            }}
            activeItem={stepName}
          />
        ))}
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(PublicProfileImpactDetailsDrawer);
