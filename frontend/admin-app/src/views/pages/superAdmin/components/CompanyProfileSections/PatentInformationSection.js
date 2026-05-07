import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Link,
  Divider,
  Pagination,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from "services/api";
import { toast } from "react-toastify";

const PATENT_CHART_COLORS = {
  granted: '#10b981',
  applications: '#fbbf24',
  cumulative: '#06b6d4'
};

const PATENT_BAR_RADIUS = 6;

// Renders the applications (bottom) bar with a rounded top only when there
// is no granted bar stacked on top of it. Without this, every applications
// bar gets a rounded top, creating a visible notch under the granted bar.
const ApplicationsBarShape = (props) => {
  const { x, y, width, height, fill, fillOpacity, payload } = props;
  if (!width || !height || height <= 0 || width <= 0) return null;
  const grantedAbove = Number(payload?.granted) || 0;
  const r = grantedAbove > 0 ? 0 : Math.min(PATENT_BAR_RADIUS, width / 2, height);
  if (r === 0) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
      />
    );
  }
  const d = [
    `M${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    `L${x},${y + height}`,
    'Z'
  ].join(' ');
  return <path d={d} fill={fill} fillOpacity={fillOpacity} />;
};

const PatentTimelineTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const granted = payload.find((p) => p.dataKey === 'granted')?.value || 0;
  const applications = payload.find((p) => p.dataKey === 'applications')?.value || 0;
  const cumulative = payload.find((p) => p.dataKey === 'cumulative')?.value || 0;
  const total = granted + applications;
  const rows = [
    { label: 'Granted', value: granted, color: PATENT_CHART_COLORS.granted },
    { label: 'Applications', value: applications, color: PATENT_CHART_COLORS.applications },
    { label: 'Cumulative', value: cumulative, color: PATENT_CHART_COLORS.cumulative }
  ];
  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(17, 24, 39, 0.12)',
        border: '1px solid #e5e7eb',
        px: 1.75,
        py: 1.25,
        minWidth: 168
      }}
    >
      <Typography
        sx={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#111827',
          mb: 0.75
        }}
      >
        {label} &middot; {total} filing{total === 1 ? '' : 's'}
      </Typography>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            py: 0.25
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: row.color
              }}
            />
            <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
              {row.label}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const PatentInformationSection = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [patentData, setPatentData] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [patentsPerPage] = useState(100);
  const [viewByFamily, setViewByFamily] = useState(true);
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [familyPage, setFamilyPage] = useState(1);
  const [familiesPerPage] = useState(50);
  const [timeline, setTimeline] = useState([]);

  // Check for existing patents when component mounts
  useEffect(() => {
    let isActive = true;

    const resetState = () => {
      setPatentData(null);
      setError(null);
      setCurrentPage(1);
      setFamilyPage(1);
      setExpandedFamilies({});
      setTimeline([]);
    };

    if (!data?.id) {
      resetState();
      return () => {
        isActive = false;
      };
    }

    resetState();

    const fetchExistingPatents = async () => {
      try {
        const response = await api.get(`/patents/company/${data.id}`);
        if (isActive) {
          console.log('Patent response for company:', data.id, response);
          // Always update patent data, even if null or 0 patents
          // This ensures stale data is cleared when switching companies
          setPatentData(response);
          setCurrentPage(1);
        }
      } catch (err) {
        if (isActive) {
          console.log('No existing patents found or error fetching:', err);
          // Explicitly set to null on error to clear any stale data
          setPatentData(null);
        }
      }
    };

    const fetchTimeline = async () => {
      try {
        const response = await api.get(`/patents/company/${data.id}/timeline`);
        if (isActive) {
          setTimeline(Array.isArray(response) ? response : []);
        }
      } catch (err) {
        if (isActive) {
          setTimeline([]);
        }
      }
    };

    fetchExistingPatents();
    fetchTimeline();

    return () => {
      isActive = false;
    };
  }, [data?.id]);

  // Group patents into families - use patentFamilyId if available, else priority date + title
  const groupPatentsByFamily = (patents) => {
    const families = {};
    patents.forEach(patent => {
      // Use AI-assigned family ID if available, else fallback to priority date + title
      const key = patent.patentFamilyId
        || `${patent.priorityDate || 'unknown'}_${(patent.title || '').toLowerCase().trim()}`;
      if (!families[key]) {
        families[key] = {
          key,
          priorityDate: patent.priorityDate,
          title: patent.title,
          abstract: null,
          abstractPriority: 0,
          patents: [],
          jurisdictions: new Set(),
          hasGranted: false,
          grantedCount: 0
        };
      }
      families[key].patents.push(patent);
      // Extract jurisdiction code from first 2 characters of patent number
      const jurisdiction = patent.patentNumber?.substring(0, 2)?.toUpperCase();
      if (jurisdiction) families[key].jurisdictions.add(jurisdiction);
      if (patent.granted) {
        families[key].hasGranted = true;
        families[key].grantedCount++;
      }
      // Pick best abstract: prioritize DE > EP > US > WO > any other
      if (patent.abstractText) {
        const currentPriority = families[key].abstractPriority || 0;
        let newPriority = 1; // default priority for any abstract
        if (jurisdiction === 'DE') newPriority = 4;
        else if (jurisdiction === 'EP') newPriority = 3;
        else if (jurisdiction === 'US') newPriority = 2;
        else if (jurisdiction === 'WO') newPriority = 1.5;

        if (newPriority > currentPriority) {
          families[key].abstract = patent.abstractText;
          families[key].abstractPriority = newPriority;
        }
      }
    });

    // Convert to array and sort by priority date (newest first)
    return Object.values(families)
      .map(family => ({
        ...family,
        jurisdictions: Array.from(family.jurisdictions).sort()
      }))
      .sort((a, b) => (b.priorityDate || '').localeCompare(a.priorityDate || ''));
  };

  // Memoize patent families to avoid recalculating on every render
  const patentFamilies = useMemo(() => {
    if (!patentData?.patentDetails || patentData.patentDetails.length === 0) {
      return [];
    }
    return groupPatentsByFamily(patentData.patentDetails);
  }, [patentData?.patentDetails]);

  // Derive cumulative running-sum on the frontend from the per-year counts
  // returned by the backend.
  const timelineChartData = useMemo(() => {
    if (!Array.isArray(timeline) || timeline.length === 0) return [];
    let cumulative = 0;
    return timeline.map((entry) => {
      const granted = entry.granted || 0;
      const applications = entry.applications || 0;
      cumulative += granted + applications;
      return {
        year: entry.year,
        granted,
        applications,
        cumulative
      };
    });
  }, [timeline]);

  const toggleFamilyExpanded = (familyKey) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [familyKey]: !prev[familyKey]
    }));
  };

  const handleRerunPatentSearch = async () => {
    if (!data?.company_name) {
      toast.error('Company name is required to search patents');
      return;
    }

    setLoading(true);
    setError(null);
    setPatentData(null);

    try {
      const requestData = {
        companyName: data.company_name,
        companyUrl: data.company_url || '',
        euOnly: false,        // Worldwide search
        grantsOnly: false,    // Include both grants and applications
        saveToDatabase: true  // Save patents to database from profile modal
      };

      const response = await api.post('/patents', requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });

      console.log('Patent counter API response:', response);
      setPatentData(response);
      setCurrentPage(1);

      if (response.error) {
        setError(response.error);
        toast.error(`Error: ${response.error}`);
      } else if (response.patentCount > 0) {
        toast.success(`Found ${response.patentCount} patents for ${data.company_name}`);
      } else {
        toast.info('No patents found for this company');
      }

      try {
        const timelineResponse = await api.get(`/patents/company/${data.id}/timeline`);
        setTimeline(Array.isArray(timelineResponse) ? timelineResponse : []);
      } catch (timelineErr) {
        setTimeline([]);
      }
    } catch (err) {
      console.error('Error searching patents:', err);
      setError(err.message || 'An error occurred while searching patents');
      toast.error(`Error: ${err.message || 'Failed to search patents'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPatentDetails = () => {
    if (!patentData?.patentDetails || patentData.patentDetails.length === 0) return null;

    const totalPatents = patentData.patentDetails.length;
    const totalPages = Math.ceil(totalPatents / patentsPerPage);
    const startIndex = (currentPage - 1) * patentsPerPage;
    const endIndex = startIndex + patentsPerPage;
    const patentsToShow = patentData.patentDetails.slice(startIndex, endIndex);

    const handlePageChange = (_, value) => {
      setCurrentPage(value);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, totalPatents)} of {totalPatents} patents
          </Typography>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {patentsToShow.map((patent, index) => (
          <Accordion key={patent.patentNumber || index} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: '140px' }}>
                  {patent.patentNumber}
                </Typography>
                <Chip
                  label={patent.granted ? 'Granted' : 'Application'}
                  color={patent.granted ? 'success' : 'warning'}
                  size="small"
                />
                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patent.title || 'No title available'}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" gutterBottom>Title:</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {patent.title || 'No title available'}
                  </Typography>

                  {patent.inventor && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>Inventor:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {patent.inventor}
                      </Typography>
                    </>
                  )}

                  {patent.assignee && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>Assignee:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {patent.assignee}
                      </Typography>
                    </>
                  )}

                  {patent.abstractText && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>Abstract:</Typography>
                      <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                        {patent.abstractText}
                      </Typography>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Key Dates:</Typography>
                      {patent.publicationDate && (
                        <Typography variant="body2">
                          <strong>Published:</strong> {patent.publicationDate}
                        </Typography>
                      )}
                      {patent.filedDate && (
                        <Typography variant="body2">
                          <strong>Filed:</strong> {patent.filedDate}
                        </Typography>
                      )}
                      {patent.priorityDate && (
                        <Typography variant="body2">
                          <strong>Priority:</strong> {patent.priorityDate}
                        </Typography>
                      )}
                      {patent.grantDate && (
                        <Typography variant="body2">
                          <strong>Granted:</strong> {patent.grantDate}
                        </Typography>
                      )}
                      {patent.expirationDate && (
                        <Typography variant="body2">
                          <strong>Expires:</strong> {patent.expirationDate}
                        </Typography>
                      )}
                    </Grid>
                    
                    {(patent.citedByCount > 0 || patent.citationsCount > 0 || patent.primaryCpcCode || patent.patentStatus) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>Additional Details:</Typography>
                        {patent.citedByCount > 0 && (
                          <Typography variant="body2">
                            <strong>Cited by:</strong> {patent.citedByCount} patents
                          </Typography>
                        )}
                        {patent.citationsCount > 0 && (
                          <Typography variant="body2">
                            <strong>Citations:</strong> {patent.citationsCount} patents
                          </Typography>
                        )}
                        {patent.patentStatus && (
                          <Typography variant="body2">
                            <strong>Status:</strong> {patent.patentStatus}
                          </Typography>
                        )}
                        {patent.primaryCpcCode && (
                          <Typography variant="body2">
                            <strong>CPC:</strong> {patent.primaryCpcCode}
                          </Typography>
                        )}
                      </Grid>
                    )}
                  </Grid>
                  
                  <Box sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>Links:</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {patent.patentUrl && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        href={patent.patentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Patent
                      </Button>
                    )}
                    {patent.pdfUrl && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        href={patent.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download PDF
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>
    );
  };

  const renderPatentFamilies = () => {
    if (patentFamilies.length === 0) return null;

    const totalFamilies = patentFamilies.length;
    const totalPages = Math.ceil(totalFamilies / familiesPerPage);
    const startIndex = (familyPage - 1) * familiesPerPage;
    const endIndex = startIndex + familiesPerPage;
    const familiesToShow = patentFamilies.slice(startIndex, endIndex);

    const handlePageChange = (_, value) => {
      setFamilyPage(value);
    };

    // Helper to render individual patent within a family
    const renderFamilyPatent = (patent, index) => (
      <Box
        key={patent.patentNumber || index}
        sx={{
          py: 1.5,
          px: 2,
          borderBottom: '1px solid #eee',
          '&:last-child': { borderBottom: 'none' },
          '&:hover': { backgroundColor: '#f0f0f0' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600,
              minWidth: '155px',
              color: '#333333'
            }}
          >
            {patent.patentNumber}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: patent.granted ? 'success.main' : 'warning.main',
              fontWeight: 600,
              minWidth: '75px'
            }}
          >
            {patent.granted ? 'Granted' : 'Application'}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#666666', flex: 1 }}>
            Filed: {patent.filedDate || 'N/A'}
          </Typography>
          {patent.patentUrl && (
            <Link
              href={patent.patentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ display: 'flex', alignItems: 'center', color: '#666666', '&:hover': { color: 'primary.main' } }}
            >
              <OpenInNewIcon sx={{ fontSize: 18 }} />
            </Link>
          )}
        </Box>
      </Box>
    );

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, totalFamilies)} of {totalFamilies} patent families
          </Typography>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={familyPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {familiesToShow.map((family, index) => (
          <Box
            key={family.key}
            sx={{
              mb: 1.5,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            {/* Family Header Row */}
            <Box
              onClick={() => toggleFamilyExpanded(family.key)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                p: 2,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#fafafa' },
                gap: 2
              }}
            >
              <IconButton size="small" sx={{ p: 0, mt: 0.25 }}>
                {expandedFamilies[family.key] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>

              <Typography sx={{ fontSize: '14px', color: '#666666', minWidth: '90px', mt: 0.25 }}>
                {family.priorityDate || 'Unknown'}
              </Typography>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#333333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 0.5
                  }}
                >
                  {family.title || 'No title available'}
                </Typography>
                {/* Summary line */}
                <Typography sx={{ fontSize: '13px', color: '#666666' }}>
                  {family.patents.length} filing{family.patents.length !== 1 ? 's' : ''}
                  {family.grantedCount > 0 && (
                    <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {' '}&bull; {family.grantedCount} granted
                    </Box>
                  )}
                  {family.jurisdictions.length > 0 && (
                    <Box component="span" sx={{ color: '#555555', fontWeight: 500 }}>
                      {' '}&bull; {family.jurisdictions.join(', ')}
                    </Box>
                  )}
                </Typography>
              </Box>
            </Box>

            {/* Expanded Family Details */}
            <Collapse in={expandedFamilies[family.key]}>
              <Box sx={{ borderTop: '1px solid #e0e0e0' }}>
                {/* Abstract Section */}
                {family.abstract && (
                  <Box sx={{ px: 2, py: 1.5, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography sx={{ fontSize: '12px', color: '#888888', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Abstract
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#555555', lineHeight: 1.6 }}>
                      {family.abstract}
                    </Typography>
                  </Box>
                )}
                {/* Patent Filings */}
                <Box sx={{ backgroundColor: '#fafafa' }}>
                  {family.patents.map((patent, pIndex) => renderFamilyPatent(patent, pIndex))}
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={familyPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ pt: 2, mb: 1 }}>
        <Typography 
          sx={{ 
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: '#666666',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box sx={{ 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            '& .MuiSvgIcon-root': {
              fontSize: 22
            }
          }}>
            <ScienceIcon />
          </Box>
          Patent Information
        </Typography>
      </Box>

      <Box sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 2,
        overflow: 'visible',
        p: 3
      }}>
        {!patentData && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {/* Check if we've searched before and found 0 patents vs never searched */}
            {data.total_patents === 0 && data.last_patent_check_at ? (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  No patents found for {data.company_name} as of {new Date(data.last_patent_check_at).toLocaleDateString()}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRerunPatentSearch}
                  disabled={loading}
                >
                  Search Again
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Search for patents registered under {data.company_name}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRerunPatentSearch}
                  disabled={loading}
                >
                  Search Patents
                </Button>
              </>
            )}
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography variant="body1">Searching patents for {data.company_name}...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {patentData && !loading && (
          <>
            {timelineChartData.length > 0 && (
              <Box
                data-testid="patent-timeline-chart"
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    mb: 2.5,
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 0.5
                      }}
                    >
                      Patent Activity
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#111827'
                      }}
                    >
                      Filings Over Time
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        color: '#6b7280',
                        mt: 0.5,
                        maxWidth: 560
                      }}
                    >
                      Stacked by filing year. Patents without a filing date are listed below.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      flexShrink: 0,
                      pt: 0.5
                    }}
                  >
                    {[
                      { label: 'Granted', color: PATENT_CHART_COLORS.granted, kind: 'dot' },
                      { label: 'Applications', color: PATENT_CHART_COLORS.applications, kind: 'dot' },
                      { label: 'Cumulative', color: PATENT_CHART_COLORS.cumulative, kind: 'line' }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                      >
                        {item.kind === 'dot' ? (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '3px',
                              backgroundColor: item.color
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 16,
                              height: 2,
                              borderRadius: 1,
                              backgroundColor: item.color
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#374151'
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={timelineChartData}
                    margin={{ top: 8, right: 16, left: -8, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#f3f4f6"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="year"
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                      dy={6}
                    />
                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      allowDecimals={false}
                      stroke="#9ca3af"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(17, 24, 39, 0.04)' }}
                      content={<PatentTimelineTooltip />}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="applications"
                      stackId="patents"
                      name="Applications"
                      fill={PATENT_CHART_COLORS.applications}
                      fillOpacity={0.9}
                      shape={<ApplicationsBarShape />}
                      maxBarSize={40}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="granted"
                      stackId="patents"
                      name="Granted"
                      fill={PATENT_CHART_COLORS.granted}
                      radius={[PATENT_BAR_RADIUS, PATENT_BAR_RADIUS, 0, 0]}
                      maxBarSize={40}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative"
                      stroke={PATENT_CHART_COLORS.cumulative}
                      strokeWidth={2.5}
                      dot={{
                        r: 3,
                        fill: '#ffffff',
                        stroke: PATENT_CHART_COLORS.cumulative,
                        strokeWidth: 2
                      }}
                      activeDot={{
                        r: 5,
                        fill: PATENT_CHART_COLORS.cumulative,
                        stroke: '#ffffff',
                        strokeWidth: 2
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle1" color="text.secondary">Patent Families</Typography>
                <Typography variant="h3" color="primary">
                  {patentFamilies.length > 0 ? patentFamilies.length.toLocaleString() : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle1" color="text.secondary">Total Filings</Typography>
                <Typography variant="h4" color="primary.light">
                  {patentData.patentCount !== undefined ? patentData.patentCount.toLocaleString() : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle1" color="text.secondary">Granted Patents</Typography>
                <Typography variant="h4" color="success.main">
                  {patentData.grantedPatentCount !== undefined ? patentData.grantedPatentCount.toLocaleString() : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle1" color="text.secondary">Applications</Typography>
                <Typography variant="h4" color="warning.main">
                  {patentData.applicationCount !== undefined ? patentData.applicationCount.toLocaleString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            {patentData.searchUrl && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Link 
                  href={patentData.searchUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  View on Google Patents <OpenInNewIcon fontSize="small" />
                </Link>
              </Box>
            )}

            {patentData.patentDetails && patentData.patentDetails.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Patent Details</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {viewByFamily
                        ? `${patentFamilies.length} patent families (${patentData.patentDetails.length} total filings)`
                        : `Detailed information for all ${patentData.patentDetails.length} patents found`
                      }
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={viewByFamily}
                        onChange={(e) => setViewByFamily(e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        View by Family
                      </Typography>
                    }
                    labelPlacement="start"
                  />
                </Box>
                {viewByFamily ? renderPatentFamilies() : renderPatentDetails()}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PatentInformationSection;
