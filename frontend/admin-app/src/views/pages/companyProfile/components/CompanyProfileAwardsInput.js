import React, { memo, useState } from 'react';
import { Box, Button, Card, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "../../../../store/ducks/venture";
import StepperAnimation from "../../../common/stepper/StepperAnimation";
import StepperTitle from "../../../common/stepper/StepperTitle";
import StepperNextButton from "../../../common/stepper/StepperNextButton";
import CompanyProfileAwardForm from "./CompanyProfileAwardForm";
import CompanyProfileAwardCard from "./CompanyProfileAwardCard";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileAwardsInput = ({ values, nextStep }) => {
  const [addingAward, setAddingAward] = useState(false);
  const [edited, setEdited] = useState([]);
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  return (
    <CustomErrorBoundary>
      <StepperAnimation>
        <Box>
          <StepperTitle>Prizes and Awards</StepperTitle>
          <Card sx={{ mt: 4, p: 2, border: 1, borderColor: 'border' }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
              <Typography variant='h5'>Prizes and Awards details</Typography>
              <Button variant='outlined' onClick={() => setAddingAward(true)}>Add</Button>
            </Box>
            {addingAward &&
              <CompanyProfileAwardForm values={values} award={{}} closeForm={() => setAddingAward(false)} />
            }
            {venture.awards.length > 0 && (
              <Box mt={2} display='flex' flexDirection='column' gap={2}>
                {venture.awards.map(a => edited.includes(a.id) ?
                  <CompanyProfileAwardForm
                    key={a.id}
                    values={values}
                    award={a}
                    closeForm={() => setEdited(edited.filter(val => val !== a.id))}
                  />
                  :
                  <CompanyProfileAwardCard
                    key={a.id}
                    values={values}
                    award={a}
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

export default memo(CompanyProfileAwardsInput);
