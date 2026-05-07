import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Stack,
  Link,
  Collapse,
  InputAdornment,
  TextField
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import UpdateIcon from '@mui/icons-material/Update';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import moment from 'moment';
import apiService from '../../../services/api/apiService';
import { groupNewsByCompanyAndDate, NEWS_NOTIFICATION_LOOKBACK_DAYS } from '../../../utils/notificationHelpers';

const Notifications = ({ portfolioId: portfolioIdProp }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const portfolioId = portfolioIdProp || searchParams.get('portfolioId');

  // Debounced search - updates searchQuery after user stops typing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear search - immediately resets both states to avoid stale data
  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const toggleCompanyExpand = useCallback((groupId) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [portfolioId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching patent and news events...');

      const portfolioParam = portfolioId ? `&portfolioId=${portfolioId}` : '';
      const [patentEvents, newsEvents] = await Promise.all([
        apiService.get(`/patent-events/user?days=${NEWS_NOTIFICATION_LOOKBACK_DAYS}${portfolioParam}`, {}, {}),
        apiService.get(`/news-events/user?days=${NEWS_NOTIFICATION_LOOKBACK_DAYS}${portfolioParam}`, {}, {})
      ]);

      console.log('Patent events:', patentEvents?.length || 0);
      console.log('News events:', newsEvents?.length || 0);

      const patents = Array.isArray(patentEvents) ? patentEvents.map(e => ({ ...e, type: 'patent' })) : [];
      const news = Array.isArray(newsEvents) ? newsEvents.map(e => ({ ...e, type: 'news' })) : [];

      // Group news by company and publishedDate (articles published same day)
      const groupedNews = groupNewsByCompanyAndDate(news);

      // Combine patents and grouped news, sort by date
      const allNotifications = [...patents, ...groupedNews].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.publishedDate);
        const dateB = new Date(b.createdAt || b.publishedDate);
        return dateB - dateA;
      });

      console.log('Total notifications:', allNotifications.length);
      setNotifications(allNotifications);

      // Default expand all news groups
      const newsGroupIds = groupedNews.map(group => group.groupId);
      setExpandedCompanies(new Set(newsGroupIds));
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (!searchQuery) {
      return notifications;
    }
    const query = searchQuery.toLowerCase();
    return notifications.filter((notification) => {
      if (notification.type === 'newsGroup') {
        return notification.companyName?.toLowerCase().includes(query);
      }
      const companyName = notification.companyExtractionData?.companyName || '';
      return companyName.toLowerCase().includes(query);
    });
  }, [notifications, searchQuery]);

  const getEventIcon = (notification) => {
    if (notification.type === 'news') {
      return <ArticleIcon color="info" />;
    }

    switch (notification.eventType) {
      case 'NEW_PATENT':
        return <NewReleasesIcon color="primary" />;
      case 'PATENT_COUNT_CHANGE':
        return <TrendingUpIcon color="success" />;
      case 'STATUS_CHANGE':
        return <UpdateIcon color="info" />;
      case 'CITED_BY_CHANGE':
        return <CheckCircleIcon color="secondary" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getEventDescription = (notification) => {
    if (notification.type === 'news') {
      return notification.title;
    }

    const patentNumber = notification.companyPatent?.patentNumber || '';
    const patentTitle = notification.companyPatent?.title || '';
    const patentJurisdictions = notification.companyPatent?.patentJurisdictions || '';
    const patentStatus = notification.companyPatent?.patentStatus || '';

    let description = '';
    switch (notification.eventType) {
      case 'NEW_PATENT':
        description = patentNumber ? `New patent found: ${patentNumber}` : 'New patent found';
        break;

      case 'PATENT_COUNT_CHANGE':
        const oldCount = parseInt(notification.oldValue) || 0;
        const newCount = parseInt(notification.newValue) || 0;
        description = `Patent count increased by ${newCount - oldCount} (from ${oldCount} to ${newCount})`;
        break;

      case 'CITED_BY_CHANGE':
        description = `Patent ${patentNumber} cited by count changed from ${notification.oldValue} to ${notification.newValue}`;
        break;

      case 'STATUS_CHANGE':
        description = `Patent ${patentNumber} status changed from ${notification.oldValue} to ${notification.newValue}`;
        break;

      default:
        description = `Patent event: ${notification.eventType}`;
    }

    const details = [];

    if (patentTitle) {
      details.push(`Patent: ${patentTitle}`);
    }

    if (patentJurisdictions) {
      let formattedJurisdictions = '';
      try {
        const jurisdictions = typeof patentJurisdictions === 'string'
          ? JSON.parse(patentJurisdictions)
          : patentJurisdictions;

        if (Array.isArray(jurisdictions)) {
          const codes = jurisdictions.map(j => j.code || j).join(', ');
          formattedJurisdictions = codes;
        } else {
          formattedJurisdictions = patentJurisdictions;
        }
      } catch (e) {
        formattedJurisdictions = patentJurisdictions;
      }
      details.push(`Geography: ${formattedJurisdictions}`);
    }

    // Skip status line for STATUS_CHANGE events (redundant with description)
    if (patentStatus && notification.eventType !== 'STATUS_CHANGE') {
      details.push(`Status: ${patentStatus}`);
    }

    if (details.length > 0) {
      const enhancedDescription = `${description}\n${details.join('\n')}`;
      return enhancedDescription;
    }

    return description;
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay updated with recent news articles and patent activities
        </Typography>
      </Box>

      <Box mb={2}>
        <TextField
          placeholder="Search by company name..."
          variant="outlined"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={clearSearch}
                  edge="end"
                  aria-label="clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            width: 400,
            '& .MuiInputBase-root': {
              borderRadius: 2,
              backgroundColor: 'white'
            }
          }}
        />
      </Box>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery.trim()
                  ? 'No matching notifications'
                  : 'No new notifications'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery.trim()
                  ? 'Try adjusting your search terms'
                  : 'No recent notifications to display'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {filteredNotifications.map((notification, index) => {
                // Handle grouped news
                if (notification.type === 'newsGroup') {
                  const isExpanded = expandedCompanies.has(notification.groupId);
                  const articles = notification.articles || [];
                  const visibleArticles = isExpanded ? articles : [];

                  return (
                    <React.Fragment key={`news-group-${notification.groupId}`}>
                      <ListItemButton
                        onClick={() => toggleCompanyExpand(notification.groupId)}
                        sx={{
                          py: 2,
                          px: 3,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <ArticleIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" component="span">
                              {notification.companyName} In The News
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {moment(notification.publishedDate).fromNow()}
                            </Typography>
                          }
                        />
                        <IconButton size="small">
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </ListItemButton>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ backgroundColor: '#fafafa' }}>
                          {visibleArticles.map((article, articleIndex) => (
                            <Link
                              key={article.id}
                              href={article.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="none"
                              color="inherit"
                            >
                              <ListItem
                                sx={{
                                  pl: 9,
                                  py: 1.5,
                                  '&:hover': {
                                    backgroundColor: 'action.hover'
                                  },
                                  cursor: 'pointer'
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" color="text.primary">
                                      {article.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Stack spacing={0.3} mt={0.5}>
                                      {article.source && (
                                        <Typography variant="caption" color="text.secondary">
                                          Source: {article.source}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" color="text.secondary">
                                        {moment(article.publishedDate || article.createdAt).fromNow()}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                              </ListItem>
                              {articleIndex < visibleArticles.length - 1 && (
                                <Divider sx={{ ml: 9 }} />
                              )}
                            </Link>
                          ))}
                        </List>
                      </Collapse>

                      {index < filteredNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                }

                // Handle individual patent events
                const itemContent = (
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getEventIcon(notification)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" component="span">
                          {notification.companyExtractionData?.companyName || 'Unknown Company'}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5} mt={1}>
                          <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
                            {getEventDescription(notification)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {moment(notification.createdAt || notification.publishedDate).fromNow()}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                );

                return (
                  <React.Fragment key={notification.id}>
                    {itemContent}
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Notifications;