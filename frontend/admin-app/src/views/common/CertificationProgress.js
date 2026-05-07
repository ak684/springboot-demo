import React, { memo, useState } from 'react';
import { Box, Link, Popover, styled, Typography } from '@mui/material';
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import { ReactComponent as VerifiedIcon } from 'theme/icons/verified.svg';
import { certificationSelectors } from "store/ducks/certification";
import { certificationSteps, countCriteriaAchieved } from "utils/certification";
import CustomErrorBoundary from "../containers/CustomErrorBoundary";

const StyledPie = styled(Box)(({ theme, percent }) => ({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 42,
  height: 42,
  position: 'relative',
  backgroundColor: theme.palette.secondary.subtle,
  borderRadius: '50%',
  '&:before': {
    content: '""',
    position: 'absolute',
    borderRadius: '50%',
    inset: 0,
    background: `conic-gradient(${theme.palette.primary.main} calc(${percent * 100} * 1%), #0000 0)`,
    mask: 'radial-gradient(farthest-side, #000 0, #000 0)'
  }
}));

const StyledProgressOuter = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 20,
  backgroundColor: theme.palette.secondary.light,
  borderRadius: '100px',
}))

const StyledProgressInner = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 2,
  top: 2,
  bottom: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '100px',
  backgroundColor: theme.palette.primary.main
}))

const CertificationProgress = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const navigate = useNavigate();
  const achievedCriteria = useSelector(certificationSelectors.getCertificationCriteria());
  const criteriaTotal = certificationSteps[venture.certification + 1]?.length;
  const noOfCriteriaAchieved = countCriteriaAchieved(achievedCriteria, ...certificationSteps[venture.certification + 1])
  const percentAchieved = (noOfCriteriaAchieved / criteriaTotal * 100).toFixed(0);

  const openPopover = (e) => setAnchorEl(e.currentTarget);

  const closePopover = () => setAnchorEl(null);

  const goToCertification = () => {
    closePopover();
    navigate(`/ventures/${venture.id}/certification`);
  }

  return (
    <CustomErrorBoundary>
      <Box>
        <Box display='flex' alignItems='center' gap={1} sx={{ cursor: 'pointer' }} onClick={openPopover}>
          <StyledPie percent={percentAchieved / 100}>
            <Box
              position='relative'
              display='flex'
              alignItems='center'
              justifyContent='center'
              width={32}
              height={32}
              sx={{ borderRadius: '50%', backgroundColor: 'white', zIndex: 1 }}
            >
              {venture.certification >= 1 && (
                <>
                  <VerifiedIcon />
                  <Typography sx={{
                    position: 'absolute',
                    color: 'black',
                    fontSize: 10,
                    fontWeight: 700
                  }}>1</Typography>
                </>
              )}
            </Box>
          </StyledPie>
          <Typography variant='body' color='text.primary'>Certification progress</Typography>
          <ArrowDropDownRoundedIcon sx={{ color: 'text.primary' }} />
        </Box>
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          onClose={closePopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Box display='flex' flexDirection='column' gap={1} p={2}>
            <Typography variant='bodyBold'>Level {venture.certification || 0} of 5 progress:</Typography>
            <StyledProgressOuter>
              <StyledProgressInner width={percentAchieved + '%'}>
                {percentAchieved > 0 && (
                  <Typography color='white' sx={{ fontSize: 10, fontWeight: 700 }}>
                    {percentAchieved}%
                  </Typography>
                )}
              </StyledProgressInner>
            </StyledProgressOuter>
            <Typography variant='body'>Finish all steps to get to the next level!</Typography>
            <Link onClick={goToCertification} sx={{ cursor: 'pointer' }}>
              See details
            </Link>
          </Box>
        </Popover>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CertificationProgress);
