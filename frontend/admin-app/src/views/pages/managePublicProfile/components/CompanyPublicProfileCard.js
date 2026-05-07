import React, { memo, useState } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import { Box, Divider, Menu, MenuItem, styled, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CustomErrorBoundary from '../../../containers/CustomErrorBoundary';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  minWidth: 220,
}));

const LogoBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 180,
  borderRadius: '8px',
  backgroundColor: '#f4f6f8',
  overflow: 'hidden',
}));

const CompanyPublicProfileCard = memo(({ company }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const goToEdit = () => {
    closeMenu();
    navigate(`/company/${company.id}/edit-public-profile`);
  };

  const goToView = () => {
    closeMenu();
    navigate(`/company-overview/${company.id}`);
  };

  return (
    <CustomErrorBoundary>
      <Card
        data-testid={`company-public-profile-card-${company.id}`}
        sx={{ height: '100%' }}
      >
        <CardActionArea component='div' onClick={openMenu} sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5' component='div' noWrap>
              {company.name || `Company ${company.id}`}
            </Typography>
            {company.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant='body'
                  color='text.secondary'
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {company.description}
                </Typography>
              </>
            )}
            <Box mt={2}>
              <LogoBox>
                {company.logo ? (
                  <Box
                    component='img'
                    src={company.logo}
                    alt={company.name || ''}
                    sx={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant='h3' color='text.secondary'>
                    {(company.name || '?').slice(0, 1)}
                  </Typography>
                )}
              </LogoBox>
            </Box>
          </CardContent>
        </CardActionArea>
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <StyledMenuItem
            data-testid={`company-public-profile-card-${company.id}-edit`}
            onClick={goToEdit}
          >
            <EditOutlinedIcon fontSize='small' />
            <Typography>Edit public profile</Typography>
          </StyledMenuItem>
          <StyledMenuItem
            data-testid={`company-public-profile-card-${company.id}-view`}
            onClick={goToView}
          >
            <VisibilityOutlinedIcon fontSize='small' />
            <Typography>View public profile</Typography>
          </StyledMenuItem>
        </Menu>
      </Card>
    </CustomErrorBoundary>
  );
});

export default CompanyPublicProfileCard;
