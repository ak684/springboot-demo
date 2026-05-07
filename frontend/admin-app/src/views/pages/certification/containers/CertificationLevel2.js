import React, { memo } from 'react';
import CertificationCard from "../components/CertificationCard";
import { Box, Button, Divider, Typography } from "@mui/material";
import List from "@mui/material/List";
import VerifiedIcon from '@mui/icons-material/Verified';
import CertificateLevelAchievedLabel from "../components/CertificateLevelAchievedLabel";
import CertificationListItem from "../components/CertificationListItem";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { certificationSteps, criteriaAchieved } from "utils/certification";
import { certificationSelectors } from "store/ducks/certification";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CertificationLevel2 = ({ getCertificate }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());

  return (
    <CustomErrorBoundary>
      <CertificationCard>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5' sx={{ flexGrow: 1 }}>Level 2</Typography>
          {
            venture.certification < 2 && criteriaAchieved(achievedCriteria, ...certificationSteps[2]) &&
            <Button endIcon={<VerifiedIcon />} onClick={() => getCertificate(2)}>Get certificate</Button>
          }
          {venture.certification >= 2 && <CertificateLevelAchievedLabel />}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List>
          <CertificationListItem
            checked={achievedCriteria.threePositiveForecasts}
            text='5-year forecast for 3 positive impact chains'
          />
          <CertificationListItem
            checked={achievedCriteria.oneNegativeForecast}
            text='5-year forecast for minimum 1 negative impact chain'
          />
          <CertificationListItem
            checked={achievedCriteria.oneIndicatorSoon}
            text='At least 1 indicator measurement start this year'
          />
          <CertificationListItem
            checked={achievedCriteria.oneIndicatorLongTerm}
            text='At least 1 indicator with measurement start 5 years ahead'
          />
          <CertificationListItem checked={achievedCriteria.minimumScore25} text='IP Score Minimum 25/500' />
        </List>
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationLevel2);
