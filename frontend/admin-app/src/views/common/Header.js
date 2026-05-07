import * as React from 'react';
import { memo, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Link from '@mui/material/Link';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';
import Toolbar from '@mui/material/Toolbar';
import { useDispatch, useSelector } from 'react-redux';
import { userSelectors, userThunks } from 'store/ducks/user';
import { Link as RouterLink, useParams, useLocation } from 'react-router-dom';
import { Avatar, Button, ListItemIcon, Menu, MenuItem, styled, Typography } from '@mui/material';
import Logo from 'shared-components/views/components/Logo';
import { HEADER_HEIGHT, VENTURE_ACCESS } from "shared-components/utils/constants";
import { ventureSelectors } from 'store/ducks/venture';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ReorderIcon from '@mui/icons-material/Reorder';
import { smallerImage } from "shared-components/utils/helpers";
import Breadcrumbs from 'shared-components/views/components/Breadcrumbs';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DvrIcon from '@mui/icons-material/Dvr';
import navigation from "shared-components/utils/navigation";
import CertificationProgress from "./CertificationProgress";
import { certificationThunks } from "../../store/ducks/certification";
import { portfolioSelectors } from "../../store/ducks/portfolio";
import LanguageIcon from '@mui/icons-material/Language';
import PublicIcon from '@mui/icons-material/Public';
import CustomErrorBoundary from "../containers/CustomErrorBoundary";
import { getBranding } from 'shared-components/utils/branding';

const drawerWidth = 240;

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

const Header = (props) => {
  const branding = getBranding();
  const whiteLabel = branding.whiteLabel || {};
  const calendlyUrl = branding.social.calendly;
  const marketingSiteUrl = branding.marketingSiteUrl;
  const companyName = branding.companyName;
  const showMyVentures = whiteLabel.hideMyVentures !== true;
  const myVenturesLabel = whiteLabel.myVenturesLabel || 'My ventures';
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { ventureId, portfolioId } = useParams();
  const location = useLocation();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));
  const user = useSelector(userSelectors.getCurrentUser());
  const portfolio = useSelector(portfolioSelectors.getCurrentPortfolio(portfolioId));
  const access = useSelector(ventureSelectors.getVentureAccess(ventureId));
  const isSuperAdmin = useSelector(userSelectors.isSuperAdmin());
  const isCompanyExtractorDashboard = location.pathname.includes('/company-url-extractor');
  const publicProfileOnlyCompanyIds = user?.publicProfileOnlyCompanyIds || [];
  const isPublicProfileOnlyUser = !isSuperAdmin
    && publicProfileOnlyCompanyIds.length > 0;

  const dispatch = useDispatch();

  useEffect(() => {
    if (venture) {
      dispatch(certificationThunks.fetchCertificationCriteria());
    }
  }, [venture])

  const logout = () => {
    dispatch(userThunks.logout());
  };

  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const openMenu = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <CustomErrorBoundary>
      <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
        <Toolbar sx={{ height: HEADER_HEIGHT }} />
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton sx={{ textAlign: 'center' }} component={RouterLink} to='/user-profile'>
              <ListItemText primary='My profile' />
            </ListItemButton>
          </ListItem>
          {!isPublicProfileOnlyUser && ventureId && showMyVentures && (
            <ListItem disablePadding>
              <ListItemButton
                sx={{ textAlign: 'center' }}
                component={RouterLink}
                to={`/ventures/${ventureId}/profile-wizard?step=0`}
                disabled={access !== VENTURE_ACCESS.EDIT}
              >
                <ListItemText primary='Edit venture profile' />
              </ListItemButton>
            </ListItem>
          )}
          {!isPublicProfileOnlyUser && portfolioId && (
            <ListItem disablePadding>
              <ListItemButton
                sx={{ textAlign: 'center' }}
                component={RouterLink}
                to={`/portfolios/${portfolioId}/profile-wizard?step=0`}
              >
                <ListItemText primary='Edit portfolio profile' />
              </ListItemButton>
            </ListItem>
          )}
          {!isPublicProfileOnlyUser && (
            <ListItem disablePadding>
              <ListItemButton
                sx={{ textAlign: 'center' }}
                component={Link}
                target='_blank'
                href={calendlyUrl}
              >
                <ListItemText primary='Book mentor session' />
              </ListItemButton>
            </ListItem>
          )}
          {!isPublicProfileOnlyUser && (
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: 'center' }} component={RouterLink} to='/portfolios'>
                <ListItemText primary='My portfolios' />
              </ListItemButton>
            </ListItem>
          )}
          {!isPublicProfileOnlyUser && showMyVentures && (
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: 'center' }} component={RouterLink} to='/ventures'>
                <ListItemText primary={myVenturesLabel} />
              </ListItemButton>
            </ListItem>
          )}
          {!isPublicProfileOnlyUser && (
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: 'center' }} onClick={navigation.goToTeamManagement}>
                <ListItemText primary='Manage team' />
              </ListItemButton>
            </ListItem>
          )}
          {isSuperAdmin && (
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: 'center' }} component={RouterLink} to='/superadmin/company-url-extractor'>
                <ListItemText primary='Admin database' />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding onClick={logout}>
            <ListItemButton sx={{ textAlign: 'center' }}>
              <ListItemText primary='Logout' />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </CustomErrorBoundary>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <CustomErrorBoundary>
      <Box display='flex'>
        <AppBar component='nav' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar disableGutters sx={{ height: HEADER_HEIGHT, px: { xs: 2, sm: 4 }, gap: 2 }}>
            {user && (
              <IconButton
                color='default'
                edge='start'
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Logo
              component={RouterLink}
              to={portfolioId ? `/portfolios/${portfolioId}` : ventureId ? `/ventures/${ventureId}` : '/'}
              sx={{ textDecoration: 'none', pointerEvents: user ? 'auto' : 'none' }}
            />
            <Breadcrumbs
              display={{ xs: 'none', sm: 'flex' }}
              dynamicLabels={{ portfolio: portfolio?.name }}
            />
            <Box sx={{ flexGrow: 1 }} />
            {venture && <CertificationProgress />}
            {user && (
              <Box sx={{ display: { xs: 'none', sm: 'flex' } }} alignItems='center' gap={2} minWidth={0}>
                <Typography component='div' color='text.primary' noWrap>
                  {isCompanyExtractorDashboard
                    ? `${user?.name || ''} ${user?.lastName || ''}`.trim()
                    : (portfolio?.name || venture?.name || `${user?.name} ${user?.lastName}`)}
                </Typography>
                <Avatar
                  onClick={openMenu}
                  sx={{ cursor: 'pointer', width: 32, height: 32 }}
                  src={isCompanyExtractorDashboard
                    ? smallerImage(user.avatar)
                    : (portfolio?.logo || venture?.logo || smallerImage(user.avatar))}
                />
                <Menu
                  id='menu-appbar'
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={closeMenu}
                  onClick={closeMenu}
                >
                  <StyledMenuItem component={RouterLink} to='/profile'>
                    <ListItemText primary='My profile' />
                    <ListItemIcon><PersonIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                  </StyledMenuItem>
                  {!isPublicProfileOnlyUser && ventureId && showMyVentures && <Divider />}
                  {!isPublicProfileOnlyUser && ventureId && showMyVentures && (
                    <StyledMenuItem
                      component={RouterLink}
                      to={`/ventures/${ventureId}/profile-wizard?step=0`}
                      disabled={access !== VENTURE_ACCESS.EDIT}
                    >
                      <ListItemText primary='Edit venture profile' />
                      <ListItemIcon><EditIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {!isPublicProfileOnlyUser && portfolioId && <Divider />}
                  {!isPublicProfileOnlyUser && portfolioId && (
                    <StyledMenuItem component={RouterLink} to={`/portfolios/${portfolioId}/profile-wizard?step=0`}>
                      <ListItemText primary='Edit portfolio profile' />
                      <ListItemIcon><EditIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {!isPublicProfileOnlyUser && <Divider />}
                  {!isPublicProfileOnlyUser && (
                    <StyledMenuItem
                      component={Link}
                      target='_blank'
                      href={calendlyUrl}
                    >
                      <ListItemText primary='Book mentor session' />
                      <ListItemIcon>
                        <Box component='img' src='/images/icons/calendly.svg' width={24} height={24} />
                      </ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {!isPublicProfileOnlyUser && <Divider />}
                  {!isPublicProfileOnlyUser && (
                    <StyledMenuItem component={RouterLink} to='/portfolios'>
                      <ListItemText primary='My portfolios' />
                      <ListItemIcon><DvrIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {!isPublicProfileOnlyUser && showMyVentures && <Divider />}
                  {!isPublicProfileOnlyUser && showMyVentures && (
                    <StyledMenuItem component={RouterLink} to='/ventures'>
                      <ListItemText primary={myVenturesLabel} />
                      <ListItemIcon><ReorderIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {!isPublicProfileOnlyUser && <Divider />}
                  {!isPublicProfileOnlyUser && (
                    <StyledMenuItem onClick={navigation.goToTeamManagement}>
                      <ListItemText primary='Manage team' />
                      <ListItemIcon><PersonAddIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  {isSuperAdmin && <Divider />}
                  {isSuperAdmin && (
                    <StyledMenuItem component={RouterLink} to='/superadmin/company-url-extractor'>
                      <ListItemText primary='Admin database' />
                      <ListItemIcon><PublicIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                    </StyledMenuItem>
                  )}
                  <Divider />
                  <StyledMenuItem onClick={logout}>
                    <ListItemText primary='Logout' />
                    <ListItemIcon><LogoutIcon sx={{ color: 'text.primary' }} /></ListItemIcon>
                  </StyledMenuItem>
                </Menu>
              </Box>
            )}
            {!user && (
              <Button
                component={Link}
                href={marketingSiteUrl}
                target='_blank'
                rel='noopener noreferrer'
                variant='outlined'
                startIcon={<LanguageIcon />}
              >
                {companyName}
              </Button>
            )}
          </Toolbar>
        </AppBar>
        {user && (
          <Box component='nav'>
            <Drawer
              container={container}
              variant='temporary'
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{ display: { xs: 'block', sm: 'none' }, boxSizing: 'border-box' }}
              PaperProps={{ width: drawerWidth }}
            >
              {drawer}
            </Drawer>
          </Box>
        )}
      </Box>
    </CustomErrorBoundary>
  )
    ;
};

export default memo(Header);
