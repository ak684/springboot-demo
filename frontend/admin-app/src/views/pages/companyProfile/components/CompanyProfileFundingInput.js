import React, { memo, useState } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import StepperTitle from 'views/common/stepper/StepperTitle';
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import CompanyProfileFundingForm from "./CompanyProfileFundingForm";
import CompanyProfileFundingCard from "./CompanyProfileFundingCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileFundingInput = ({ values, nextStep }) => {
  const [addingFunding, setAddingFunding] = useState(false);
  const [edited, setEdited] = useState([]);
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Funding</StepperTitle>
          <Card sx={{ mt: 4, p: 2, border: 1, borderColor: 'border' }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
              <Typography variant='h5'>Funding sources</Typography>
              <Button variant='outlined' onClick={() => setAddingFunding(true)}>Add</Button>
            </Box>
            {addingFunding &&
              <CompanyProfileFundingForm values={values} funding={{}} closeForm={() => setAddingFunding(false)} />
            }
            {venture.funding?.length > 0 && (
              <Box mt={2} display='flex' flexDirection='column' gap={2}>
                {venture.funding.map(f => edited.includes(f.id) ?
                  <CompanyProfileFundingForm
                    key={f.id}
                    values={values}
                    funding={f}
                    closeForm={() => setEdited(edited.filter(val => val !== f.id))}
                  />
                  :
                  <CompanyProfileFundingCard
                    key={f.id}
                    values={values}
                    funding={f}
                    edit={(a) => setEdited([...edited, f.id])}
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

export default memo(CompanyProfileFundingInput);
