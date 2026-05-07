import React, { memo } from 'react';
import { Box, Button, Card, Divider, Typography } from "@mui/material";
import { getTypography } from "shared-components/utils/typography";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import filters from "shared-components/filters";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const SubscriptionCard = ({ type, recommended, price, period, yearPrice, items, purchase, sx = {}, ...rest }) => {
  return (
    <CustomErrorBoundary>
      <Card
        sx={{
          minWidth: '0 !important',
          height: '100%',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          border: 1,
          borderColor: 'border',
          ...sx
        }}
        {...rest}
      >
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='bodyBold'>{type}</Typography>
          {recommended && (
            <Box
              px={1}
              py={0.5}
              sx={{ textTransform: 'uppercase', ...getTypography('captionBold'), borderRadius: '4px' }}
              backgroundColor='primary.subtle'
              color='primary.main'
            >
              Recommended
            </Box>
          )}
        </Box>
        <Box display='flex' alignItems='center' gap={0.5}>
          <Typography sx={{ fontSize: 28, fontWeight: 'bold' }}>${filters.number(price, 2)}</Typography>
          <Typography variant='overline'>/per month</Typography>
          {yearPrice && <Typography variant='overline' color='secondary.dark'>${yearPrice} per year</Typography>}
        </Box>
        <Divider flexItem />
        {recommended && <Typography variant='subtitleBold'>Includes everything from basic plan, plus:</Typography>}
        {items.map((item, index) => (
          <Box key={index} display='flex' alignItems='center' gap={0.5}>
            <CheckCircleOutlineIcon sx={{ width: 16, color: 'primary.main' }} />
            <Typography variant='subtitle'>{item}</Typography>
          </Box>
        ))}
        <Box flexGrow={1} display='flex' alignItems='flex-end'>
          <Button onClick={purchase}
            color={recommended ? 'primary' : 'secondary'}
            sx={{ width: '100%' }}>Subscribe</Button>
        </Box>
      </Card>
    </CustomErrorBoundary>
  );
};

export default memo(SubscriptionCard);
