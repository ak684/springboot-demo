import React, { memo } from 'react';
import { Box, Button, styled } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import { VENTURE_ACCESS } from "shared-components/utils/constants";
import { useParams } from "react-router-dom";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: '45%',
  right: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(),
  [theme.breakpoints.down('lg')]: {
    top: 'unset',
    bottom: theme.spacing(3),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(9),
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1),
  minWidth: 0,
  minHeight: 0,
}));

const PitchNavigation = ({ step, previous, next, last, openShare, openSettings, clientView }) => {
  const { ventureId } = useParams();
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));

  return (
    <CustomErrorBoundary>
      <StyledWrapper>
        {!clientView && (
          <StyledButton color='light' onClick={openShare} disabled={access !== VENTURE_ACCESS.EDIT}>
            <OpenInNewIcon />
          </StyledButton>
        )}
        {!clientView && (
          <StyledButton
            color='light'
            sx={{ mb: { xs: 0, lg: 2 }, mr: { xs: 2, lg: 0 } }}
            onClick={openSettings}
            disabled={access !== VENTURE_ACCESS.EDIT}
          >
            <SettingsIcon />
          </StyledButton>
        )}
        <StyledButton onClick={previous} disabled={step === 0}>
          <ArrowUpwardIcon />
        </StyledButton>
        <StyledButton onClick={next} disabled={last}>
          <ArrowDownwardIcon />
        </StyledButton>
      </StyledWrapper>
    </CustomErrorBoundary>
  );
};

export default memo(PitchNavigation);
