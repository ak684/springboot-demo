import React, { memo, useState } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import CompanyProfileAccelerationForm from "./CompanyProfileAccelerationForm";
import CompanyProfileAccelerationCard from "./CompanyProfileAccelerationCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileAccelerationInput = ({ values, nextStep }) => {
  const [addingAcceleration, setAddingAcceleration] = useState(false);
  const [edited, setEdited] = useState([]);
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Acceleration</StepperTitle>
          <Card sx={{ mt: 4, p: 2, border: 1, borderColor: 'border' }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
              <Typography variant='h5'>Acceleration details</Typography>
              <Button variant='outlined' onClick={() => setAddingAcceleration(true)}>Add</Button>
            </Box>
            {addingAcceleration &&
              <CompanyProfileAccelerationForm acceleration={{}} closeForm={() => setAddingAcceleration(null)} />
            }
            {venture.acceleration.length > 0 && (
              <Box mt={2} display='flex' flexDirection='column' gap={2}>
                {venture.acceleration.map(a => edited.includes(a.id) ?
                  <CompanyProfileAccelerationForm
                    key={a.id}
                    acceleration={a}
                    closeForm={() => setEdited(edited.filter(val => val !== a.id))}
                  />
                  :
                  <CompanyProfileAccelerationCard
                    key={a.id}
                    values={values}
                    acceleration={a}
                    edit={(a) => setEdited([...edited, a.id])}
                  />
                )}
              </Box>
            )}
          </Card>

          <StepperNextButton nextStep={nextStep} />
        </Box>
      </StepperAnimation>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileAccelerationInput);
