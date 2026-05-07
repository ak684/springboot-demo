import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Grid,
  Skeleton,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Tooltip,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import { v1 } from 'services/api';
import CustomRankingBuilder from './CustomRankingBuilder';

const RANKING_TABS = [
  { id: 'business_model', label: 'SBMO' },
  { id: 'portfolio_rank', label: 'Portfolio rank' },
  { id: 'portfolio_rank_v2', label: 'Portfolio rank v2' },
  { id: 'growth_likelihood', label: 'Growth likelihood' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'custom', label: 'Custom' }
];

// Define cluster display order
const CLUSTER_ORDER = [
  'Renewable Energy/Photovoltaics',
  'Biotechnology/Environment',
  'Microsystems/Materials',
  'Photonics/Optics',
  'IT/Media',
  'General – Non-Cluster'
];

const ClusterRankingCard = ({
  clusterName,
  companies,
  totalCompanies,
  scoreLabel,
  isLoading,
  onCompanyClick,
  expanded,
  onToggleExpand
}) => {
  const maxScore = companies.length > 0
    ? Math.max(...companies.map(c => c.score || 0))
    : 100;

  if (isLoading) {
    return (
      <Card sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        height: '100%'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="30%" height={24} />
        </Box>
        {[...Array(8)].map((_, i) => (
          <Box key={i} display="flex" alignItems="center" gap={1} mb={1.5}>
            <Skeleton variant="text" width={20} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" height={16} sx={{ flex: 1 }} />
            <Skeleton variant="text" width={30} />
          </Box>
        ))}
      </Card>
    );
  }

  const displayCompanies = expanded ? companies : companies.slice(0, 8);

  return (
    <Card sx={{
      p: 3,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Card Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="600">
          {clusterName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {scoreLabel}
        </Typography>
      </Box>

      {/* Ranked Companies List */}
      <Box sx={{ flex: 1 }}>
        {displayCompanies.map((company, index) => (
          <Box
            key={company.id}
            display="flex"
            alignItems="center"
            gap={1.5}
            mb={1.5}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderRadius: 1,
                mx: -1,
                px: 1
              }
            }}
            onClick={() => onCompanyClick && onCompanyClick(company)}
          >
            {/* Rank Number */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minWidth: 20,
                textAlign: 'right',
                fontWeight: 500
              }}
            >
              {index + 1}
            </Typography>

            {/* Company Name */}
            <Typography
              variant="body2"
              sx={{
                width: 200,
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {company.companyName}
            </Typography>

            {/* Score Bar */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  height: 16,
                  backgroundColor: 'primary.main',
                  borderRadius: 1,
                  width: `${maxScore > 0 ? (company.score / maxScore) * 100 : 0}%`,
                  minWidth: company.score > 0 ? 8 : 0,
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </Box>

            {/* Score Value */}
            <Typography
              variant="body2"
              fontWeight="600"
              sx={{ minWidth: 50, flexShrink: 0, textAlign: 'right' }}
            >
              {typeof company.score === 'number'
                ? company.score.toLocaleString()
                : company.score}
            </Typography>
          </Box>
        ))}

        {companies.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No companies in this cluster
          </Typography>
        )}
      </Box>

      {/* Show More/Less Button */}
      {totalCompanies > 8 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Button
            size="small"
            onClick={onToggleExpand}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: 'none' }}
          >
            {expanded ? 'Show less' : `Show all ${totalCompanies}`}
          </Button>
        </Box>
      )}
    </Card>
  );
};

const ClusterRankings = ({ portfolioId, onOpenProfile, selectedTags = [], onTagsChange, allTags = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rankingsData, setRankingsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClusters, setExpandedClusters] = useState({});
  const [customMetrics, setCustomMetrics] = useState([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const currentRankBy = RANKING_TABS[activeTab]?.id || 'portfolio_rank';

  const fetchRankings = useCallback(async (rankBy, metrics = []) => {
    setIsLoading(true);
    try {
      const params = {
        rankBy,
        limit: 50 // Fetch more to support expansion
      };
      if (portfolioId) {
        params.portfolioId = portfolioId;
      }
      if (rankBy === 'custom' && metrics.length > 0) {
        // Join as comma-separated string for Spring @RequestParam List<String>
        params.metrics = metrics.join(',');
      }
      if (selectedTags && selectedTags.length > 0) {
        // Join as comma-separated string for Spring @RequestParam List<String>
        params.tags = selectedTags.join(',');
      }

      const response = await v1.get('/companies/cluster-rankings', { params });
      setRankingsData(response.data);
    } catch (error) {
      console.error('Error fetching cluster rankings:', error);
      setRankingsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, selectedTags]);

  useEffect(() => {
    if (currentRankBy === 'custom') {
      if (customMetrics.length > 0) {
        fetchRankings(currentRankBy, customMetrics);
      }
    } else {
      fetchRankings(currentRankBy);
    }
  }, [currentRankBy, customMetrics, fetchRankings, selectedTags]);

  const handleTabChange = (event, newValue) => {
    const newRankBy = RANKING_TABS[newValue]?.id;
    // If switching to custom tab and no metrics selected, open the builder
    if (newRankBy === 'custom' && customMetrics.length === 0) {
      setIsBuilderOpen(true);
    }
    setActiveTab(newValue);
    setExpandedClusters({}); // Reset expansions on tab change
  };

  const handleApplyCustomMetrics = (metrics) => {
    setCustomMetrics(metrics);
    // If not already on custom tab, switch to it
    const customTabIndex = RANKING_TABS.findIndex(t => t.id === 'custom');
    if (customTabIndex !== -1 && activeTab !== customTabIndex) {
      setActiveTab(customTabIndex);
    }
  };

  const handleToggleExpand = (clusterName) => {
    setExpandedClusters(prev => ({
      ...prev,
      [clusterName]: !prev[clusterName]
    }));
  };

  const handleCompanyClick = (company) => {
    if (onOpenProfile) {
      onOpenProfile({ id: company.id });
    }
  };

  // Get clusters data
  const clusters = rankingsData?.clusters || {};
  // Sort cluster names by defined order
  const clusterNames = Object.keys(clusters).sort((a, b) => {
    const indexA = CLUSTER_ORDER.indexOf(a);
    const indexB = CLUSTER_ORDER.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Get score label based on current tab
  const getScoreLabel = () => {
    switch (currentRankBy) {
      case 'custom':
        return 'Custom Score';
      case 'business_model':
        return 'SBMO Score';
      case 'growth_likelihood':
        return 'Growth Score';
      case 'traffic':
        return 'Monthly Traffic';
      case 'portfolio_rank_v2':
        return 'Portfolio Score v2';
      case 'portfolio_rank':
      default:
        return 'Portfolio Score';
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">
          Top Sustainability Impact Rankings by Technology Cluster
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tag Filter */}
          {allTags.length > 0 && onTagsChange && (
            <Autocomplete
              multiple
              options={allTags}
              value={selectedTags || []}
              onChange={(_, newValue) => onTagsChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Filter by tags..."
                  size="small"
                  sx={{
                    minWidth: 300,
                    '& .MuiInputBase-root': {
                      borderRadius: 2
                    }
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    size="small"
                    label={option}
                    {...getTagProps({ index })}
                    sx={{
                      height: '20px',
                      fontSize: '0.7rem',
                      '& .MuiChip-label': {
                        padding: '0 6px',
                        fontSize: '0.7rem'
                      },
                      '& .MuiChip-deleteIcon': {
                        fontSize: '14px',
                        margin: '0 2px 0 -2px'
                      }
                    }}
                  />
                ))
              }
            />
          )}
          <TextField
            placeholder="Search"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              mx: 0.5,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white'
              }
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          {RANKING_TABS.map((tab) => (
            <Tab key={tab.id} label={tab.label} />
          ))}
        </Tabs>
        {currentRankBy === 'custom' && (
          <Tooltip title="Configure custom metrics">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setIsBuilderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              {customMetrics.length > 0
                ? `${customMetrics.length} metrics`
                : 'Select metrics'}
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* Cluster Cards Grid */}
      <Grid container spacing={3}>
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <ClusterRankingCard
                clusterName=""
                companies={[]}
                totalCompanies={0}
                scoreLabel=""
                isLoading={true}
              />
            </Grid>
          ))
        ) : (
          clusterNames.map((clusterName) => {
            const clusterData = clusters[clusterName];
            const companies = clusterData?.companies || [];
            const totalCompanies = clusterData?.totalCompanies || 0;

            // Filter by search term if provided
            const filteredCompanies = searchTerm
              ? companies.filter(c =>
                  c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : companies;

            return (
              <Grid item xs={12} md={6} key={clusterName}>
                <ClusterRankingCard
                  clusterName={clusterName}
                  companies={filteredCompanies}
                  totalCompanies={totalCompanies}
                  scoreLabel={getScoreLabel()}
                  isLoading={false}
                  onCompanyClick={handleCompanyClick}
                  expanded={expandedClusters[clusterName]}
                  onToggleExpand={() => handleToggleExpand(clusterName)}
                />
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Empty State */}
      {!isLoading && clusterNames.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          py={8}
          gap={2}
        >
          {currentRankBy === 'custom' && customMetrics.length === 0 ? (
            <>
              <Typography variant="body1" color="text.secondary">
                Select metrics to create a custom ranking
              </Typography>
              <Button
                variant="contained"
                startIcon={<TuneIcon />}
                onClick={() => setIsBuilderOpen(true)}
              >
                Select Metrics
              </Button>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No cluster rankings available
            </Typography>
          )}
        </Box>
      )}

      {/* Custom Ranking Builder Dialog */}
      <CustomRankingBuilder
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onApply={handleApplyCustomMetrics}
        initialMetrics={customMetrics}
      />
    </Box>
  );
};

export default ClusterRankings;
