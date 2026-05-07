import React, { memo } from 'react';
import { Box, Card, Divider, Grid, styled, Typography, useTheme } from '@mui/material';
import { isDefined } from "shared-components/utils/lo";
import { useNavigate } from "react-router-dom";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const StyledIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: theme.spacing(8),
  height: theme.spacing(8),
  borderRadius: theme.spacing(2),
  background: theme.palette.secondary.subtle,
}));

const DashboardStatItem = ({ icon, label, value, positive, negative, url, children, disabled }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const showPositiveNegative = isDefined(positive) || isDefined(negative);

  return (
    <CustomErrorBoundary>
      <Grid item xs={12} lg={6} xl={4}>
        <Card
          sx={{
            display: 'flex',
            p: 2,
            gap: 2,
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { outline: `2px solid ${theme.palette.primary.main}` }
          }}
          onClick={() => !disabled && navigate(url)}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <StyledIconWrapper>
              <img src={icon} alt={label} />
            </StyledIconWrapper>
            {!children && (
              <Box>
                <Typography variant='subtitle' color='text.secondary'>{label}</Typography>
                <Typography component='h3' sx={{ fontWeight: 'bold', fontSize: 28 }}>{value}</Typography>
              </Box>
            )}
            {children}
          </Box>
          {showPositiveNegative && (
            <>
              <Divider orientation='vertical' flexItem />
              <Box>
                <Typography variant='subtitle' color='text.secondary'>Positive</Typography>
                <Typography component='h3' color='secondary.main'
                  sx={{ fontWeight: 'bold', fontSize: 28 }}>{positive}</Typography>
              </Box>
              <Box>
                <Typography variant='subtitle' color='text.secondary'>Negative</Typography>
                <Typography component='h3' color='secondary.main' sx={{ fontWeight: 'bold', fontSize: 28 }}>
                  {negative}
                </Typography>
              </Box>
            </>
          )}
        </Card>
      </Grid>
    </CustomErrorBoundary>
  );
};

export default memo(DashboardStatItem);
