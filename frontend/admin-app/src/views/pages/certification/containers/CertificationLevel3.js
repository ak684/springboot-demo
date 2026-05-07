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

const CertificationLevel3 = ({ getCertificate }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());

  return (
    <CustomErrorBoundary>
      <CertificationCard>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5' sx={{ flexGrow: 1 }}>Level 3</Typography>
          {
            venture.certification < 3 && criteriaAchieved(achievedCriteria, ...certificationSteps[3]) &&
            <Button endIcon={<VerifiedIcon />} onClick={() => getCertificate(3)}>Get certificate</Button>
          }
          {venture.certification >= 3 && <CertificateLevelAchievedLabel />}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List>
          <CertificationListItem checked={achievedCriteria.minimumScore50} text='IP Score Minimum 50/500' />
          <CertificationListItem checked={achievedCriteria.oneYearActual} text='Minimum 1 year of data collected' />
          <CertificationListItem checked={achievedCriteria.threeEsgModules} text='Minimum 3 ESG modules completed' />
          <CertificationListItem checked={achievedCriteria.impactReportPublished} text='Impact report published' />
        </List>
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationLevel3);
