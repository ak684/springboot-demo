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

const CertificationLevel4 = ({ getCertificate }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());

  return (
    <CustomErrorBoundary>
      <CertificationCard>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5' sx={{ flexGrow: 1 }}>Level 4</Typography>
          {
            venture.certification < 4 && criteriaAchieved(achievedCriteria, ...certificationSteps[4]) &&
            <Button endIcon={<VerifiedIcon />} onClick={() => getCertificate(4)}>Get certificate</Button>
          }
          {venture.certification >= 4 && <CertificateLevelAchievedLabel />}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List>
          <CertificationListItem checked={achievedCriteria.minimumScore75} text='IP Score Minimum 75/500' />
          <CertificationListItem checked={achievedCriteria.immEfficiencyCalculation}
            text='Impact Multipe of Money efficiency calculation for all impact chains' />
          <CertificationListItem checked={achievedCriteria.threeYearsActual} text='3 years of data available' />
          <CertificationListItem checked={achievedCriteria.fiveEsgModules} text='Minium 5 ESG modules completed' />
          <CertificationListItem checked={achievedCriteria.prePostConfidence}
            text='Pre vs. post measurement confidence at least 3/5 for at least 70% of indicators' />
        </List>
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationLevel4);
