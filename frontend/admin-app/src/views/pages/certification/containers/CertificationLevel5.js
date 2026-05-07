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

const CertificationLevel5 = ({ getCertificate }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());

  return (
    <CustomErrorBoundary>
      <CertificationCard>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5' sx={{ flexGrow: 1 }}>Level 5</Typography>
          {
            venture.certification < 5 && criteriaAchieved(achievedCriteria, ...certificationSteps[5]) &&
            <Button endIcon={<VerifiedIcon />} onClick={() => getCertificate(5)}>Get certificate</Button>
          }
          {venture.certification >= 5 && <CertificateLevelAchievedLabel />}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List>
          <CertificationListItem checked={achievedCriteria.minimumScore150} text='IP Score minimum 150/500' />
          <CertificationListItem checked={achievedCriteria.sevenEsgModules} text='Minimum 7 ESG modules completed' />
          <CertificationListItem checked={achievedCriteria.monetizedImpact}
            text='Monetized impact since inception of at least 5 Million USD' />
          <CertificationListItem checked={achievedCriteria.numberOfEmployees} text='Minimum 15 employees' />
        </List>
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationLevel5);
