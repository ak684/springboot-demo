import React, { useState, useRef, useEffect, useMemo } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Divider,
  Paper,
  TextField,
  Typography,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TableSortLabel,
  Autocomplete,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { v1, v1LongTimeout } from "services/api";

import { toast } from "react-toastify";

import CompanyProfileModal from './CompanyProfileModal';
import SmartTooltip from './components/SmartTooltip';

import CompanyExtractorMap from './components/CompanyExtractorMap';
import CompanyExtractorLayout from './components/CompanyExtractorLayout';
import CompanyExtractorDashboard from './components/CompanyExtractorDashboard';
import CompanyExtractorMapDashboard from './components/CompanyExtractorMapDashboard';
import ClusterRankings from './components/ClusterRankings';
import ExtractionPanel from './components/ExtractionPanel';
import Notifications from '../notifications/Notifications';
import PendingUpdates from './PendingUpdates';
import PortfolioAgentChat from './components/PortfolioAgentChat';
import ResearchDatabase from './components/ResearchDatabase';

import MapIcon from '@mui/icons-material/Map';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const tableRowFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const SuperAdminCompanyExtractor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams();

  // Get portfolio ID from route params (for /portfolios/:portfolioId/...) or query params (for global view)
  const searchParams = new URLSearchParams(window.location.search);
  const portfolioId = routeParams.portfolioId || searchParams.get('portfolioId');
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioValidated, setPortfolioValidated] = useState(!portfolioId); // If no portfolioId, consider validated
  const [portfolioError, setPortfolioError] = useState(false);
  const [isValidating, setIsValidating] = useState(!!portfolioId); // Only validate if portfolioId exists

  const [companyUrl, setCompanyUrl] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [gridData, setGridData] = useState([]);

  const [extractionStats, setExtractionStats] = useState({
    totalFields: 0,
    foundFields: 0,
    notFoundFields: 0
  });
  const [portfolioTotals, setPortfolioTotals] = useState({
    totalCompanies: 0,
    totalEmployees: 0,
    totalPatents: 0,
    totalSocialMediaFollowers: 0,
    companiesWithImpact: 0,
    companiesWithCertifications: 0
  });
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [failedImageUrls, setFailedImageUrls] = useState(new Set()); // Keep for logo failure tracking

  // State for company profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // In-memory cache for profile data to avoid redundant API calls
  const profileCache = useRef({});


  

  // State for table sorting (client-side)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // State for column freezing
  const [columnsFixed, setColumnsFixed] = useState(true);

  // One-time cleanup of old cache format on component mount
  useEffect(() => {
    try {
      localStorage.removeItem('companyExtractor.portfolioTotals');
      localStorage.removeItem('companyExtractor.locations');
    } catch (error) {
      console.error('[Cache] Failed to clean up old cache:', error);
    }
  }, []);

  // State for tags
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const tagCounts = useMemo(() => {
    const counts = new Map();
    gridData.forEach(company => {
      const companyTags = company.tags || [];
      companyTags.forEach(tag => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
  }, [gridData]);


  // State for view mode (table or map)
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'

  // Default visible columns - these show by default when no user preference exists
  const DEFAULT_VISIBLE_COLUMNS = [
    'actions',           // Profile button - REQUIRED
    'company_name',      // Company Name - REQUIRED
    'created_at',        // Date Added
    'url',               // Company URL
    'company_description', // Description
    'public_profile',    // Public profile link
    'portfolio_rank',    // Portfolio Rank
    'portfolio_rank_v2', // Portfolio Rank V2
    'headquarter_address', // HQ Address
    'company_logo',      // Logo
    'technology_cluster' // Tech Cluster
  ];

  // Required columns that cannot be hidden
  const REQUIRED_COLUMNS = ['actions', 'company_name'];

  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storageKey = `companyExtractor.visibleColumns.${portfolioId || 'default'}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backfill any default columns added since prefs were saved so new
        // default columns aren't silently hidden from existing users.
        const missingDefaults = DEFAULT_VISIBLE_COLUMNS.filter(
          (col) => !parsed.includes(col)
        );
        return missingDefaults.length ? [...parsed, ...missingDefaults] : parsed;
      }
    } catch (error) {
      console.error('[Columns] Failed to load column preferences:', error);
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // State for Edit View dialog
  const [editViewDialogOpen, setEditViewDialogOpen] = useState(false);
  const [columnsBeforeEdit, setColumnsBeforeEdit] = useState(null);

  // Save visible columns to localStorage when they change
  useEffect(() => {
    const storageKey = `companyExtractor.visibleColumns.${portfolioId || 'default'}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('[Columns] Failed to save column preferences:', error);
    }
  }, [visibleColumns, portfolioId]);

  // State for section navigation
  const [activeSection, setActiveSection] = useState('dashboard');

  // State for extraction progress (non-blocking)
  const [extractionProgress, setExtractionProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    currentCompany: ''
  });
  

  
  // Removed pagination - now loading all companies

  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pre-warm AI agent file cache when page loads (any section)
  useEffect(() => {
    if (portfolioId) {
      v1LongTimeout.post('/portfolio-agent/warm-up', {
        portfolioId: parseInt(portfolioId, 10),
        messages: []
      }).catch(() => {});
    }
  }, [portfolioId]);

  // Validate portfolio exists and load portfolio name if filtered by portfolio
  useEffect(() => {
    if (portfolioId) {
      setIsValidating(true);
      v1.get(`/portfolios/${portfolioId}`)
        .then(response => {
          setPortfolioName(response.data.name);
          setPortfolioValidated(true);
          setPortfolioError(false);
          setIsValidating(false);
        })
        .catch(error => {
          console.error('Error loading portfolio:', error);
          if (error.response && error.response.status === 404) {
            setPortfolioError(true);
            setPortfolioValidated(false);
            navigate('/404');
          } else if (error.response && error.response.status === 403) {
            setPortfolioError(true);
            setPortfolioValidated(false);
            toast.error('You do not have access to this portfolio');
            navigate('/portfolios');
          } else {
            // For other errors, still show the page but with a warning
            setPortfolioName('Portfolio');
            setPortfolioValidated(true);
            setPortfolioError(false);
          }
          setIsValidating(false);
        });
    }
  }, [portfolioId, navigate]);

  // Debounced search effect - updates searchTerm after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Load cached data immediately on component mount (before any API calls)
  useEffect(() => {
    const cachedData = getCachedPortfolioTotals();
    if (cachedData) {
      setPortfolioTotals(cachedData);
    }
  }, []); // Only run once on mount

  // Load companies on component mount (tags are now included in the lite response)
  useEffect(() => {
    loadAllCompanies();
    loadPortfolioTotals();
  }, [searchTerm, portfolioId]); // Reload when search or portfolio changes

  // Helper function to clear search
  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  // loadTags function removed - tags are now included in the lite endpoint response

  // Helper functions for localStorage caching of portfolio totals
  const getCachedPortfolioTotals = () => {
    try {
      const cacheKey = portfolioId
        ? `companyExtractor.portfolioTotals.${portfolioId}`
        : 'companyExtractor.portfolioTotals.all';
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Check if cache is older than 1 hour (3600000 ms)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - timestamp > oneHour) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Cache] Failed to read cache:', error);
      const cacheKey = portfolioId
        ? `companyExtractor.portfolioTotals.${portfolioId}`
        : 'companyExtractor.portfolioTotals.all';
      localStorage.removeItem(cacheKey);
      return null;
    }
  };

  const setCachedPortfolioTotals = (data) => {
    try {
      const cacheKey = portfolioId
        ? `companyExtractor.portfolioTotals.${portfolioId}`
        : 'companyExtractor.portfolioTotals.all';
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[Cache] Failed to save cache:', error);
    }
  };

  const clearCachedPortfolioTotals = () => {
    try {
      const cacheKey = portfolioId
        ? `companyExtractor.portfolioTotals.${portfolioId}`
        : 'companyExtractor.portfolioTotals.all';
      localStorage.removeItem(cacheKey);
      localStorage.removeItem('companyExtractor.portfolioTotals');
    } catch (error) {
      console.error('[Cache] Failed to clear cache:', error);
    }
  };

  const clearCachedCompanyLocations = () => {
    const cacheKey = portfolioId
      ? `companyExtractor.locations.${portfolioId}`
      : 'companyExtractor.locations.all';
    localStorage.removeItem(cacheKey);

    // Also clear old non-portfolio-specific cache if exists
    localStorage.removeItem('companyExtractor.locations');
  };

  const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0));

  const loadPortfolioTotals = async (skipCache = false) => {
    // Show cached data immediately (if available and not skipping cache)
    if (!skipCache) {
      const cachedData = getCachedPortfolioTotals();
      if (cachedData) {
        setPortfolioTotals(cachedData);
      }
    }

    try {
      // Fetch fresh data from server
      const response = await v1LongTimeout.get('/companies/totals', {
        params: { portfolioId: portfolioId ? parseInt(portfolioId, 10) : undefined }
      });

      // Update state with fresh data
      setPortfolioTotals(response.data);

      // Cache the fresh data
      setCachedPortfolioTotals(response.data);

    } catch (error) {
      console.error('[Portfolio] Failed to load totals:', error.message);

      // Check if it's a 404 error for non-existent portfolio
      if (error.response && error.response.status === 404 && portfolioId) {
        navigate('/404');
      } else {
        toast.error('Failed to load portfolio totals');
      }
    }
  };

  const loadAllCompanies = async (fieldsOverride = null) => {
    const startTime = performance.now();

    try {
      setIsLoading(true);
      setFailedImageUrls(new Set());

      const fieldsToRequest = fieldsOverride || visibleColumns;

      // Filter out UI-only columns that don't need backend data
      const UI_ONLY_COLUMNS = ['actions', 'public_profile'];
      const backendFields = fieldsToRequest.filter(col => !UI_ONLY_COLUMNS.includes(col));

      // Always include 'tags' for filtering functionality, even if not visible in table
      if (!backendFields.includes('tags')) {
        backendFields.push('tags');
      }

      // Always include fields needed by the Research Database view
      const researchDbFields = [
        'latitude', 'longitude', 'sdgs', 'geographic_scope_estimated',
        'number_of_employees', 'legal_entity_formation_date',
        'overall_impact_potential_score', 'impact_magnitude_5_year',
        'impact_magnitude_5_year_negative', 'impact_likelihood',
        'public_impact_summary',
        'industry_sectors', 'total_funding_amount', 'funding_currency',
        'company_logo', 'company_description', 'headquarter_address',
        'technology_cluster', 'venture_id', 'social_media_follower_counts',
      ];
      researchDbFields.forEach(f => {
        if (!backendFields.includes(f)) {
          backendFields.push(f);
        }
      });

      const params = {
        page: 0,
        size: 5000,
        fields: backendFields.join(','),
      };

      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (portfolioId) {
        params.portfolioId = parseInt(portfolioId, 10);
      }

      const response = await v1LongTimeout.get('/companies/lite', {
        params: params
      });

      if (response.data) {
        const { content, availableTags } = response.data;

        // Update tags from the lite response
        if (availableTags && Array.isArray(availableTags)) {
          console.log('[Tags] Updating allTags from /lite response:', availableTags);
          setAllTags(availableTags);
          // Let the tag filter render before heavy row transforms begin.
          await yieldToMainThread();
        } else {
          console.log('[Tags] No availableTags in response or not an array:', availableTags);
        }

        // Transform large datasets in chunks so the UI stays responsive.
        const transformedData = [];
        const chunkSize = 250;
        for (let idx = 0; idx < content.length; idx += chunkSize) {
          const chunk = content.slice(idx, idx + chunkSize).map((company) => {
            try {
              return transformDataForGrid(company, company.url || company.company_url, company.id);
            } catch (error) {
              console.error('[Data] Transform failed for company:', company.company_name, error);
              throw error;
            }
          });
          transformedData.push(...chunk);
          if (idx + chunkSize < content.length) {
            await yieldToMainThread();
          }
        }

        setGridData(transformedData);
        setExtractionStats(calculateAggregateStats(transformedData));
        setShowResults(true);

        if (content.length === 0 && !searchTerm) {
          toast.info('No companies found in database. Extract some companies to get started!');
        }

        // High-signal status log
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Companies] Loaded ${content.length} companies in ${duration}s${searchTerm ? ` (search: "${searchTerm}")` : ''}${portfolioId ? ` (portfolio: ${portfolioId})` : ''}`);
      } else {
        setGridData([]);
        setExtractionStats({});
      }
    } catch (error) {
      console.error('[Companies] Load failed:', error.message);

      if (error.response && error.response.status === 404 && portfolioId) {
        navigate('/404');
      } else {
        toast.error('Failed to load companies from database: ' + (error.message || 'Unknown error'));
      }

      setGridData([]);
      setExtractionStats({});
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle client-side column sorting
  const handleSort = (columnId) => {
    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    const direction = isAsc ? 'desc' : 'asc';

    setSortConfig({ key: columnId, direction });

    // Apply client-side sorting to gridData
    const sortedData = [...gridData].sort((a, b) => {
      const aValue = a[columnId];
      const bValue = b[columnId];

      // Handle null/undefined/N/A values
      if (aValue === null || aValue === undefined || aValue === 'N/A' || aValue === '') {
        return direction === 'asc' ? 1 : -1;
      }
      if (bValue === null || bValue === undefined || bValue === 'N/A' || bValue === '') {
        return direction === 'asc' ? -1 : 1;
      }

      // Define numeric columns that should be sorted numerically even if stored as strings
      const numericColumns = [
        'total_patents', 'number_of_employees',
        'sbmo_total_score', 'sbmo_criteria_a_score',
        'sbmo_criteria_b_score', 'sbmo_criteria_c_score', 'sbmo_criteria_d_score',
        'esg_risk_environmental_inherent', 'esg_risk_environmental_adjusted',
        'esg_risk_social_inherent', 'esg_risk_social_adjusted',
        'esg_risk_governance_inherent', 'esg_risk_governance_adjusted',
        'esg_risk_total_inherent', 'esg_risk_total_adjusted',
        'portfolio_rank', 'portfolio_rank_v2',
        'venture_platform_percentile', 'venture_platform_percentile_v2',
        'growth_media_reach_score', 'growth_sentiment_score',
        'growth_innovation_visibility_score', 'growth_team_strength_score',
        'growth_funding_velocity_score', 'growth_company_age_score',
        'growth_composite_score', 'venture_platform_score_v2'
      ];

      // Handle date columns
      if (columnId === 'created_at' || columnId === 'last_modified_at') {
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Handle numeric columns (convert strings to numbers for comparison)
      if (numericColumns.includes(columnId)) {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle already numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    setGridData(sortedData);
  };

  // Function to get filtered data (sorting is handled client-side)
  const getSortedData = () => {
    // Handle null or undefined gridData
    if (!gridData) return [];

    let filteredData = gridData;

    // Filter by selected tags if any
    if (selectedTags.length > 0) {
      filteredData = gridData.filter(company => {
        // Check if company has any of the selected tags
        const companyTags = company.tags || [];
        return selectedTags.some(tag => companyTags.includes(tag));
      });
    }

    return filteredData;
  };


  const handleExtract = async () => {
    try {
      const urls = companyUrl.split(',').map(url => url.trim()).filter(url => url !== '');
    
    if (urls.length === 0) {
      toast.error('Please enter at least one company URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/;
    const invalidUrls = urls.filter(url => !urlPattern.test(url));

    if (invalidUrls.length > 0) {
      toast.error(`Found ${invalidUrls.length} invalid URLs. Please check your input.`);
      return;
    }

    setExtractionProgress({
      active: true,
      current: 0,
      total: urls.length,
      currentCompany: ''
    });
    
    toast.info(`Starting extraction of ${urls.length} companies...`, {
      icon: <CloudDownloadIcon />
    });
    
    // Process without blocking UI
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      setExtractionProgress(prev => ({
        ...prev,
        current: i + 1,
        currentCompany: url
      }));
      
      try {
        const response = await v1LongTimeout.post('/companies', {
          url: url,
          portfolioId: portfolioId ? parseInt(portfolioId, 10) : null
        });
        
        // Safely get hostname for display
        let displayName = url;
        try {
          displayName = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch (e) {
          // If URL parsing fails, just use the original URL
        }
        toast.success(`✓ Extracted: ${displayName}`);
      } catch (error) {
        console.error('[handleExtract] API error for URL:', url, error);
        // Safely get hostname for error display
        let displayName = url;
        try {
          displayName = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        } catch (e) {
          // If URL parsing fails, just use the original URL
        }
        toast.error(`✗ Failed: ${displayName} - ${error.message}`);
      }
    }
    
    setExtractionProgress({ active: false, current: 0, total: 0, currentCompany: '' });
    loadAllCompanies();

    // Clear cache and reload totals since we added/updated companies
    clearCachedPortfolioTotals();
    clearCachedCompanyLocations();
    loadPortfolioTotals(true); // Skip cache since we know data changed
    } catch (error) {
      console.error('[handleExtract] Unexpected error:', error);
      toast.error(`Extraction failed: ${error.message}`);
      setExtractionProgress({ active: false, current: 0, total: 0, currentCompany: '' });
    }
  };

  // Helper function to calculate aggregate statistics from multiple rows
  const calculateAggregateStats = (gridData) => {
    if (!gridData || gridData.length === 0) {
      return {
        totalFields: 0,
        foundFields: 0,
        notFoundFields: 0
      };
    }

    // Define the fields we're tracking
    const fieldNames = [
      'company_name', 'company_description', 'legal_entity_formed',
      'legal_entity_formation_date', 'legal_form', 'type_of_legal_entity',
      'headquarter_address', 'phone_number', 'contact_email', 'ceo_name',
      'number_of_employees', 'annual_sales_2022', 'annual_sales_2023', 'annual_sales_2024',
      'currency_2022', 'currency_2023', 'currency_2024', 'total_funding_amount', 'funding_currency', 'total_funding_amount_type', 'total_patents', 'industry_sectors',
      'company_logo',
      'technology_cluster', 'cluster_confidence_score',
      'cluster_reasoning', 'is_fintech', 'fintech_confidence_score', 'fintech_explanation',
      'certification_name', 'certification_link',
      'esg_impact_report', 'esg_report_year', 'esg_report_link',
      'prize_award_name_1', 'prize_award_link_1', 'prize_award_name_2', 'prize_award_link_2',
      // Phase 4: ESG Materiality fields
      'primary_industry_standard', 'secondary_industry_standard', 'esg_materiality_analysis', 'esg_sb_scores_sum'
    ];

    const socialMediaPlatforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok', 'bluesky'];

    const totalFieldsPerRow = fieldNames.length + (socialMediaPlatforms.length * 2); // Double for links and follower counts
    const totalFields = totalFieldsPerRow * gridData.length;

    let totalFoundFields = 0;

    // Count found fields across all rows
    gridData.forEach(row => {
      fieldNames.forEach(field => {
        const value = row[field];
        if (value && value !== 'N/A') {
          totalFoundFields++;
        }
      });

      // Count social media fields
      socialMediaPlatforms.forEach(platform => {
        if (row[`social_media_${platform}`] && row[`social_media_${platform}`] !== 'N/A') {
          totalFoundFields++;
        }
        if (row[`social_media_${platform}_followers`] && row[`social_media_${platform}_followers`] !== 'N/A') {
          totalFoundFields++;
        }
      });
    });

    return {
      totalFields,
      foundFields: totalFoundFields,
      notFoundFields: totalFields - totalFoundFields
    };
  };

  // Helper function to check if a field has a valid value
  const hasValue = (value) => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  };

  // Helper function to calculate the sum of S and B scores from ESG materiality analysis
  const calculateEsgSbScoresSum = (esgMaterialityAnalysis) => {
    if (!esgMaterialityAnalysis || !esgMaterialityAnalysis.topics || !Array.isArray(esgMaterialityAnalysis.topics)) {
      return 0;
    }

    return esgMaterialityAnalysis.topics.reduce((sum, topic) => {
      const stakeholderScore = parseInt(topic.stakeholder_importance) || 0;
      const businessScore = parseInt(topic.business_importance) || 0;
      return sum + stakeholderScore + businessScore;
    }, 0);
  };

  // Helper function to calculate combined E score from ESG materiality analysis
  const calculateEsgEnvironmentalScore = (esgMaterialityAnalysis) => {
    if (!esgMaterialityAnalysis || !esgMaterialityAnalysis.topics || !Array.isArray(esgMaterialityAnalysis.topics)) {
      return 0;
    }

    return esgMaterialityAnalysis.topics
      .filter(topic => topic.category === 'E')
      .reduce((sum, topic) => {
        const stakeholderScore = parseInt(topic.stakeholder_importance) || 0;
        const businessScore = parseInt(topic.business_importance) || 0;
        return sum + stakeholderScore + businessScore;
      }, 0);
  };

  // Helper function to calculate combined S score from ESG materiality analysis
  const calculateEsgSocialScore = (esgMaterialityAnalysis) => {
    if (!esgMaterialityAnalysis || !esgMaterialityAnalysis.topics || !Array.isArray(esgMaterialityAnalysis.topics)) {
      return 0;
    }

    return esgMaterialityAnalysis.topics
      .filter(topic => topic.category === 'S')
      .reduce((sum, topic) => {
        const stakeholderScore = parseInt(topic.stakeholder_importance) || 0;
        const businessScore = parseInt(topic.business_importance) || 0;
        return sum + stakeholderScore + businessScore;
      }, 0);
  };

  // Helper function to calculate combined G score from ESG materiality analysis
  const calculateEsgGovernanceScore = (esgMaterialityAnalysis) => {
    if (!esgMaterialityAnalysis || !esgMaterialityAnalysis.topics || !Array.isArray(esgMaterialityAnalysis.topics)) {
      return 0;
    }

    return esgMaterialityAnalysis.topics
      .filter(topic => topic.category === 'G')
      .reduce((sum, topic) => {
        const stakeholderScore = parseInt(topic.stakeholder_importance) || 0;
        const businessScore = parseInt(topic.business_importance) || 0;
        return sum + stakeholderScore + businessScore;
      }, 0);
  };

  // Transform the extracted data into a format suitable for the data grid
  const transformDataForGrid = (data, url, rowId) => {
    if (!data) {
      console.error('[Data] Transform error: No data provided');
      return null;
    }

    // Extract the actual data from the response (handle nested data structure)
    const actualData = data.data || data;

    // Ensure we have the url field if it's missing
    if (!actualData.url && url) {
      actualData.url = url;
    }

    // Create a row for the data grid
    const row = {
      id: actualData.id || rowId, // Use the database ID if available, otherwise use provided rowId
      url: url,
      company_name: actualData.company_name || 'N/A',
      created_at: actualData.created_at || null,
      company_description: actualData.company_description || 'N/A',
      legal_entity_formation_date: actualData.legal_entity_formation_date || 'N/A',
      legal_form: actualData.legal_form || 'Unknown',
      headquarter_address: actualData.headquarter_address || 'N/A',
      phone_number: actualData.phone_number || 'N/A',
      contact_email: actualData.contact_email || 'N/A',
      ceo_name: actualData.ceo_name || 'N/A',
      number_of_employees: actualData.number_of_employees || 'N/A',
      total_funding_amount: actualData.total_funding_amount || 'N/A',
      funding_currency: actualData.funding_currency || 'N/A',
      total_funding_amount_type: actualData.total_funding_amount_type || 'N/A',
      annual_sales_legacy: actualData.annual_sales || actualData.annual_sales_legacy || 'N/A',
      annual_sales_2022: actualData.annual_sales_2022 || 'N/A',
      annual_sales_2023: actualData.annual_sales_2023 || 'N/A',
      annual_sales_2024: actualData.annual_sales_2024 || 'N/A',
      currency_2022: actualData.currency_2022 || '',
      currency_2023: actualData.currency_2023 || '',
      currency_2024: actualData.currency_2024 || '',
      annual_sales_2022_type: actualData.annual_sales_2022_type || 'n.a.',
      annual_sales_2023_type: actualData.annual_sales_2023_type || 'n.a.',
      annual_sales_2024_type: actualData.annual_sales_2024_type || 'n.a.',
      
      // Patent counts
      total_patents: actualData.total_patents !== null && actualData.total_patents !== undefined ? actualData.total_patents : null,
      granted_patents: actualData.granted_patents !== null && actualData.granted_patents !== undefined ? actualData.granted_patents : null,
      patent_applications: actualData.patent_applications !== null && actualData.patent_applications !== undefined ? actualData.patent_applications : null,
      
      industry_sectors: actualData.industry_sectors ?
        (Array.isArray(actualData.industry_sectors) ? actualData.industry_sectors.join(', ') : actualData.industry_sectors) : 'N/A',
      company_logo: actualData.company_logo || 'N/A',
      social_media_follower_counts: actualData.social_media_follower_counts || {},
      portfolio_rank: actualData.portfolio_rank !== null && actualData.portfolio_rank !== undefined
        ? Number(actualData.portfolio_rank)
        : null,
      venture_platform_score: actualData.venture_platform_score !== null && actualData.venture_platform_score !== undefined
        ? Number(actualData.venture_platform_score)
        : null,
      venture_platform_percentile: actualData.venture_platform_score !== null && actualData.venture_platform_score !== undefined
        ? Math.round(Number(actualData.venture_platform_score) * 100)
        : null,
      metrics_considered: actualData.metrics_considered !== null && actualData.metrics_considered !== undefined
        ? Number(actualData.metrics_considered)
        : null,
      ranked_company_count: actualData.ranked_company_count !== null && actualData.ranked_company_count !== undefined
        ? Number(actualData.ranked_company_count)
        : null,
      portfolio_rank_v2: actualData.portfolio_rank_v2 !== null && actualData.portfolio_rank_v2 !== undefined
        ? Number(actualData.portfolio_rank_v2)
        : null,
      venture_platform_score_v2: actualData.venture_platform_score_v2 !== null && actualData.venture_platform_score_v2 !== undefined
        ? Number(actualData.venture_platform_score_v2)
        : null,
      venture_platform_percentile_v2: actualData.venture_platform_score_v2 !== null && actualData.venture_platform_score_v2 !== undefined
        ? Math.round(Number(actualData.venture_platform_score_v2) * 100)
        : null,
      metrics_considered_v2: actualData.metrics_considered_v2 !== null && actualData.metrics_considered_v2 !== undefined
        ? Number(actualData.metrics_considered_v2)
        : null,
      ranked_company_count_v2: actualData.ranked_company_count_v2 !== null && actualData.ranked_company_count_v2 !== undefined
        ? Number(actualData.ranked_company_count_v2)
        : null,
      // Phase 2: Technology Cluster
      technology_cluster: actualData.technology_cluster || 'General – Non-Cluster',
      cluster_confidence_score: actualData.cluster_confidence_score || 0,
      cluster_reasoning: actualData.cluster_reasoning || '',
      // Phase 13: FinTech Classification
      is_fintech: actualData.is_fintech || false,
      fintech_confidence_score: actualData.fintech_confidence_score || 0,
      fintech_explanation: actualData.fintech_explanation || '',
      // Phase 3: Evidence Collection
      certification_name: actualData.certification_name || '',
      certification_link: actualData.certification_link || '',
      esg_impact_report: actualData.esg_impact_report || false,
      esg_report_year: actualData.esg_report_year || '',
      esg_report_link: actualData.esg_report_link || '',
      prize_award_name_1: actualData.prize_award_name_1 || '',
      prize_award_link_1: actualData.prize_award_link_1 || '',
      prize_award_name_2: actualData.prize_award_name_2 || '',
      prize_award_link_2: actualData.prize_award_link_2 || '',
      // Phase 4: ESG Materiality Analysis
      primary_industry_standard: actualData.primary_industry_standard || '',
      secondary_industry_standard: actualData.secondary_industry_standard || '',
      // Use pre-calculated ESG scores directly from backend (no calculation needed)
      esg_sb_scores_sum: actualData.esg_sb_scores_sum || 0,
      esg_environmental_score: actualData.esg_environmental_score || 0,
      esg_social_score: actualData.esg_social_score || 0,
      esg_governance_score: actualData.esg_governance_score || 0,
      // Phase 5: AI TOC and Scoring
      geographic_scope_estimated: actualData.geographic_scope_estimated || '',
      theory_of_change: actualData.theory_of_change || [],
      public_impact_summary: actualData.public_impact_summary || null,
      // Read pre-calculated highest ABC classification from backend
      // Priority: C (Contribute) > B (Benefit) > A (Avoid Harm)
      highest_abc_classification: actualData.highest_abc_classification || null,
      impact_scoring: actualData.impact_scoring || [],
      impact_magnitude_5_year: actualData.impact_magnitude_5_year || 0,
      impact_magnitude_5_year_negative: actualData.impact_magnitude_5_year_negative ?? null,
      impact_magnitude_5_year_net: actualData.impact_magnitude_5_year_net ?? null,
      impact_likelihood: actualData.impact_likelihood || 0,
      overall_impact_potential_score: actualData.overall_impact_potential_score || 0,
      growth_media_reach_score: actualData.growth_media_reach_score ?? null,
      growth_sentiment_score: actualData.growth_sentiment_score ?? null,
      growth_innovation_visibility_score: actualData.growth_innovation_visibility_score ?? null,
      growth_team_strength_score: actualData.growth_team_strength_score ?? null,
      growth_funding_velocity_score: actualData.growth_funding_velocity_score ?? null,
      growth_company_age_score: actualData.growth_company_age_score ?? null,
      growth_composite_score: actualData.growth_composite_score ?? null,
      // Geographic coordinates
      latitude: actualData.latitude ?? null,
      longitude: actualData.longitude ?? null,
      // SDGs and geography
      sdgs: actualData.sdgs || '',
      geography_of_impact: actualData.geography_of_impact || '',
      // Tags
      tags: actualData.tags || [],
      // Phase 7: Carbon Emissions
      total_carbon_emissions: actualData.total_carbon_emissions || 'N/A',
      scope_1_emissions: actualData.scope_1_emissions || 'N/A',
      scope_2_emissions: actualData.scope_2_emissions || 'N/A',
      scope_3_emissions: actualData.scope_3_emissions || 'N/A',
      // Include the detailed emissions breakdown
      emissions_breakdown: actualData.emissions_breakdown || [],
      // Phase 9: ESG Risk Scores
      esg_risk_environmental_inherent: actualData.esg_risk_environmental_inherent || null,
      esg_risk_environmental_adjusted: actualData.esg_risk_environmental_adjusted || null,
      esg_risk_social_inherent: actualData.esg_risk_social_inherent || null,
      esg_risk_social_adjusted: actualData.esg_risk_social_adjusted || null,
      esg_risk_governance_inherent: actualData.esg_risk_governance_inherent || null,
      esg_risk_governance_adjusted: actualData.esg_risk_governance_adjusted || null,
      esg_risk_total_inherent: actualData.esg_risk_total_inherent || null,
      esg_risk_total_adjusted: actualData.esg_risk_total_adjusted || null,
      // Phase 11: ESG Foresight Scores (8-year projection)
      esg_risk_environmental_foresight: actualData.esg_risk_environmental_foresight || null,
      esg_risk_social_foresight: actualData.esg_risk_social_foresight || null,
      esg_risk_governance_foresight: actualData.esg_risk_governance_foresight || null,
      esg_risk_total_foresight: actualData.esg_risk_total_foresight || null,
      // Phase 10: SBMO (Sustainability Business Model Orientation) Scores
      sbmo_criteria_a_score: actualData.sbmo_criteria_a_score !== undefined && actualData.sbmo_criteria_a_score !== null ? Number(actualData.sbmo_criteria_a_score) : null,
      sbmo_criteria_b_score: actualData.sbmo_criteria_b_score !== undefined && actualData.sbmo_criteria_b_score !== null ? Number(actualData.sbmo_criteria_b_score) : null,
      sbmo_criteria_c_score: actualData.sbmo_criteria_c_score !== undefined && actualData.sbmo_criteria_c_score !== null ? Number(actualData.sbmo_criteria_c_score) : null,
      sbmo_criteria_d_score: actualData.sbmo_criteria_d_score !== undefined && actualData.sbmo_criteria_d_score !== null ? Number(actualData.sbmo_criteria_d_score) : null,
      sbmo_total_score: actualData.sbmo_total_score !== undefined && actualData.sbmo_total_score !== null ? Number(actualData.sbmo_total_score) : null,
      // SBMO Explanations
      sbmo_criteria_a_explanation: actualData.sbmo_criteria_a_explanation || 'N/A',
      sbmo_criteria_b_explanation: actualData.sbmo_criteria_b_explanation || 'N/A',
      sbmo_criteria_c_explanation: actualData.sbmo_criteria_c_explanation || 'N/A',
      sbmo_criteria_d_explanation: actualData.sbmo_criteria_d_explanation || 'N/A',
      
      // Website Traffic Data - All months from Aug 2023 to Aug 2025
      // Using explicit null/undefined check to preserve 0 values
      traffic_aug_2023: actualData.traffic_aug_2023 !== null && actualData.traffic_aug_2023 !== undefined ? actualData.traffic_aug_2023 : 'N/A',
      traffic_sep_2023: actualData.traffic_sep_2023 !== null && actualData.traffic_sep_2023 !== undefined ? actualData.traffic_sep_2023 : 'N/A',
      traffic_oct_2023: actualData.traffic_oct_2023 !== null && actualData.traffic_oct_2023 !== undefined ? actualData.traffic_oct_2023 : 'N/A',
      traffic_nov_2023: actualData.traffic_nov_2023 !== null && actualData.traffic_nov_2023 !== undefined ? actualData.traffic_nov_2023 : 'N/A',
      traffic_dec_2023: actualData.traffic_dec_2023 !== null && actualData.traffic_dec_2023 !== undefined ? actualData.traffic_dec_2023 : 'N/A',
      traffic_jan_2024: actualData.traffic_jan_2024 !== null && actualData.traffic_jan_2024 !== undefined ? actualData.traffic_jan_2024 : 'N/A',
      traffic_feb_2024: actualData.traffic_feb_2024 !== null && actualData.traffic_feb_2024 !== undefined ? actualData.traffic_feb_2024 : 'N/A',
      traffic_mar_2024: actualData.traffic_mar_2024 !== null && actualData.traffic_mar_2024 !== undefined ? actualData.traffic_mar_2024 : 'N/A',
      traffic_apr_2024: actualData.traffic_apr_2024 !== null && actualData.traffic_apr_2024 !== undefined ? actualData.traffic_apr_2024 : 'N/A',
      traffic_may_2024: actualData.traffic_may_2024 !== null && actualData.traffic_may_2024 !== undefined ? actualData.traffic_may_2024 : 'N/A',
      traffic_jun_2024: actualData.traffic_jun_2024 !== null && actualData.traffic_jun_2024 !== undefined ? actualData.traffic_jun_2024 : 'N/A',
      traffic_jul_2024: actualData.traffic_jul_2024 !== null && actualData.traffic_jul_2024 !== undefined ? actualData.traffic_jul_2024 : 'N/A',
      traffic_aug_2024: actualData.traffic_aug_2024 !== null && actualData.traffic_aug_2024 !== undefined ? actualData.traffic_aug_2024 : 'N/A',
      traffic_sep_2024: actualData.traffic_sep_2024 !== null && actualData.traffic_sep_2024 !== undefined ? actualData.traffic_sep_2024 : 'N/A',
      traffic_oct_2024: actualData.traffic_oct_2024 !== null && actualData.traffic_oct_2024 !== undefined ? actualData.traffic_oct_2024 : 'N/A',
      traffic_nov_2024: actualData.traffic_nov_2024 !== null && actualData.traffic_nov_2024 !== undefined ? actualData.traffic_nov_2024 : 'N/A',
      traffic_dec_2024: actualData.traffic_dec_2024 !== null && actualData.traffic_dec_2024 !== undefined ? actualData.traffic_dec_2024 : 'N/A',
      traffic_jan_2025: actualData.traffic_jan_2025 !== null && actualData.traffic_jan_2025 !== undefined ? actualData.traffic_jan_2025 : 'N/A',
      traffic_feb_2025: actualData.traffic_feb_2025 !== null && actualData.traffic_feb_2025 !== undefined ? actualData.traffic_feb_2025 : 'N/A',
      traffic_mar_2025: actualData.traffic_mar_2025 !== null && actualData.traffic_mar_2025 !== undefined ? actualData.traffic_mar_2025 : 'N/A',
      traffic_apr_2025: actualData.traffic_apr_2025 !== null && actualData.traffic_apr_2025 !== undefined ? actualData.traffic_apr_2025 : 'N/A',
      traffic_may_2025: actualData.traffic_may_2025 !== null && actualData.traffic_may_2025 !== undefined ? actualData.traffic_may_2025 : 'N/A',
      traffic_jun_2025: actualData.traffic_jun_2025 !== null && actualData.traffic_jun_2025 !== undefined ? actualData.traffic_jun_2025 : 'N/A',
      traffic_jul_2025: actualData.traffic_jul_2025 !== null && actualData.traffic_jul_2025 !== undefined ? actualData.traffic_jul_2025 : 'N/A',
      traffic_aug_2025: actualData.traffic_aug_2025 !== null && actualData.traffic_aug_2025 !== undefined ? actualData.traffic_aug_2025 : 'N/A',
      traffic_sep_2025: actualData.traffic_sep_2025 !== null && actualData.traffic_sep_2025 !== undefined ? actualData.traffic_sep_2025 : 'N/A',
      traffic_oct_2025: actualData.traffic_oct_2025 !== null && actualData.traffic_oct_2025 !== undefined ? actualData.traffic_oct_2025 : 'N/A',
      traffic_nov_2025: actualData.traffic_nov_2025 !== null && actualData.traffic_nov_2025 !== undefined ? actualData.traffic_nov_2025 : 'N/A',
      traffic_dec_2025: actualData.traffic_dec_2025 !== null && actualData.traffic_dec_2025 !== undefined ? actualData.traffic_dec_2025 : 'N/A',

      // Traffic growth metrics
      one_month_growth: actualData.one_month_growth || 'N/A',
      three_month_growth_trend: actualData.three_month_growth_trend || 'N/A',
      six_month_growth_trend: actualData.six_month_growth_trend || 'N/A',
      one_year_growth: actualData.one_year_growth || 'N/A',
      two_year_growth: actualData.two_year_growth || 'N/A',

      venture_id: actualData.venture_id || null,
    };

    // Define the social media platforms we want to display
    const socialMediaPlatforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok', 'bluesky'];

    // Initialize all social media fields as 'N/A'
    socialMediaPlatforms.forEach(platform => {
      row[`social_media_${platform}`] = 'N/A';
      row[`social_media_${platform}_followers`] = 'N/A';
    });

    // Add social media links if they exist
    if (actualData.social_media_links && typeof actualData.social_media_links === 'object') {
      Object.entries(actualData.social_media_links).forEach(([platform, link]) => {
        if (link && typeof link === 'string' && link.trim() !== '') {
          // Make sure URL has http/https prefix
          let formattedUrl = link;
          if (!link.startsWith('http://') && !link.startsWith('https://')) {
            formattedUrl = 'https://' + link;
          }
          row[`social_media_${platform}`] = formattedUrl;
        }
      });
    }

    // Add follower counts if they exist
    if (actualData.social_media_follower_counts && typeof actualData.social_media_follower_counts === 'object') {
      Object.entries(actualData.social_media_follower_counts).forEach(([platform, count]) => {
        if (count !== null && count !== undefined) {
          // Format the follower count with commas for thousands
          const formattedCount = new Intl.NumberFormat().format(count);
          row[`social_media_${platform}_followers`] = formattedCount;
        }
      });
    }

    return row;
  };

  // Function to handle opening company profile modal
  const handleOpenProfile = async (company) => {
    if (!company.id) {
      console.error('[Profile] Missing company ID');
      toast.error('Unable to open profile: Company ID is missing');
      return;
    }

    // Check cache first
    const cacheKey = `profile_${company.id}_${portfolioId || 'all'}`;
    if (profileCache.current[cacheKey]) {
      setSelectedCompany(profileCache.current[cacheKey]);
      setProfileModalOpen(true);
      return;
    }

    try {
      // Fetch from API if not cached
      const profileUrl = portfolioId
        ? `/companies/profile/${company.id}?portfolioId=${portfolioId}`
        : `/companies/profile/${company.id}`;
      const response = await v1LongTimeout.get(profileUrl);

      // Cache the response for future use (with simple size limit)
      profileCache.current[cacheKey] = response.data;

      // Simple cache size management - keep only last 20 profiles
      const cacheKeys = Object.keys(profileCache.current);
      if (cacheKeys.length > 20) {
        const oldestKey = cacheKeys[0];
        delete profileCache.current[oldestKey];
      }

      setSelectedCompany(response.data);
      setProfileModalOpen(true);

    } catch (error) {
      console.error('[Profile] Failed to load:', error.message);
      toast.error('Failed to load company profile. Please try again.');
    }
  };

  // Function to handle closing company profile modal
  const handleCloseProfile = () => {
    setProfileModalOpen(false);
    setSelectedCompany(null);
  };

  // Function to handle saving company data from modal
  const handleSaveCompanyData = (updatedCompany) => {
    // Invalidate cache for this company since data was updated
    const cacheKey = `profile_${updatedCompany.id}_${portfolioId || 'all'}`;
    if (profileCache.current[cacheKey]) {
      delete profileCache.current[cacheKey];
    }

    // Find the original company data to get the URL if it's missing from the update
    const originalCompany = gridData.find(company => company.id === updatedCompany.id);
    const url = updatedCompany.url || updatedCompany.company_url || (originalCompany ? originalCompany.url : '');

    // Transform the updated company data for the grid
    const updatedRowData = transformDataForGrid(updatedCompany, url, updatedCompany.id);
    
    // Update the company data in gridData
    const updatedGridData = gridData.map(company =>
      company.id === updatedCompany.id ? updatedRowData : company
    );
    setGridData(updatedGridData);

    // Update extraction stats based on the new data
    setExtractionStats(calculateAggregateStats(updatedGridData));

    // Update allResponses if needed
    setAllResponses(prev => prev.map(response => 
      response.data?.id === updatedCompany.id 
        ? { ...response, data: updatedCompany }
        : response
    ));

    // Tags will be automatically updated when we reload companies
    // No separate loadTags() call needed since tags are included in lite response

    // Reload companies to ensure data consistency
    console.log('[Tags] Company saved, reloading companies to refresh tags...');
    loadAllCompanies();

    // Clear cache and refresh portfolio totals since company data changed
    clearCachedPortfolioTotals();
    clearCachedCompanyLocations();
    loadPortfolioTotals(true); // Skip cache since we know data changed

    // Success message is shown in the modal
  };

  // Function to handle deleting a company
  // deleteType: 'portfolio' or 'database'
  // skipApiCall: true if the API call was already made by the modal
  const handleDeleteCompany = async (companyId, deleteType = 'database', skipApiCall = false) => {
    try {
      // Only make API call if not already done by modal
      if (!skipApiCall) {
        if (deleteType === 'portfolio' && portfolioId) {
          await v1LongTimeout.delete(`/companies/${companyId}/portfolio/${portfolioId}`);
          toast.success('Company removed from portfolio successfully');
        } else {
          await v1LongTimeout.delete(`/companies/${companyId}`);
          toast.success('Company deleted successfully');
        }
      }

      // Remove from local state
      const updatedGridData = gridData.filter(company => company.id !== companyId);
      setGridData(updatedGridData);

      // Update extraction stats
      setExtractionStats(calculateAggregateStats(updatedGridData));

      // Reload companies to ensure consistency
      loadAllCompanies();

      // Clear cache and refresh portfolio totals since we deleted/removed a company
      clearCachedPortfolioTotals();
      clearCachedCompanyLocations();
      loadPortfolioTotals(true); // Skip cache since we know data changed
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Get filtered columns based on visibility settings
  const getVisibleColumns = () => {
    const allColumns = getColumns();
    return allColumns.filter(col => visibleColumns.includes(col.id));
  };

  // Toggle column visibility
  const handleToggleColumn = (columnId) => {
    if (REQUIRED_COLUMNS.includes(columnId)) {
      return; // Don't allow toggling required columns
    }
    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        // Add the column in the correct position (maintain original order)
        const allColumns = getColumns();
        const columnOrder = allColumns.map(c => c.id);
        const newColumns = [...prev, columnId];
        return newColumns.sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b));
      }
    });
  };

  // Reset columns to default
  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  // Open Edit View dialog and capture current columns
  const handleOpenEditView = () => {
    setColumnsBeforeEdit(visibleColumns);
    setEditViewDialogOpen(true);
  };

  // Close Edit View dialog and re-fetch if columns changed
  const handleCloseEditView = () => {
    setEditViewDialogOpen(false);
    if (columnsBeforeEdit) {
      // Check if any columns were added that we don't have data for
      const hasNewColumns = visibleColumns.some(col => !columnsBeforeEdit.includes(col));
      if (hasNewColumns) {
        // Re-fetch with the new columns to get their data
        loadAllCompanies(visibleColumns);
      }
      setColumnsBeforeEdit(null);
    }
  };

  // Define columns for the table
  const getColumns = () => {
    const baseColumns = [
      {
        id: 'actions',
        label: (
          <Tooltip title="Click to open company profiles" arrow placement="top">
            <span>Profile</span>
          </Tooltip>
        ),
        minWidth: 100,
        format: (_, row) => (
          <Tooltip title="Open company profile">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleOpenProfile(row)}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        )
      },
      { id: 'company_name', label: 'Company Name', minWidth: 200, maxWidth: 200, sortable: true,
        format: (value) => (
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 180
          }}>
            {value}
          </div>
        )
      },
      { id: 'created_at', label: 'Date Added', minWidth: 120, sortable: true,
        format: (value) => {
          if (!value) return 'N/A';
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      { id: 'url', label: 'URL', minWidth: 350, maxWidth: 350, sortable: true,
        format: (value) => (
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 330
          }}>
            {value}
          </div>
        )
      },
      { id: 'company_description', label: 'Description', minWidth: 400,
        format: (value, row) => (
          <SmartTooltip
            title={value}
            companyId={row.id}
            fieldName="company_description"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 400,
              lineHeight: '1.4em',
              maxHeight: '4.2em' // 3 lines * 1.4em line-height
            }}>
              {value}
            </div>
          </SmartTooltip>
        )
      },
      {
        id: 'public_profile',
        label: 'Public Profile',
        minWidth: 130,
        format: (_, row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <a
              href={`/company-overview/${row.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'none', fontSize: '13px' }}
              onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
            >
              View
            </a>
            <Typography sx={{ color: '#d1d5db', fontSize: '13px' }}>|</Typography>
            <Tooltip title="Edit public profile">
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.3,
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                  '&:hover': { color: '#1976d2' },
                }}
                onClick={() => {
                  const returnPath = location.pathname;
                  navigate(`/company/${row.id}/edit-public-profile?returnTo=${encodeURIComponent(returnPath)}`);
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 14 }} />
                Edit
              </Box>
            </Tooltip>
          </Box>
        )
      },
      { id: 'portfolio_rank', label: 'Portfolio Rank', minWidth: 140, sortable: true,
        format: (value, row) => {
          if (value === null || value === undefined) {
            return 'N/A';
          }
          const total = row.ranked_company_count;
          if (typeof total === 'number' && total > 0) {
            return `#${value} of ${total}`;
          }
          return `#${value}`;
        }
      },
      { id: 'portfolio_rank_v2', label: 'Portfolio Rank V2', minWidth: 150, sortable: true,
        format: (value, row) => {
          if (value === null || value === undefined) {
            return 'N/A';
          }
          const total = row.ranked_company_count_v2 ?? row.ranked_company_count;
          if (typeof total === 'number' && total > 0) {
            return `#${value} of ${total}`;
          }
          return `#${value}`;
        }
      },
      { id: 'legal_form', label: 'Legal Form', minWidth: 180,
        format: (value) => (
          <Tooltip title={value || 'No legal form provided'}>
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 180,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </Tooltip>
        )
      },
      { id: 'legal_entity_formation_date', label: 'Formation Date', minWidth: 120 },
      { id: 'headquarter_address', label: 'HQ Address', minWidth: 300, maxWidth: 300,
        format: (value, row) => (
          <SmartTooltip
            title={value}
            companyId={row.id}
            fieldName="headquarter_address"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 280,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value}
            </div>
          </SmartTooltip>
        )
      },
      { id: 'phone_number', label: 'Phone', minWidth: 120 },
      { id: 'contact_email', label: 'Email', minWidth: 150 },
      { id: 'ceo_name', label: 'CEO/Founder', minWidth: 150 },
      { id: 'number_of_employees', label: 'Employees', minWidth: 90, sortable: true },
      { id: 'total_funding_amount', label: 'Total Funding', minWidth: 180, sortable: true,
        format: (value, row) => {
          const currency = row.funding_currency;
          const dataType = row.total_funding_amount_type;
          let formattedValue = value !== 'N/A' ? (currency ? `${value} ${currency}` : value) : 'N/A';

          if (dataType && dataType !== 'n.a.') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{formattedValue}</span>
                <Tooltip title={dataType === 'actual' ? 'Actual' : 'Estimate'}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dataType === 'actual' ? '#4caf50' : '#ff9800'
                    }}
                  />
                </Tooltip>
              </Box>
            );
          }
          return formattedValue;
        }
      },
      { id: 'annual_sales_2022', label: 'Annual Sales 2022', minWidth: 140, sortable: true,
        format: (value, row) => {
          const currency = row.currency_2022;
          const dataType = row.annual_sales_2022_type;
          let formattedValue = value !== 'N/A' ? (currency ? `${value} ${currency}` : value) : 'N/A';
          
          if (dataType && dataType !== 'n.a.') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{formattedValue}</span>
                <Tooltip title={dataType === 'actual' ? 'Actual' : 'Estimate'}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dataType === 'actual' ? '#4caf50' : '#ff9800'
                    }}
                  />
                </Tooltip>
              </Box>
            );
          }
          return formattedValue;
        }
      },
      { id: 'annual_sales_2023', label: 'Annual Sales 2023', minWidth: 140, sortable: true,
        format: (value, row) => {
          const currency = row.currency_2023;
          const dataType = row.annual_sales_2023_type;
          let formattedValue = value !== 'N/A' ? (currency ? `${value} ${currency}` : value) : 'N/A';
          
          if (dataType && dataType !== 'n.a.') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{formattedValue}</span>
                <Tooltip title={dataType === 'actual' ? 'Actual' : 'Estimate'}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dataType === 'actual' ? '#4caf50' : '#ff9800'
                    }}
                  />
                </Tooltip>
              </Box>
            );
          }
          return formattedValue;
        }
      },
      { id: 'annual_sales_2024', label: 'Annual Sales 2024', minWidth: 140, sortable: true,
        format: (value, row) => {
          const currency = row.currency_2024;
          const dataType = row.annual_sales_2024_type;
          let formattedValue = value !== 'N/A' ? (currency ? `${value} ${currency}` : value) : 'N/A';
          
          if (dataType && dataType !== 'n.a.') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{formattedValue}</span>
                <Tooltip title={dataType === 'actual' ? 'Actual' : 'Estimate'}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dataType === 'actual' ? '#4caf50' : '#ff9800'
                    }}
                  />
                </Tooltip>
              </Box>
            );
          }
          return formattedValue;
        }
      },
      { id: 'total_patents', label: 'Total Patents', minWidth: 100, sortable: true,
        format: (value) => {
          if (value === null || value === undefined) return 'N/A';
          return String(value);
        }
      },
      { id: 'granted_patents', label: 'Granted Patents', minWidth: 120, sortable: true,
        format: (value) => {
          if (value === null || value === undefined) return 'N/A';
          return String(value);
        }
      },
      { id: 'patent_applications', label: 'Patent Applications', minWidth: 140, sortable: true,
        format: (value) => {
          if (value === null || value === undefined) return 'N/A';
          return String(value);
        }
      },
      { id: 'industry_sectors', label: 'Industry Sectors', minWidth: 300,
        format: (value) => (
          <Tooltip title={value}>
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 300,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value}
            </div>
          </Tooltip>
        )
      },
      { id: 'company_logo', label: 'Logo', minWidth: 100,
        format: (value) => {
          // Check if URL is valid and not in failed list
          const isValidUrl = value && value !== 'N/A' && value.startsWith('http');
          
          // If this URL has already failed before, show "Failed" text
          if (value !== 'N/A' && failedImageUrls.has(value)) {
            return (
              <Tooltip title={`Logo failed to load: ${value}`}>
                <span style={{ color: '#f44336', fontSize: '12px' }}>Failed</span>
              </Tooltip>
            );
          }

          // If URL is not valid, show N/A
          if (!isValidUrl) {
            return <span style={{ color: '#999', fontSize: '12px' }}>N/A</span>;
          }

          return (
            <Tooltip title={value}>
              <img
                src={value}
                alt="Logo"
                style={{ maxHeight: 30, maxWidth: 100 }}
                onError={(e) => {
                  // Prevent infinite loop by removing error handler
                  e.target.onerror = null;

                  // Update failed URLs state to trigger re-render with "Failed" text
                  setFailedImageUrls(prev => new Set([...prev, value]));

                  // Hide the broken image immediately
                  e.target.style.display = 'none';
                }}
              />
            </Tooltip>
          );
        }
      }
    ];

    // Website Traffic Columns - All months from Aug 2023 to Aug 2025
    const trafficColumns = [
      // 2023 months
      { 
        id: 'traffic_aug_2023', 
        label: 'Traffic Aug 2023', 
        minWidth: 130,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_sep_2023', 
        label: 'Traffic Sep 2023', 
        minWidth: 130,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_oct_2023', 
        label: 'Traffic Oct 2023', 
        minWidth: 130,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_nov_2023', 
        label: 'Traffic Nov 2023', 
        minWidth: 130,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_dec_2023', 
        label: 'Traffic Dec 2023', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      // 2024 months
      { 
        id: 'traffic_jan_2024', 
        label: 'Traffic Jan 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_feb_2024', 
        label: 'Traffic Feb 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_mar_2024', 
        label: 'Traffic Mar 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_apr_2024', 
        label: 'Traffic Apr 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_may_2024', 
        label: 'Traffic May 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_jun_2024', 
        label: 'Traffic Jun 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_jul_2024', 
        label: 'Traffic Jul 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_aug_2024', 
        label: 'Traffic Aug 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_sep_2024', 
        label: 'Traffic Sep 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_oct_2024', 
        label: 'Traffic Oct 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_nov_2024', 
        label: 'Traffic Nov 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_dec_2024', 
        label: 'Traffic Dec 2024', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      // 2025 months
      { 
        id: 'traffic_jan_2025', 
        label: 'Traffic Jan 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_feb_2025', 
        label: 'Traffic Feb 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_mar_2025', 
        label: 'Traffic Mar 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_apr_2025', 
        label: 'Traffic Apr 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_may_2025', 
        label: 'Traffic May 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_jun_2025', 
        label: 'Traffic Jun 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      { 
        id: 'traffic_jul_2025', 
        label: 'Traffic Jul 2025', 
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      {
        id: 'traffic_aug_2025',
        label: 'Traffic Aug 2025',
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      {
        id: 'traffic_sep_2025',
        label: 'Traffic Sep 2025',
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      {
        id: 'traffic_oct_2025',
        label: 'Traffic Oct 2025',
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      {
        id: 'traffic_nov_2025',
        label: 'Traffic Nov 2025',
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      {
        id: 'traffic_dec_2025',
        label: 'Traffic Dec 2025',
        minWidth: 100,
        sortable: true,
        format: (value) => value === 0 ? '0' : (value && value !== 'N/A' ? Number(value).toLocaleString() : 'N/A')
      },
      // Growth metrics
      { 
        id: 'one_month_growth', 
        label: '1M Growth %', 
        minWidth: 110,
        sortable: true,
        format: (value) => {
          if (value === null || value === undefined || value === 'N/A') return 'N/A';
          const num = Number(value);
          if (isNaN(num)) return 'N/A';
          return `${num.toFixed(1)}%`;
        }
      },
      { 
        id: 'three_month_growth_trend', 
        label: '3M Growth %', 
        minWidth: 110,
        sortable: true,
        format: (value) => {
          if (value === null || value === undefined || value === 'N/A') return 'N/A';
          const num = Number(value);
          if (isNaN(num)) return 'N/A';
          return `${num.toFixed(1)}%`;
        }
      },
      { 
        id: 'six_month_growth_trend', 
        label: '6M Growth %', 
        minWidth: 110,
        sortable: true,
        format: (value) => {
          if (value === null || value === undefined || value === 'N/A') return 'N/A';
          const num = Number(value);
          if (isNaN(num)) return 'N/A';
          return `${num.toFixed(1)}%`;
        }
      },
      { 
        id: 'one_year_growth', 
        label: '1Y Growth %', 
        minWidth: 110,
        sortable: true,
        format: (value) => {
          if (value === null || value === undefined || value === 'N/A') return 'N/A';
          const num = Number(value);
          if (isNaN(num)) return 'N/A';
          return `${num.toFixed(1)}%`;
        }
      },
      { 
        id: 'two_year_growth', 
        label: '2Y Growth %', 
        minWidth: 110,
        sortable: true,
        format: (value) => {
          if (value === null || value === undefined || value === 'N/A') return 'N/A';
          const num = Number(value);
          if (isNaN(num)) return 'N/A';
          return `${num.toFixed(1)}%`;
        }
      }
    ];

    const clusterColumns = [
      // Technology Cluster
      {
        id: 'technology_cluster',
        label: 'Tech Cluster',
        minWidth: 180,
        format: (value) => value || 'N/A'
      },
      {
        id: 'cluster_confidence_score',
        label: 'Cluster Confidence',
        minWidth: 110,
        sortable: true,
        format: (value) => value !== undefined && value !== null ? `${value}%` : 'N/A'
      },
      {
        id: 'cluster_reasoning',
        label: 'Cluster Reasoning',
        minWidth: 350,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No reasoning provided'}
            companyId={row.id}
            fieldName="cluster_reasoning"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      },
      // Phase 13: FinTech Classification
      {
        id: 'is_fintech',
        label: 'FinTech',
        minWidth: 60,
        sortable: true,
        format: (value) => value ? 'Yes' : 'No'
      },
      {
        id: 'fintech_confidence_score',
        label: 'FinTech Confidence',
        minWidth: 120,
        sortable: true,
        format: (value) => value !== undefined && value !== null ? `${value}%` : 'N/A'
      },
      {
        id: 'fintech_explanation',
        label: 'FinTech Explanation',
        minWidth: 350,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No explanation provided'}
            companyId={row.id}
            fieldName="fintech_explanation"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      },
      // Phase 3: Evidence Collection - Enhanced
      {
        id: 'certification_name',
        label: 'Certifications',
        minWidth: 250,
        format: (value) => (
          <Tooltip title={value || 'No certifications found'}>
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 250,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value && value !== 'N/A' ? value : 'None found'}
            </div>
          </Tooltip>
        )
      },
      {
        id: 'certification_link',
        label: 'Certification Link',
        minWidth: 110,
        format: (value) => (
          value && value !== 'N/A' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Chip
                label="View Cert"
                size="small"
                color="primary"
                clickable
              />
            </a>
          ) : (
            <span>N/A</span>
          )
        )
      },
      {
        id: 'esg_impact_report',
        label: 'ESG Report',
        minWidth: 90,
        format: (value) => value === true ? 'Yes' : value === false ? 'No' : 'N/A'
      },
      {
        id: 'esg_report_year',
        label: 'ESG Year',
        minWidth: 90,
        sortable: true,
        format: (value) => value && value !== 'N/A' ? value : 'N/A'
      },
      {
        id: 'esg_report_link',
        label: 'ESG Link',
        minWidth: 100,
        format: (value) => (
          value && value !== 'N/A' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Chip
                label="View Report"
                size="small"
                color="success"
                clickable
              />
            </a>
          ) : (
            <span>N/A</span>
          )
        )
      },
      {
        id: 'prize_award_name_1',
        label: 'Award 1',
        minWidth: 300,
        format: (value) => (
          <Tooltip title={value || 'No award found'}>
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 300,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value && value !== 'N/A' ? value : 'None found'}
            </div>
          </Tooltip>
        )
      },
      {
        id: 'prize_award_link_1',
        label: 'Award 1 Link',
        minWidth: 110,
        format: (value) => (
          value && value !== 'N/A' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Chip
                label="View Award"
                size="small"
                color="warning"
                clickable
              />
            </a>
          ) : (
            <span>N/A</span>
          )
        )
      },
      {
        id: 'prize_award_name_2',
        label: 'Award 2',
        minWidth: 300,
        format: (value) => (
          <Tooltip title={value || 'No award found'}>
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 300,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value && value !== 'N/A' ? value : 'None found'}
            </div>
          </Tooltip>
        )
      },
      {
        id: 'prize_award_link_2',
        label: 'Award 2 Link',
        minWidth: 110,
        format: (value) => (
          value && value !== 'N/A' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Chip
                label="View Award"
                size="small"
                color="warning"
                clickable
              />
            </a>
          ) : (
            <span>N/A</span>
          )
        )
      }
    ];

    // Phase 4: ESG Materiality Analysis columns
    const esgMaterialityColumns = [
      {
        id: 'primary_industry_standard',
        label: 'Primary Industry',
        minWidth: 250,
        format: (value) => {
          if (!value || value === 'N/A') return 'N/A';
          // Try to get the first element if it's an array
          try {
            if (Array.isArray(value) && value.length > 0) {
              return value[0];
            }
          } catch (e) {
            // Ignore error and fall back to showing the full value
          }
          // Fallback: show the original value as-is
          return value;
        }
      },
      {
        id: 'secondary_industry_standard',
        label: 'Secondary Industry',
        minWidth: 250,
        format: (value) => {
          if (!value || value === 'N/A') return 'N/A';
          // Try to get the second element if it's an array
          try {
            if (Array.isArray(value) && value.length > 1) {
              return value[1];
            }
          } catch (e) {
            // Ignore error and fall back to showing the full value
          }
          // Fallback: show the original value as-is
          return value;
        }
      },
      {
        id: 'esg_sb_scores_sum',
        label: 'Total ESG Score',
        minWidth: 140,
        sortable: true,
        format: (value) => {
          return value !== undefined && value !== null ? value : 0;
        }
      },
      {
        id: 'esg_environmental_score',
        label: 'Total E Score',
        minWidth: 110,
        sortable: true,
        format: (value) => {
          return value !== undefined && value !== null ? value : 0;
        }
      },
      {
        id: 'esg_social_score',
        label: 'Total S Score',
        minWidth: 110,
        sortable: true,
        format: (value) => {
          return value !== undefined && value !== null ? value : 0;
        }
      },
      {
        id: 'esg_governance_score',
        label: 'Total G Score',
        minWidth: 110,
        sortable: true,
        format: (value) => {
          return value !== undefined && value !== null ? value : 0;
        }
      }
    ];

    const formatLikelihoodScore = (value) => {
      if (value === undefined || value === null || value === 0) return 'N/A';
      if (typeof value === 'number') {
        return Math.round(value).toString();
      }
      return value;
    };

    // Phase 5: AI TOC and Scoring columns
    const aiTocScoringColumns = [
      {
        id: 'geographic_scope_estimated',
        label: 'Geographic Scope',
        minWidth: 200,
        format: (value) => {
          let displayValue;
          if (!value || value === 'N/A') {
            displayValue = 'N/A';
          } else {
            try {
              const parsed = JSON.parse(value);
              displayValue = Array.isArray(parsed) ? parsed.join(', ') : value;
            } catch (e) {
              displayValue = value;
            }
          }

          return (
            <Tooltip title={displayValue}>
              <div style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                maxWidth: 200,
                lineHeight: '1.4em',
                maxHeight: '4.2em'
              }}>
                {displayValue}
              </div>
            </Tooltip>
          );
        }
      },
      {
        id: 'highest_abc_classification',
        label: 'ABC Classification',
        minWidth: 130,
        sortable: true,
        format: (value) => {
          if (!value) return 'N/A';

          const classificationColors = {
            C: '#43a047',  // Contribute to Solutions - green
            B: '#7cb342',  // Benefit Stakeholders - light green
            A: '#aed581'   // Act to Avoid Harm - pale green
          };

          const classificationLabels = {
            C: 'Contribute to Solutions',
            B: 'Benefit Stakeholders',
            A: 'Act to Avoid Harm'
          };

          const color = classificationColors[value] || '#9e9e9e';
          const label = classificationLabels[value] || 'Unknown';

          return (
            <Tooltip title={label}>
              <Box
                sx={{
                  minWidth: 36,
                  height: 28,
                  px: 1.5,
                  borderRadius: '8px',
                  backgroundColor: color,
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }}
              >
                {value}
              </Box>
            </Tooltip>
          );
        }
      },

      {
        id: 'impact_magnitude_5_year',
        label: 'Magnitude (5Y)',
        minWidth: 120,
        sortable: true,
        format: (value) => {
          if (value === undefined || value === null || value === 0) return 'N/A';
          return (typeof value === 'number' ? Math.round(value).toString() : value);
        }
      },
      {
        id: 'impact_magnitude_5_year_negative',
        label: 'Magnitude (5Y, negative)',
        minWidth: 180,
        sortable: true,
        format: (value) => {
          if (value === undefined || value === null || value === 0) return 'N/A';
          return (typeof value === 'number' ? Math.round(value).toString() : value);
        }
      },
      {
        id: 'impact_magnitude_5_year_net',
        label: 'Magnitude (5Y, net of negative)',
        minWidth: 200,
        sortable: true,
        format: (value) => {
          if (value === undefined || value === null) return 'N/A';
          return (typeof value === 'number' ? Math.round(value).toString() : value);
        }
      },
      {
        id: 'impact_likelihood',
        label: 'Likelihood',
        minWidth: 100,
        sortable: true,
        format: formatLikelihoodScore
      },
      {
        id: 'overall_impact_potential_score',
        label: 'Impact Potential Score',
        minWidth: 180,
        sortable: true,
        format: (value) => {
          if (value === undefined || value === null || value === 0) return 'N/A';
          return (typeof value === 'number' ? value.toFixed(1) : value);
        }
      },

    ];

    const formatGrowthScore = (value) => {
      if (value === null || value === undefined || value === 'N/A') {
        return 'N/A';
      }
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return 'N/A';
      }
      return numericValue.toFixed(1);
    };

    const growthLikelihoodColumns = [
      {
        id: 'growth_media_reach_score',
        label: 'Growth: Media Reach',
        minWidth: 150,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_sentiment_score',
        label: 'Growth: Sentiment',
        minWidth: 130,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_innovation_visibility_score',
        label: 'Growth: Innovation Visibility',
        minWidth: 190,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_team_strength_score',
        label: 'Growth: Team Strength',
        minWidth: 150,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_funding_velocity_score',
        label: 'Growth: Funding Velocity',
        minWidth: 170,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_company_age_score',
        label: 'Growth: Company Age',
        minWidth: 150,
        sortable: true,
        format: formatGrowthScore
      },
      {
        id: 'growth_composite_score',
        label: 'Growth Composite Score',
        minWidth: 170,
        sortable: true,
        format: formatGrowthScore
      }
    ];

    // Add social media columns
    const socialMediaPlatforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok', 'bluesky'];

    // Define colors and icons for each platform (using MUI colors)
    const platformStyles = {
      twitter: { color: '#1DA1F2', label: 'Twitter' },
      facebook: { color: '#4267B2', label: 'Facebook' },
      linkedin: { color: '#0077B5', label: 'LinkedIn' },
      instagram: { color: '#E1306C', label: 'Instagram' },
      youtube: { color: '#FF0000', label: 'YouTube' },
      tiktok: { color: '#000000', label: 'TikTok' },
      bluesky: { color: '#1DA1F2', label: 'Bluesky' }
    };

    // Create columns for social media links
    const socialMediaLinkColumns = socialMediaPlatforms.map(platform => ({
      id: `social_media_${platform}`,
      label: platformStyles[platform].label || platform.charAt(0).toUpperCase() + platform.slice(1),
      minWidth: 100,
      format: (value) => (
        value && value !== 'N/A' ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Chip
              label={platformStyles[platform].label || platform.charAt(0).toUpperCase() + platform.slice(1)}
              style={{
                backgroundColor: platformStyles[platform].color || '#1976d2',
                color: '#ffffff',
                fontWeight: 'bold'
              }}
              size="small"
              clickable
            />
          </a>
        ) : (
          <span>N/A</span>
        )
      )
    }));

    // Create columns for follower counts
    const socialMediaFollowerColumns = socialMediaPlatforms.map(platform => ({
      id: `social_media_${platform}_followers`,
      label: `${platformStyles[platform].label || platform.charAt(0).toUpperCase() + platform.slice(1)} Followers`,
      minWidth: 90,
      sortable: true,
      format: (value) => (
        value && value !== 'N/A' ? (
          <Tooltip title={`${value} followers`}>
            <Chip
              label={value}
              style={{
                backgroundColor: '#f5f5f5',
                color: platformStyles[platform].color || '#1976d2',
                fontWeight: 'bold',
                border: `1px solid ${platformStyles[platform].color || '#1976d2'}`
              }}
              size="small"
            />
          </Tooltip>
        ) : (
          <span>N/A</span>
        )
      )
    }));

    // Combine link and follower columns for each platform
    const socialMediaColumns = [];
    socialMediaPlatforms.forEach((_, index) => {
      socialMediaColumns.push(socialMediaLinkColumns[index]);
      socialMediaColumns.push(socialMediaFollowerColumns[index]);
    });

    // Add carbon emissions columns (Phase 7)
    const carbonEmissionsColumns = [
      {
        id: 'total_carbon_emissions',
        label: 'Total Emissions (tCO2e)',
        minWidth: 180,
        sortable: true,
        format: (value) => value && value !== 'N/A' ? value : 'N/A'
      },
      {
        id: 'scope_1_emissions',
        label: 'Scope 1 (tCO2e)',
        minWidth: 120,
        sortable: true,
        format: (value) => value && value !== 'N/A' ? value : 'N/A'
      },
      {
        id: 'scope_2_emissions',
        label: 'Scope 2 (tCO2e)',
        minWidth: 120,
        sortable: true,
        format: (value) => value && value !== 'N/A' ? value : 'N/A'
      },
      {
        id: 'scope_3_emissions',
        label: 'Scope 3 (tCO2e)',
        minWidth: 120,
        sortable: true,
        format: (value) => value && value !== 'N/A' ? value : 'N/A'
      }
    ];

    // Add ESG Risk Score columns (Phase 9) - these will go after the ESG materiality scores
    const esgRiskScoreColumns = [
      {
        id: 'esg_risk_environmental_inherent',
        label: 'Env Risk (Inherent)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_environmental_adjusted',
        label: 'Env Risk (Adjusted)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_social_inherent',
        label: 'Social Risk (Inherent)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_social_adjusted',
        label: 'Social Risk (Adjusted)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_governance_inherent',
        label: 'Gov Risk (Inherent)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_governance_adjusted',
        label: 'Gov Risk (Adjusted)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_total_inherent',
        label: 'Total Risk (Inherent)',
        minWidth: 150,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_total_adjusted',
        label: 'Total Risk (Adjusted)',
        minWidth: 150,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      }
    ];

    // Add ESG Foresight Score columns (Phase 11) - 8-year projection
    const esgForesightColumns = [
      {
        id: 'esg_risk_environmental_foresight',
        label: 'Env Risk (Foresight)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_social_foresight',
        label: 'Social Risk (Foresight)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_governance_foresight',
        label: 'Gov Risk (Foresight)',
        minWidth: 140,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'esg_risk_total_foresight',
        label: 'Total Risk (Foresight)',
        minWidth: 150,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      }
    ];

    // Add SBMO (Sustainability Business Model Orientation) Score columns (Phase 10)
    const sbmoColumns = [
      {
        id: 'sbmo_criteria_a_score',
        label: 'SBMO Criteria A',
        minWidth: 120,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A'
      },
      {
        id: 'sbmo_criteria_b_score',
        label: 'SBMO Criteria B',
        minWidth: 120,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A'
      },
      {
        id: 'sbmo_criteria_c_score',
        label: 'SBMO Criteria C',
        minWidth: 120,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A'
      },
      {
        id: 'sbmo_criteria_d_score',
        label: 'SBMO Criteria D',
        minWidth: 120,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? Number(value).toFixed(1) : 'N/A'
      },
      {
        id: 'sbmo_total_score',
        label: 'SBMO Total Score',
        minWidth: 130,
        sortable: true,
        format: (value) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
      },
      {
        id: 'sbmo_criteria_a_explanation',
        label: 'SBMO A Explanation',
        minWidth: 350,
        sortable: false,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No explanation provided'}
            companyId={row.id}
            fieldName="sbmo_criteria_a_explanation"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      },
      {
        id: 'sbmo_criteria_b_explanation',
        label: 'SBMO B Explanation',
        minWidth: 350,
        sortable: false,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No explanation provided'}
            companyId={row.id}
            fieldName="sbmo_criteria_b_explanation"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      },
      {
        id: 'sbmo_criteria_c_explanation',
        label: 'SBMO C Explanation',
        minWidth: 350,
        sortable: false,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No explanation provided'}
            companyId={row.id}
            fieldName="sbmo_criteria_c_explanation"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      },
      {
        id: 'sbmo_criteria_d_explanation',
        label: 'SBMO D Explanation',
        minWidth: 350,
        sortable: false,
        format: (value, row) => (
          <SmartTooltip
            title={value || 'No explanation provided'}
            companyId={row.id}
            fieldName="sbmo_criteria_d_explanation"
          >
            <div style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              maxWidth: 350,
              lineHeight: '1.4em',
              maxHeight: '4.2em'
            }}>
              {value || 'N/A'}
            </div>
          </SmartTooltip>
        )
      }
    ];

    // Reorder columns: base metrics, ESG + SBMO, impact, clustering, traffic, social, carbon
    return [
      ...baseColumns,
      ...esgMaterialityColumns,
      ...esgRiskScoreColumns,
      ...esgForesightColumns,
      ...sbmoColumns,
      ...aiTocScoringColumns,
      ...growthLikelihoodColumns,
      ...clusterColumns,
      ...trafficColumns,
      ...socialMediaColumns,
      ...carbonEmissionsColumns
    ];
  };

  // Get columns organized by category for the Edit View modal
  const getGroupedColumns = () => {
    const allColumns = getColumns();

    // Define column groups with friendly names and their column IDs
    const groupDefinitions = [
      {
        id: 'company_info',
        name: 'Company Information',
        columnIds: ['created_at', 'url', 'company_description', 'public_profile',
          'legal_form', 'legal_entity_formation_date',
          'headquarter_address', 'phone_number', 'contact_email', 'ceo_name', 'number_of_employees',
          'total_funding_amount', 'annual_sales_2022', 'annual_sales_2023', 'annual_sales_2024',
          'total_patents', 'granted_patents', 'patent_applications', 'industry_sectors', 'company_logo']
      },
      {
        id: 'portfolio_ranking',
        name: 'Portfolio Ranking',
        columnIds: ['portfolio_rank', 'portfolio_rank_v2']
      },
      {
        id: 'esg_scores',
        name: 'ESG Scores',
        columnIds: ['primary_industry_standard', 'secondary_industry_standard', 'esg_sb_scores_sum',
          'esg_environmental_score', 'esg_social_score', 'esg_governance_score']
      },
      {
        id: 'esg_risk',
        name: 'ESG Risk Assessment',
        columnIds: ['esg_risk_environmental_inherent', 'esg_risk_environmental_adjusted',
          'esg_risk_social_inherent', 'esg_risk_social_adjusted',
          'esg_risk_governance_inherent', 'esg_risk_governance_adjusted',
          'esg_risk_total_inherent', 'esg_risk_total_adjusted']
      },
      {
        id: 'esg_foresight',
        name: 'ESG Foresight (8-Year)',
        columnIds: ['esg_risk_environmental_foresight', 'esg_risk_social_foresight',
          'esg_risk_governance_foresight', 'esg_risk_total_foresight']
      },
      {
        id: 'sbmo',
        name: 'SBMO Scores',
        columnIds: ['sbmo_criteria_a_score', 'sbmo_criteria_b_score', 'sbmo_criteria_c_score',
          'sbmo_criteria_d_score', 'sbmo_total_score', 'sbmo_criteria_a_explanation',
          'sbmo_criteria_b_explanation', 'sbmo_criteria_c_explanation', 'sbmo_criteria_d_explanation']
      },
      {
        id: 'impact_scoring',
        name: 'Impact Scoring',
        columnIds: ['geographic_scope_estimated', 'highest_abc_classification', 'impact_magnitude_5_year', 'impact_magnitude_5_year_negative',
          'impact_magnitude_5_year_net', 'impact_likelihood', 'overall_impact_potential_score']
      },
      {
        id: 'growth_metrics',
        name: 'Growth Likelihood',
        columnIds: ['growth_media_reach_score', 'growth_sentiment_score', 'growth_mentions_trend_score',
          'growth_industry_buzz_score', 'growth_composite_score']
      },
      {
        id: 'tech_cluster',
        name: 'Technology & Certifications',
        columnIds: ['technology_cluster', 'cluster_confidence_score', 'cluster_reasoning',
          'is_fintech', 'fintech_confidence_score', 'fintech_explanation',
          'certification_name', 'certification_link', 'esg_impact_report', 'esg_report_year',
          'esg_report_link', 'prize_award_name_1', 'prize_award_link_1', 'prize_award_name_2', 'prize_award_link_2']
      },
      {
        id: 'website_traffic',
        name: 'Website Traffic',
        columnIds: allColumns.filter(col => col.id.startsWith('traffic_')).map(col => col.id)
      },
      {
        id: 'traffic_growth',
        name: 'Traffic Growth',
        columnIds: ['one_month_growth', 'three_month_growth_trend', 'six_month_growth_trend',
          'one_year_growth', 'two_year_growth']
      },
      {
        id: 'social_media',
        name: 'Social Media',
        columnIds: allColumns.filter(col =>
          col.id.includes('facebook') || col.id.includes('twitter') || col.id.includes('instagram') ||
          col.id.includes('linkedin') || col.id.includes('youtube')
        ).map(col => col.id)
      },
      {
        id: 'carbon_emissions',
        name: 'Carbon Emissions',
        columnIds: ['total_carbon_emissions', 'scope_1_emissions', 'scope_2_emissions', 'scope_3_emissions']
      }
    ];

    // Build grouped columns object
    const grouped = {};
    groupDefinitions.forEach(group => {
      const groupColumns = group.columnIds
        .map(id => allColumns.find(col => col.id === id))
        .filter(col => col && !REQUIRED_COLUMNS.includes(col.id));

      if (groupColumns.length > 0) {
        grouped[group.id] = {
          name: group.name,
          columns: groupColumns
        };
      }
    });

    return grouped;
  };

  // Add this function to calculate column completion percentages
  const calculateColumnCompletionPercentages = () => {
    if (!gridData || gridData.length === 0) return {};

    const percentages = {};
    const columns = getColumns().map(col => col.id);

    columns.forEach(columnId => {
      if (columnId === 'id') return; // Skip the id column

      const totalRows = gridData.length;
      const populatedRows = gridData.filter(row =>
        row[columnId] && row[columnId] !== 'N/A'
      ).length;

      percentages[columnId] = Math.round((populatedRows / totalRows) * 100);
    });

    return percentages;
  };



  // Add this to render the summary row
  const renderSummaryRow = () => {
    if (!gridData || gridData.length === 0) return null;

    const percentages = calculateColumnCompletionPercentages();

    return (
      <TableRow
        sx={{
          backgroundColor: 'secondary.subtle',
          fontWeight: 'bold'
        }}
      >
        {getColumns().map((column, index) => {
          const value = percentages[column.id];
          return (
            <TableCell
              key={`summary-${column.id}`}
              align="left"
              className={
                index === 0 ? 'frozen-column-1' :
                index === 1 ? 'frozen-column-2' : ''
              }
            >
              {column.id === 'actions' || column.id === 'public_profile' ? (
                null
              ) : column.id === 'url' ? (
                <Typography variant="subtitle2">Summary</Typography>
              ) : value !== undefined ? (
                `${value}%`
              ) : null}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };



  const renderCompanyData = () => {
    // Don't return null - we want to show the table structure even if empty
    // if (!gridData || gridData.length === 0) return null;

    // Only show extraction details if we have extracted data
    let data;
    if (extractedData) {
      try {
        data = typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;
      } catch (e) {
      // If we still can't parse it, show an error card with the raw response
      return (
        <Card sx={{ mt: 4, p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>Error Parsing Response</Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1" paragraph>
            The response from the API could not be parsed as valid JSON. Below is the raw response:
          </Typography>
          <Paper sx={{ p: 2, maxHeight: 500, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData, null, 2)}
            </pre>
          </Paper>
        </Card>
      );
    }

    // Check if we have an error object from our JSON parsing attempts
    if (data.error && data.raw_response) {
      return (
        <Card sx={{ mt: 4, p: 3 }}>
          <Typography variant="h5" color="warning.main" gutterBottom>Response Format Issue</Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1" paragraph>
            {data.error}. Below is the raw response from the model:
          </Typography>
          <Paper sx={{ p: 2, maxHeight: 500, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {typeof data.raw_response === 'string' ? data.raw_response : JSON.stringify(data.raw_response, null, 2)}
            </pre>
          </Paper>
        </Card>
      );
      }
    }
    
    // Only process extracted data details if we have it
    if (extractedData && data) {
      const confidenceScores = data.confidence_scores || {};
      
      // Initialize data categorization objects
      const foundData = {};
      const notFoundData = {};

      // Helper function to categorize data
      const categorizeData = (key, displayName, valueTransform = null) => {
        const value = data[key];
        const hasValidValue = hasValue(value);

        if (hasValidValue) {
          foundData[key] = {
            displayName,
            value: valueTransform ? valueTransform(value) : value,
            confidenceScore: confidenceScores[key]
          };
        } else {
          notFoundData[key] = {
            displayName,
            confidenceScore: confidenceScores[key]
          };
        }
        return hasValidValue;
      };

      // Categorize all data fields
      categorizeData('company_name', 'Company Name');
      categorizeData('company_description', 'Description');
      categorizeData('company_logo', 'Logo');
      categorizeData('legal_entity_formation_date', 'Formation Date');
      categorizeData('legal_form', 'Legal Form');
      categorizeData('headquarter_address', 'Headquarters');
      categorizeData('phone_number', 'Phone');
      categorizeData('contact_email', 'Email');
      categorizeData('ceo_name', 'CEO/Founder');
      categorizeData('number_of_employees', 'Employees');
      categorizeData('annual_sales_2022', 'Annual Sales 2022');
      categorizeData('annual_sales_2023', 'Annual Sales 2023');
      categorizeData('annual_sales_2024', 'Annual Sales 2024');
      categorizeData('currency_2022', '2022 Currency');
      categorizeData('currency_2023', '2023 Currency');
      categorizeData('currency_2024', '2024 Currency');
      categorizeData('total_patents', 'Total Patents');

      // Handle industry sectors separately due to its array nature
      if (data.industry_sectors &&
          ((Array.isArray(data.industry_sectors) && data.industry_sectors.length > 0) ||
           (!Array.isArray(data.industry_sectors) && data.industry_sectors !== 'N/A' && data.industry_sectors !== ''))) {
        foundData.industry_sectors = {
          displayName: 'Industry Sectors',
          value: data.industry_sectors,
          confidenceScore: confidenceScores.industry_sectors
        };
      } else {
        notFoundData.industry_sectors = {
          displayName: 'Industry Sectors',
          confidenceScore: confidenceScores.industry_sectors
        };
      }

      // Handle social media links
      const foundSocialMedia = {};
      const notFoundSocialMedia = {};

      if (data.social_media_links && Object.keys(data.social_media_links).length > 0) {
        Object.entries(data.social_media_links).forEach(([platform, url]) => {
          if (url) {
            foundSocialMedia[platform] = {
              value: url,
              confidenceScore: confidenceScores.social_media_links &&
                              confidenceScores.social_media_links[platform] !== undefined ?
                              confidenceScores.social_media_links[platform] : 0
            };
          } else {
            notFoundSocialMedia[platform] = {
              confidenceScore: confidenceScores.social_media_links &&
                              confidenceScores.social_media_links[platform] !== undefined ?
                              confidenceScores.social_media_links[platform] : 0
            };
          }
        });
      }
    }

    return (
      <Card sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Search Bar - left side */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                label="Search company name..."
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{
                  minWidth: 500,
                  '& .MuiInputBase-root': {
                    height: 48,
                    borderRadius: 2
                  },
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    opacity: 0.6
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main'
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              />
              {searchInput && (
                <IconButton
                  onClick={clearSearch}
                  title="Clear search"
                  sx={{ mt: 0.75 }}
                >
                  <ClearIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Right-aligned section with tags and controls */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Autocomplete
                multiple
                options={allTags}
                value={selectedTags}
                onChange={(_, newValue) => {
                  setSelectedTags(newValue);
                }}
                renderOption={(props, option) => {
                  const count = tagCounts.get(option) || 0;
                  return (
                    <li {...props}>
                      <span>{option}</span>
                      <span style={{ marginLeft: 'auto', color: '#999', fontSize: '0.85em' }}>
                        ({count})
                      </span>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Filter by tags.."
                    sx={{
                      minWidth: 300,
                      '& .MuiInputBase-root': {
                        height: 48,
                        borderRadius: 2,
                        '& input': {
                          padding: '14px 14px'
                        }
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
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              size="medium"
              startIcon={<TableChartIcon />}
              onClick={() => setViewMode('table')}
              sx={{ minWidth: 120, height: 40 }}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'map' ? 'contained' : 'outlined'}
              size="medium"
              startIcon={<MapIcon />}
              onClick={() => setViewMode('map')}
              sx={{ minWidth: 120, height: 40 }}
            >
              Map
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Tooltip title={columnsFixed ? 'Unfreeze first 2 columns' : 'Freeze first 2 columns'}>
              <IconButton
                onClick={() => setColumnsFixed(!columnsFixed)}
                color={columnsFixed ? 'primary' : 'default'}
                size='small'
                disabled={viewMode !== 'table'}
              >
                {columnsFixed ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<ViewColumnIcon />}
              onClick={handleOpenEditView}
              disabled={viewMode !== 'table'}
              sx={{ minWidth: 120, height: 40, textTransform: 'none' }}
            >
              Edit View
            </Button>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Table View */}
        {viewMode === 'table' && (
          <Box sx={{ width: '100%', mb: 1 }}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer
              sx={{
              maxHeight: 'calc(100vh - 240px)',
              minHeight: 450,
              overflow: 'auto',
              position: 'relative',
              // Fix for sticky header
              '& .MuiTableHead-root': {
                position: 'sticky',
                top: 0,
                zIndex: 1000,
              },
              // Ensure header cells have proper background
              '& .MuiTableCell-head': {
                backgroundColor: '#2568F6 !important',
              },
              // Styles for frozen columns
              '& .frozen-column-1': columnsFixed ? {
                position: 'sticky',
                left: 0,
                zIndex: 102,
                borderRight: '0.1px solid #e0e0e0'
              } : {},
              '& .frozen-column-2': columnsFixed ? {
                position: 'sticky',
                left: '100px', // Actions column width
                zIndex: 101,
                borderRight: '0.1px solid #e0e0e0'
              } : {},
              // Styles for frozen column headers only
              '& thead .frozen-column-1': columnsFixed ? {
                backgroundColor: '#2568F6 !important',
                zIndex: 1002
              } : {},
              '& thead .frozen-column-2': columnsFixed ? {
                backgroundColor: '#2568F6 !important',
                outline: '1px solid #e0e0e0',
                outlineOffset: '-1px',
                zIndex: 1001
              } : {},
              // TODO: COMMENTED OUT SUMMARY ROW STYLES - WAITING FOR BOSS APPROVAL TO REMOVE
              // '& tbody tr:first-child .frozen-column-1': columnsFixed ? {
              //   backgroundColor: '#F0F2F6 !important',
              //   zIndex: 102
              // } : {},
              // '& tbody tr:first-child .frozen-column-2': columnsFixed ? {
              //   backgroundColor: '#F0F2F6 !important',
              //   zIndex: 101,
              //   outline: '1px solid #e0e0e0',
              //   outlineOffset: '-1px'
              // } : {},
              // Styles for frozen columns in all data rows (no summary row)
              '& tbody tr .frozen-column-1': columnsFixed ? {
                backgroundColor: '#ffffff !important',
                zIndex: 102
              } : {},
              '& tbody tr .frozen-column-2': columnsFixed ? {
                backgroundColor: '#ffffff !important',
                zIndex: 101,
                outline: '1px solid #e0e0e0',
                outlineOffset: '-1px'
              } : {}
            }}>
              <Table stickyHeader aria-label="company data table">
                <TableHead>
                  <TableRow>
                    {getVisibleColumns().map((column, index) => (
                      <TableCell
                        key={column.id}
                        align="left"
                        style={{ minWidth: column.minWidth, maxWidth: column.maxWidth }}
                        className={
                          index === 0 ? 'frozen-column-1' :
                          index === 1 ? 'frozen-column-2' : ''
                        }
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 'bold',
                          cursor: column.sortable ? 'pointer' : 'default',
                          padding: '10px 16px',
                          height: '52px'
                        }}
                      >
                        {column.sortable ? (
                          <TableSortLabel
                            active={sortConfig.key === column.id}
                            direction={sortConfig.key === column.id ? sortConfig.direction : 'asc'}
                            onClick={() => handleSort(column.id)}
                            sx={{
                              color: 'inherit !important',
                              '& .MuiTableSortLabel-icon': {
                                color: 'inherit !important'
                              }
                            }}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* TODO: KEEPING SUMMARY ROW CODE BUT COMMENTED OUT - WAITING FOR BOSS APPROVAL TO REMOVE */}
                  {/* {renderSummaryRow()} */}
                  {getSortedData().map((row, rowIndex) => {
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={row.id}
                        sx={{
                          opacity: 0,
                          animation: `${tableRowFadeIn} 0.4s ease-out forwards`,
                          animationDelay: `${Math.min(rowIndex * 30, 1500)}ms`,
                        }}
                      >
                        {getVisibleColumns().map((column, index) => {
                          const value = row[column.id];
                          return (
                            <TableCell
                              key={column.id}
                              align="left"
                              className={
                                index === 0 ? 'frozen-column-1' :
                                index === 1 ? 'frozen-column-2' : ''
                              }
                            >
                              {column.format
                                ? column.format(value, row)
                                : value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>


            </Paper>

            {/* Loading indicator - show when loading with no data */}
            {isLoading && getSortedData().length === 0 && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  Loading companies...
                </Typography>
              </Box>
            )}

            {/* No results message - only show when not loading */}
            {getSortedData().length === 0 && !isLoading && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? (
                    <>No companies found matching "{searchTerm}"</>
                  ) : selectedTags.length > 0 ? (
                    <>No companies found with the selected tags</>
                  ) : (
                    <>No companies in the database</>
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <CompanyExtractorMap
              selectedTags={selectedTags}
              portfolioId={portfolioId}
              onOpenProfile={handleOpenProfile}
            />
          </Box>
        )}




      </Card>
    );
  };

  // Prepare props for ExtractionPanel 
  const extractionPanelProps = {
    companyUrl,
    setCompanyUrl,
    handleExtract,
    extractionProgress
  };

  // Show loading state while validating portfolio
  if (isValidating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Validating portfolio...</Typography>
      </Box>
    );
  }

  // Show error state if portfolio doesn't exist
  if (portfolioError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>Portfolio Not Found</Typography>
          <Typography>
            The portfolio with ID {portfolioId} does not exist or you don't have access to it.
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Redirecting to portfolios list...
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Don't render the main component until portfolio is validated
  if (portfolioId && !portfolioValidated) {
    return null;
  }

  return (
    <CompanyExtractorLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      extractionProgress={extractionProgress}
      portfolioId={portfolioId}
    >
      {activeSection === 'dashboard' && (
        <CompanyExtractorMapDashboard
          portfolioId={portfolioId}
          portfolioName={portfolioName}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {activeSection === 'rankings' && (
        <ClusterRankings
          portfolioId={portfolioId}
          onOpenProfile={handleOpenProfile}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          allTags={allTags}
        />
      )}

      {activeSection === 'agent' && (
        <PortfolioAgentChat portfolioId={portfolioId} />
      )}

      {activeSection === 'extract' && (
        <ExtractionPanel {...extractionPanelProps} />
      )}

      {activeSection === 'database' && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            {portfolioName ? `${portfolioName} - Company Database` : 'Company Database'}
          </Typography>
          {renderCompanyData()}
        </Box>
      )}

      {activeSection === 'researchDatabase' && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            {portfolioName ? `${portfolioName} - Public Database` : 'Public Database'}
          </Typography>
          <ResearchDatabase
            gridData={gridData}
          />
        </Box>
      )}

      {activeSection === 'notifications' && (
        <Box>
          <Notifications portfolioId={portfolioId} />
        </Box>
      )}

      {activeSection === 'pendingUrls' && (
        <Box>
          <PendingUpdates />
        </Box>
      )}

      {/* Company Profile Modal */}
      <CompanyProfileModal
        open={profileModalOpen}
        onClose={handleCloseProfile}
        companyData={selectedCompany}
        onSave={handleSaveCompanyData}
        onDelete={handleDeleteCompany}
        availableTags={allTags}
        portfolioId={portfolioId}
      />

      {/* Edit View Dialog */}
      <Dialog
        open={editViewDialogOpen}
        onClose={handleCloseEditView}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit View
          <Button
            size="small"
            onClick={handleResetColumns}
            sx={{ textTransform: 'none' }}
          >
            Reset to Default
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Select which columns to display in the table.
          </Typography>
          <Box sx={{ maxHeight: 'calc(80vh - 200px)', overflow: 'auto' }}>
            {Object.entries(getGroupedColumns()).map(([groupId, group]) => {
              const selectedInGroup = group.columns.filter(col => visibleColumns.includes(col.id)).length;

              return (
                <Accordion
                  key={groupId}
                  defaultExpanded={selectedInGroup > 0}
                  sx={{
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 1,
                    '&:first-of-type': { borderRadius: '8px 8px 0 0' },
                    '&:last-of-type': { borderRadius: '0 0 8px 8px' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {group.name}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 0.5
                      }}
                    >
                      {group.columns.map((column) => {
                        const isChecked = visibleColumns.includes(column.id);
                        const labelText = typeof column.label === 'string'
                          ? column.label
                          : column.id;

                        return (
                          <FormControlLabel
                            key={column.id}
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={() => handleToggleColumn(column.id)}
                                size="small"
                              />
                            }
                            label={labelText}
                            sx={{
                              mx: 0,
                              py: 0.25,
                              px: 1,
                              borderRadius: 1,
                              '&:hover': { backgroundColor: 'action.hover' },
                              '& .MuiFormControlLabel-label': { fontSize: '0.875rem' }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, pl: 2 }}>
            {visibleColumns.length} of {getColumns().length} columns selected
          </Typography>
          <Button onClick={handleCloseEditView}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </CompanyExtractorLayout>
  );
};

export default SuperAdminCompanyExtractor;
