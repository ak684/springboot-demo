import React, { useState } from 'react';
import { Grid, Box, Typography, IconButton, Collapse, CircularProgress, Tooltip, TextField, Button } from '@mui/material';
import Co2Icon from '@mui/icons-material/Co2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import BaseSection from './BaseSection';

const EmissionCard = ({ title, value, color }) => (
  <Box sx={{ 
    p: 2.5, 
    textAlign: 'center', 
    backgroundColor: color,
    borderRadius: 1,
    height: '100%'
  }}>
    <Typography sx={{ 
      fontSize: '14px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: '#666666',
      mb: 1
    }}>
      {title}
    </Typography>
    <Typography sx={{ 
      fontSize: '24px', 
      fontWeight: 600, 
      color: '#1976d2',
      mb: 0.5
    }}>
      {value || 'N/A'}
    </Typography>
    <Typography sx={{ 
      fontSize: '14px', 
      color: '#666666'
    }}>
      tCO2e
    </Typography>
  </Box>
);

const CarbonEmissionsSection = ({ data, companyId, onRerun }) => {
  const [emissionsTableExpanded, setEmissionsTableExpanded] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showInstructionsInput, setShowInstructionsInput] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');

  const handleFullRerun = async () => {
    if (!onRerun) return;
    setIsRerunning(true);
    try {
      await onRerun('emissions', companyId);
    } finally {
      setIsRerunning(false);
    }
  };

  const handleUpdateWithInstructions = async () => {
    if (!onRerun || !userInstructions.trim()) return;
    setIsRerunning(true);
    try {
      await onRerun('emissions', companyId, userInstructions.trim());
      setUserInstructions('');
      setShowInstructionsInput(false);
    } finally {
      setIsRerunning(false);
    }
  };
  
  return (
    <BaseSection
      title="Carbon Emissions Analysis"
      subtitle="Comprehensive carbon footprint breakdown"
      icon={<Co2Icon />}
      actions={
        onRerun && (
          <Tooltip title="Recalculate all emissions from scratch" enterDelay={0} enterNextDelay={0}>
            <IconButton
              onClick={handleFullRerun}
              disabled={isRerunning}
              size="small"
              sx={{
                ml: 1,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                opacity: 0.7
              }}
            >
              {isRerunning ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )
      }
    >

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EmissionCard
            title="Total Emissions"
            value={data.total_carbon_emissions}
            color="#e3f2fd"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EmissionCard
            title="Scope 1 (Direct)"
            value={data.scope_1_emissions}
            color="#ffebee"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EmissionCard
            title="Scope 2 (Indirect)"
            value={data.scope_2_emissions}
            color="#fff3e0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EmissionCard
            title="Scope 3 (Value Chain)"
            value={data.scope_3_emissions}
            color="#e8f5e9"
          />
        </Grid>
      </Grid>

      {/* Detailed Emissions Breakdown Table */}
      {data.emissions_breakdown && data.emissions_breakdown.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setEmissionsTableExpanded(!emissionsTableExpanded)}
                size="small"
              >
                {emissionsTableExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Detailed Emissions Breakdown
              </Typography>
              {onRerun && (
                <Tooltip title="Make targeted corrections to specific emissions data" enterDelay={0} enterNextDelay={0}>
                  <IconButton
                    onClick={() => setShowInstructionsInput(!showInstructionsInput)}
                    disabled={isRerunning}
                    size="small"
                    sx={{
                      ml: 0.5,
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                      opacity: 0.7
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {emissionsTableExpanded && (
              <Typography variant="caption" color="text.secondary">
                Scroll horizontally to see all columns →
              </Typography>
            )}
          </Box>

          {/* Instructions Input Section */}
          {showInstructionsInput && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Update Specific Emissions Data
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Describe what you want to change and only affected categories will be updated. i.e. "We have 4 electric vehicles, not 2 petrol cars and we have 100 employees, not 50."
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                placeholder="Describe your correction..."
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                disabled={isRerunning}
                sx={{ mb: 1.5, backgroundColor: 'white' }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setShowInstructionsInput(false);
                    setUserInstructions('');
                  }}
                  disabled={isRerunning}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleUpdateWithInstructions}
                  disabled={isRerunning || !userInstructions.trim()}
                  startIcon={isRerunning ? <CircularProgress size={16} /> : null}
                >
                  {isRerunning ? 'Updating...' : 'Update Emissions'}
                </Button>
              </Box>
            </Box>
          )}

          <Collapse in={emissionsTableExpanded} timeout="auto" unmountOnExit>
            <Box sx={{
              overflowX: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#555',
              }
            }}>
              <table style={{
                borderCollapse: 'collapse',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                minWidth: '2200px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '80px' }}>
                      Scope
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '200px' }}>
                      Source (GHG Category)
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '350px' }}>
                      Relevancy
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '100px' }}>
                      Estimated CO2e (t)
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '100px' }}>
                      Confidence
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '450px' }}>
                      Assumptions
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '350px' }}>
                      Top Strategy
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '80px' }}>
                      Reduction %
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '350px' }}>
                      Secondary Strategy
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold', minWidth: '80px' }}>
                      Reduction %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.emissions_breakdown.map((emission, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '80px' }}>
                        {emission.scope}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '200px' }}>
                        {emission.category ? `Cat ${emission.category} – ${emission.source}` : emission.source}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '350px' }}>
                        {emission.relevancy}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold', minWidth: '100px' }}>
                        {emission.estimated_co2e}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top', minWidth: '100px' }}>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          backgroundColor: emission.confidence === 'high' ? '#e8f5e9' :
                                         emission.confidence === 'medium' ? '#fff3e0' : '#ffebee',
                          color: emission.confidence === 'high' ? '#2e7d32' :
                                 emission.confidence === 'medium' ? '#f57c00' : '#c62828'
                        }}>
                          {emission.confidence}
                        </Box>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '450px', whiteSpace: 'pre-wrap' }}>
                        {emission.assumptions}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '350px' }}>
                        {emission.primary_strategy && emission.primary_strategy !== 'N/A'
                          ? emission.primary_strategy
                          : '—'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold', minWidth: '80px' }}>
                        {emission.primary_reduction_percent && emission.primary_strategy !== 'N/A'
                          ? `${emission.primary_reduction_percent}%`
                          : '—'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'top', minWidth: '350px' }}>
                        {emission.secondary_strategy && emission.secondary_strategy !== 'N/A'
                          ? emission.secondary_strategy
                          : '—'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold', minWidth: '80px' }}>
                        {emission.secondary_reduction_percent && emission.secondary_strategy !== 'N/A'
                          ? `${emission.secondary_reduction_percent}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                      TOTAL
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', minWidth: '100px' }}>
                      {data.emissions_breakdown.reduce((sum, e) => {
                        const value = parseFloat(e.estimated_co2e) || 0;
                        return sum + value;
                      }, 0).toFixed(2)}
                    </td>
                    <td colSpan={6} style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {/* Empty cells for other columns */}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Collapse>
        </>
      )}

      {/* No emissions data message */}
      {(!data.emissions_breakdown || data.emissions_breakdown.length === 0) && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No detailed emissions data available
        </Typography>
      )}
    </BaseSection>
  );
};

export default CarbonEmissionsSection;