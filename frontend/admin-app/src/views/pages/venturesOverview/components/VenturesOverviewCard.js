import React, { memo } from 'react';
import Card from "@mui/material/Card";
import { styled } from "@mui/material";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: 0,
  border: `1px solid ${theme.palette.border}`,
  backgroundColor: 'white',
}));

const VenturesOverviewCard = ({ children, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <StyledCard {...rest}>
        {children}
      </StyledCard>
    </CustomErrorBoundary>
  );
};

export default memo(VenturesOverviewCard);
