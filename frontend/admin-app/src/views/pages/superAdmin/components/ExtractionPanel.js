import React from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const ExtractionPanel = ({ 
  companyUrl, 
  setCompanyUrl, 
  handleExtract, 
  extractionProgress,
  onTrafficImportComplete
}) => {



  return (
    <Box>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        Extract Company Data
      </Typography>

      <Card sx={{
        p: 4,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        maxWidth: 900,
        mx: 'auto'
      }}>
        <Typography variant="h5" gutterBottom>
          Company URL Extraction
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <TextField
          fullWidth
          label="Company URLs (comma-separated)"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          placeholder="https://example1.com, https://example2.com"
          variant="outlined"
          sx={{ mb: 3 }}
          disabled={extractionProgress?.active}
          multiline
          rows={4}
        />
        
        <Button
          fullWidth
          variant="contained"
          onClick={handleExtract}
          disabled={!companyUrl.trim() || extractionProgress?.active}
          startIcon={extractionProgress?.active ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
          sx={{ 
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {extractionProgress?.active ? 'Extracting...' : 'Extract Company Data'}
        </Button>
      </Card>

      {extractionProgress?.active && (
        <Card sx={{ 
          mt: 4,
          p: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.main',
          backgroundColor: 'primary.subtle'
        }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Extraction in Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Currently processing {extractionProgress.current} of {extractionProgress.total} companies...
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default ExtractionPanel;