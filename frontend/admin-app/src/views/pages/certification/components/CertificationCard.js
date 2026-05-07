import React, { memo } from 'react';
import { styled } from "@mui/material";
import Card from "@mui/material/Card";

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: 0,
  border: `1px solid ${theme.palette.border}`,
  backgroundColor: 'white',
}));

const CertificationCard = ({ children, ...rest }) => {
  return (
    <StyledCard {...rest}>
      {children}
    </StyledCard>
  );
};

export default memo(CertificationCard);
