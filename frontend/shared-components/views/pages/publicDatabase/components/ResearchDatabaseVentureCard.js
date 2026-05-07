import React, { memo, useCallback, useState } from 'react';
import { Box, Card, Divider, Link, Typography, useTheme } from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dictionarySelectors } from 'store/ducks/dictionary';
import { getVentureGoals } from 'shared-components/utils/scoring';
import { lineClamp } from 'shared-components/utils/styles';
import { isDefined } from 'shared-components/utils/lo';

const getVentureImage = (venture) =>
  venture.impacts.find(i => isDefined(i.image))?.image || null;

const getCompanyAge = (formationDate) => {
  if (!formationDate) return null;
  const date = new Date(formationDate);
  if (isNaN(date.getTime())) return null;
  const years = Math.floor(
    (Date.now() - date) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (years < 1) return '< 1';
  return `${years}`;
};

const getShortLocation = (address) => {
  if (!address || address === 'N/A') return null;
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }
  return parts[0];
};

const CompanyInitials = memo(({ name }) => {
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <Box
      width='100%'
      height='100%'
      display='flex'
      alignItems='center'
      justifyContent='center'
      backgroundColor='secondary.subtle'
      borderRadius='4px'
    >
      <Typography variant='bodyBold' color='text.secondary'>
        {initials}
      </Typography>
    </Box>
  );
});

const VentureImage = memo(({ src, name }) => {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  if (!src || failed) return <CompanyInitials name={name} />;

  return (
    <Box
      component='img'
      width='100%'
      height='100%'
      src={src}
      sx={{ objectFit: 'contain', borderRadius: '4px' }}
      alt={name}
      onError={onError}
    />
  );
});

const ResearchDatabaseVentureCard = ({
  venture,
  selected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const theme = useTheme();
  const goals = useSelector(dictionarySelectors.getGoals());
  const ventureGoals = goals && goals.length > 0
    ? getVentureGoals(venture, goals).slice(0, 3)
    : [];
  const hasGoals = ventureGoals.length > 0;
  const companyAge = getCompanyAge(venture.formationDate);
  const location = getShortLocation(venture.country?.title);
  const imgSrc = venture.logo || getVentureImage(venture);

  return (
    <Card
      sx={{
        p: { xs: '14px', xl: '17px' },
        cursor: onClick ? 'pointer' : 'default',
        border: selected
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.border}`,
        m: selected ? '-1px' : 0,
        flexShrink: 0,
        '&:hover': {
          border: `2px solid ${theme.palette.primary.main}`,
          m: '-1px',
          boxShadow: t => t.shadows[6],
        },
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        gap={1}
        flexWrap='wrap'
      >
        <Typography variant='bodyBold' sx={{ flexShrink: 1, minWidth: 0 }}>
          {venture.name}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1.5, xl: 2 }}
      >
        <Box
          flexBasis={{ sm: 110, xl: 160 }}
          flexGrow={0}
          flexShrink={0}
        >
          <Box
            width={{ xs: '100%', sm: 110, xl: 160 }}
            height={{ sm: 76, xl: 110 }}
          >
            <VentureImage src={imgSrc} name={venture.name} />
          </Box>
          <Box mt={0.75} display='flex' gap={0.5}>
            {venture.employeesRaw && (
              <Box
                flexBasis='50%'
                p={{ xs: 0.75, xl: 1 }}
                backgroundColor='secondary.subtle'
                borderRadius='2px'
              >
                <Typography
                  sx={{ fontSize: { xs: 9, xl: 10 }, lineHeight: 1.2 }}
                >
                  Employees
                </Typography>
                <Typography
                  variant='captionBold'
                  sx={{ mt: 0.25, fontSize: { xs: 10, xl: 12 } }}
                >
                  {venture.employeesRaw}
                </Typography>
              </Box>
            )}
            {companyAge && (
              <Box
                flexBasis='50%'
                p={{ xs: 0.75, xl: 1 }}
                backgroundColor='secondary.subtle'
                borderRadius='2px'
              >
                <Typography
                  sx={{ fontSize: { xs: 9, xl: 10 }, lineHeight: 1.2 }}
                >
                  Age (years)
                </Typography>
                <Typography
                  variant='captionBold'
                  sx={{ mt: 0.25, fontSize: { xs: 10, xl: 12 } }}
                >
                  {companyAge}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box flexGrow={1} minWidth={0} display='flex' flexDirection='column'>
          <Typography variant='subtitle' style={lineClamp(hasGoals ? 4 : 5)}>
            {venture.description}
          </Typography>
          {location && (
            <Box display='flex' alignItems='center' gap={0.5} mt='auto' pt={0.5}>
              <PlaceOutlinedIcon
                sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {location}
              </Typography>
            </Box>
          )}
          {venture.industries && venture.industries.length > 0 && (
            <Box display='flex' alignItems='center' gap={0.5} mt={0.25}>
              <BusinessOutlinedIcon
                sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }}
              />
              <Typography
                sx={{ fontSize: 11, color: 'text.secondary' }}
                style={lineClamp(1)}
              >
                {venture.industries.map(industry => industry.title).join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          display='flex'
          flexDirection='column'
          justifyContent='space-between'
          flexBasis={{ xs: 'unset', sm: 100, xl: 150 }}
          flexGrow={0}
          flexShrink={0}
        >
          {hasGoals && (
            <Box display='flex' flexDirection='column' gap={1}>
              {ventureGoals.map(goal => (
                <Box key={goal.name} display='flex' gap={0.75} alignItems='center'>
                  <Box
                    component='img'
                    src={goal.image}
                    width={{ xs: 20, xl: 24 }}
                    height={{ xs: 20, xl: 24 }}
                    sx={{ borderRadius: '2px', flexShrink: 0 }}
                  />
                  <Box minWidth={0}>
                    <Typography
                      sx={{ fontSize: { xs: 9, xl: 10 }, lineHeight: 1.2 }}
                    >
                      {goal.shortName}
                    </Typography>
                    <Typography
                      variant='captionBold'
                      sx={{ mt: 0.25, fontSize: { xs: 10, xl: 12 } }}
                    >
                      {Math.round(goal.rate)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          <Link
            component={RouterLink}
            to={venture.ventureId
              ? `/public-profile/ventures/${venture.ventureId}`
              : `/company-overview/${venture.id}`}
            target='_blank'
            onClick={(e) => e.stopPropagation()}
            sx={{
              fontSize: 12,
              cursor: 'pointer',
              textAlign: { xs: 'center', sm: 'right' },
              mt: 'auto',
            }}
          >
            See details
          </Link>
        </Box>
      </Box>
    </Card>
  );
};

export default memo(ResearchDatabaseVentureCard);
