import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Pagination
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import api from "services/api";
import { toast } from "react-toastify";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

/**
 * Patent Counter component.
 * Allows counting patents for a company based on its URL.
 */
const PatentCounter = () => {
  const [companyUrl, setCompanyUrl] = useState('');
  const [euOnly, setEuOnly] = useState(false);
  const [grantsOnly, setGrantsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [patentsPerPage] = useState(100); // Show 100 patents per page

  /**
   * Handles the form submission to count patents.
   */
  const handleCountPatents = async () => {
    if (!companyUrl.trim()) {
      toast.error('Please enter a company URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData = {
        companyUrl: companyUrl,
        euOnly: euOnly,
        grantsOnly: grantsOnly
      };

      const response = await api.post('/patents', requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 1 minute timeout
      });

      console.log('Patent counter API response:', response);
      console.log('Patent details received:', response.patentDetails);
      if (response.patentDetails && response.patentDetails.length > 0) {
        console.log('First patent detail:', response.patentDetails[0]);
        console.log('First patent isGranted:', response.patentDetails[0].isGranted);
      }
      setResult(response);
      setCurrentPage(1); // Reset to first page when new results come in

      if (response.error) {
        setError(response.error);
        toast.error(`Error: ${response.error}`);
      }
      // Success case - no toast needed, results will be displayed in the UI
    } catch (err) {
      console.error('Error counting patents:', err);
      setError(err.message || 'An error occurred while counting patents');
      toast.error(`Error: ${err.message || 'Failed to count patents'}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles clearing the form and results.
   */
  const handleClear = () => {
    setCompanyUrl('');
    setEuOnly(false);
    setGrantsOnly(false);
    setResult(null);
    setError(null);
    setCurrentPage(1);
  };

  /**
   * Renders the results card.
   */
  const renderResults = () => {
    if (!result) return null;

    return (
      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>Patent Count Results</Typography>
        <Divider sx={{ mb: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Column 1: Company Information */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Company Name:</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {result.companyName || 'Unknown'}
            </Typography>

            <Typography variant="subtitle1">Company URL:</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <Link href={result.companyUrl} target="_blank" rel="noopener noreferrer">
                {result.companyUrl}
              </Link>
            </Typography>
          </Grid>

          {/* Column 2: Total Count and Search Link */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Total Count:</Typography>
            <Typography variant="h3" color="primary" sx={{ mb: 2 }}>
              {result.patentCount !== undefined ? result.patentCount.toLocaleString() : 'N/A'}
            </Typography>

            {result.searchUrl && (
              <>
                <Typography variant="subtitle1">Google Patents Search:</Typography>
                <Link href={result.searchUrl} target="_blank" rel="noopener noreferrer">
                  View on Google Patents
                </Link>
              </>
            )}
          </Grid>

          {/* Column 3: Breakdown */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">Granted Patents:</Typography>
            <Typography variant="h4" color="success.main" sx={{ mb: 2 }}>
              {result.grantedPatentCount !== undefined ? result.grantedPatentCount.toLocaleString() : 'N/A'}
            </Typography>

            <Typography variant="subtitle1">Patent Applications:</Typography>
            <Typography variant="h4" color="warning.main" sx={{ mb: 2 }}>
              {result.applicationCount !== undefined ? result.applicationCount.toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {/* Patent Details Section */}
        {result.patentDetails && result.patentDetails.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Patent Details</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Detailed information for all {result.patentDetails.length} patents found
            </Typography>
            {renderPatentDetails()}
          </>
        )}
      </Card>
    );
  };

  /**
   * Renders the detailed patent information cards.
   */
  const renderPatentDetails = () => {
    if (!result.patentDetails || result.patentDetails.length === 0) return null;

    // Calculate pagination
    const totalPatents = result.patentDetails.length;
    const totalPages = Math.ceil(totalPatents / patentsPerPage);
    const startIndex = (currentPage - 1) * patentsPerPage;
    const endIndex = startIndex + patentsPerPage;
    const patentsToShow = result.patentDetails.slice(startIndex, endIndex);

    const handlePageChange = (_, value) => {
      setCurrentPage(value);
    };

    return (
      <Box sx={{ mt: 2 }}>
        {/* Pagination info and controls at top */}
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
                {/* Left Column: Patent Information */}
                <Grid item xs={12} md={8}>
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

                {/* Right Column: Dates and Links */}
                <Grid item xs={12} md={4}>
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
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Priority:</strong> {patent.priorityDate}
                    </Typography>
                  )}

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

        {/* Pagination controls at bottom */}
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

  return (
    <CustomErrorBoundary>
      <Box p={4}>
        <Typography variant="h4" gutterBottom>Patent Counter</Typography>
        <Typography variant="body1" paragraph>
          Count patents for any company by entering their website URL. This tool extracts the company's legal name and searches Google Patents for matching records.
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Enter Company URL</Typography>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Company URL"
                variant="outlined"
                fullWidth
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="www.example.com"
                helperText="Enter a company website URL to count their patents"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={euOnly}
                    onChange={(e) => setEuOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label="EU Patents Only (European Patent Office)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={grantsOnly}
                    onChange={(e) => setGrantsOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label="Patent Grants Only (Not Applications)"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCountPatents}
                disabled={loading || !companyUrl.trim()}
                sx={{ height: 56 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Count Patents'}
              </Button>
              {(result || error) && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClear}
                  sx={{ height: 56 }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Extracting company name and counting patents...
            </Typography>
          </Box>
        )}

        {renderResults()}
      </Box>
    </CustomErrorBoundary>
  );
};

export default PatentCounter;
