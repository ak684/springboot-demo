import React, { Fragment, memo } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography } from '@mui/material';
import { useMatches } from 'react-router-dom';

const Breadcrumbs = ({ dynamicLabels = {}, ...rest }) => {
  const matches = useMatches();
  const breadcrumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => match.handle);

  const breadcrumbItems = breadcrumbs.map(b => {
    const label = b.breadcrumbKey && dynamicLabels[b.breadcrumbKey]
      ? dynamicLabels[b.breadcrumbKey]
      : b.breadcrumb;
    return (
      <Fragment key={b.breadcrumb}>
        <ChevronRightIcon sx={{ color: 'text.primary' }} />
        <Typography variant='subtitle' color='text.primary'>{label}</Typography>
        {b.beta && (
          <Box px={1} py={0.5} backgroundColor='secondary.main' sx={{ borderRadius: '16px' }}>
            <Typography variant='captionBold' sx={{ textTransform: 'uppercase' }}>Beta</Typography>
          </Box>
        )}
      </Fragment>
    );
  });

  return (
    <Box alignItems='center' gap={2} {...rest}>
      {breadcrumbItems}
    </Box>
  );
};

export default memo(Breadcrumbs);
