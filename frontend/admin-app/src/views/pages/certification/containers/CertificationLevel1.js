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

const CertificationLevel1 = ({ getCertificate }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());

  return (
    <CustomErrorBoundary>
      <CertificationCard>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5' sx={{ flexGrow: 1 }}>Level 1</Typography>
          {
            venture.certification < 1 && criteriaAchieved(achievedCriteria, ...certificationSteps[1]) &&
            <Button endIcon={<VerifiedIcon />} onClick={() => getCertificate(1)}>Get certificate</Button>
          }
          {venture.certification >= 1 && <CertificateLevelAchievedLabel />}
        </Box>
        <Divider sx={{ my: 2 }} />
        <List>
          <CertificationListItem checked={achievedCriteria.profileCompleted} text='Venture profile 100% completed' />
          <CertificationListItem
            checked={achievedCriteria.threePositiveImpacts}
            text='Min 3 positive impact chains completed'
          />
          <CertificationListItem
            checked={achievedCriteria.oneNegativeImpact}
            text='Min 1 negative impact chain completed'
          />
          <CertificationListItem
            checked={achievedCriteria.threePositiveImpactsScored}
            text='Minium 3 positive impact chains scored'
          />
          <CertificationListItem chec
            ed={achievedCriteria.oneNegativeImpactScored}
            text='Minium 1 negative impact chain scored'
          />
          <CertificationListItem checked={achievedCriteria.minimumScore15} text='IP Score Minimum 15/500' />
        </List>
      </CertificationCard>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationLevel1);
