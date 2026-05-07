import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  styled,
  Toolbar,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorageIcon from '@mui/icons-material/Storage';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LinkIcon from '@mui/icons-material/Link';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { HEADER_HEIGHT } from "shared-components/utils/constants";
import apiService from '../../../../services/api/apiService';
import { useSelector } from 'react-redux';
import userSelectors from '../../../../store/ducks/user/selectors';
import { groupNewsByCompanyAndDate, NEWS_NOTIFICATION_LOOKBACK_DAYS } from '../../../../utils/notificationHelpers';

const EXPANDED_WIDTH = 280; // theme.spacing(35) = 280px
const COLLAPSED_WIDTH = 72; // theme.spacing(9) = 72px

const StyledDrawer = styled(Drawer)(({ theme, collapsed }) => ({
  width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.standard,
  }),
  [`& .MuiDrawer-paper`]: {
    width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    backgroundColor: theme.palette.background.default,
    borderRight: `1px solid ${theme.palette.divider}`,
    position: 'relative',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
    overflowX: 'hidden'
  }
}));

const CompanyExtractorSidebar = ({
  activeSection,
  onSectionChange,
  extractionProgress,
  collapsed,
  onToggleCollapse,
  portfolioId
}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingUrlCount, setPendingUrlCount] = useState(0);
  const isSuperAdmin = useSelector(userSelectors.isSuperAdmin());
  const currentUser = useSelector(userSelectors.getCurrentUser());
  const showResearchDb = currentUser?.featureFlags?.researchDatabase !== false;

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'rankings', label: 'Cluster Rankings', icon: <LeaderboardIcon /> },
    { id: 'agent', label: 'AI Agent', icon: <AutoAwesomeIcon /> },
    { id: 'extract', label: 'Extract Companies', icon: <CloudDownloadIcon /> },
    { id: 'database', label: 'Database', icon: <StorageIcon /> },
    ...(showResearchDb ? [{ id: 'researchDatabase', label: 'Public Database', icon: <TravelExploreIcon /> }] : []),
    { id: 'notifications', label: 'Notifications', icon: <NotificationsOutlinedIcon /> },
    ...(isSuperAdmin ? [{ id: 'pendingUrls', label: 'Pending Updates', icon: <LinkIcon /> }] : [])
  ];

  useEffect(() => {
    fetchNotificationCount();
    if (isSuperAdmin) {
      fetchPendingUrlCount();
    }
  }, [portfolioId, isSuperAdmin, activeSection]);

  const fetchNotificationCount = async () => {
    try {
      const portfolioParam = portfolioId ? `&portfolioId=${portfolioId}` : '';
      const [patentEvents, newsEvents] = await Promise.all([
        apiService.get(`/patent-events/user?days=${NEWS_NOTIFICATION_LOOKBACK_DAYS}${portfolioParam}`, {}, {}),
        apiService.get(`/news-events/user?days=${NEWS_NOTIFICATION_LOOKBACK_DAYS}${portfolioParam}`, {}, {})
      ]);

      const patentCount = patentEvents?.length || 0;

      // Group news by company+publishedDate (same logic as notifications view)
      const groupedNews = groupNewsByCompanyAndDate(newsEvents || []);
      const newsGroupCount = groupedNews.length;

      setNotificationCount(patentCount + newsGroupCount);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const fetchPendingUrlCount = async () => {
    try {
      const response = await apiService.get('/url-validation-events/pending');
      setPendingUrlCount(response?.length || 0);
    } catch (err) {
      console.error('Error fetching pending URL count:', err);
    }
  };

  const handleToggle = () => {
    onToggleCollapse(!collapsed);
  };

  return (
    <StyledDrawer variant="permanent" open collapsed={collapsed}>
      <Toolbar sx={{ height: HEADER_HEIGHT }}>
        <Box sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          width: '100%',
          pr: collapsed ? 0 : 2
        }}>
          <IconButton
            onClick={handleToggle}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Toolbar>
      <List sx={{ p: collapsed ? 1 : 4, pr: collapsed ? 1 : 2 }}>
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <ListItem disablePadding>
              <Tooltip
                title={collapsed ? section.label : ''}
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => onSectionChange(section.id)}
                  disableGutters
                  selected={activeSection === section.id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2,
                    minHeight: 48,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.subtle',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: collapsed ? 'auto' : 32,
                    justifyContent: 'center'
                  }}>
                    {section.id === 'extract' && extractionProgress?.active ? (
                      <Badge
                        badgeContent={extractionProgress.current}
                        color="primary"
                        max={999}
                      >
                        {section.icon}
                      </Badge>
                    ) : section.id === 'notifications' && notificationCount > 0 ? (
                      <Badge
                        badgeContent={notificationCount}
                        color="error"
                        max={99}
                      >
                        {section.icon}
                      </Badge>
                    ) : section.id === 'pendingUrls' && pendingUrlCount > 0 ? (
                      <Badge
                        badgeContent={pendingUrlCount}
                        color="warning"
                        max={99}
                      >
                        {section.icon}
                      </Badge>
                    ) : (
                      section.icon
                    )}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={section.label}
                      primaryTypographyProps={{ variant: 'bodyBold' }}
                      sx={{ m: 0 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            {index === 0 && <Divider sx={{ my: 2 }} />}
          </React.Fragment>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default CompanyExtractorSidebar;
