import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Chip
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useParams, useSearchParams } from 'react-router-dom';
import api from "services/api";
import { toast } from "react-toastify";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

/**
 * Counter Creator component for portfolio members and super admins.
 * Allows creating and managing real-time counters.
 */
const CounterCreator = () => {
  // Get portfolio ID from route params (preferred) or query params (legacy support)
  const routeParams = useParams();
  const [searchParams] = useSearchParams();
  const portfolioId = routeParams.portfolioId || searchParams.get('portfolioId');
  const [portfolioName, setPortfolioName] = useState('');
  
  const [name, setName] = useState('');
  const [counterType, setCounterType] = useState('TARGET_BASED');
  const [startValue, setStartValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [ratePerSecond, setRatePerSecond] = useState('');
  const [showDecimals, setShowDecimals] = useState(false);
  const [numberFormat, setNumberFormat] = useState('');
  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState([]);
  const [error, setError] = useState(null);
  const [editingCounter, setEditingCounter] = useState(null);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [selectedEmbedCode, setSelectedEmbedCode] = useState('');
  const [liveCounterValues, setLiveCounterValues] = useState({});
  const eventSourcesRef = useRef({});
  const [updateTrigger, setUpdateTrigger] = useState(0); // Force re-render trigger

  useEffect(() => {
    loadCounters();
    // Load portfolio name if filtered by portfolio
    if (portfolioId) {
      api.get(`/portfolios/${portfolioId}`)
        .then(response => {
          setPortfolioName(response.name);
        })
        .catch(error => {
          console.error('Error loading portfolio name:', error);
          setPortfolioName('Portfolio');
        });
    }
  }, [portfolioId]);

  // Cleanup event sources on unmount
  useEffect(() => {
    return () => {
      Object.values(eventSourcesRef.current).forEach(eventSource => {
        if (eventSource) {
          eventSource.close();
        }
      });
    };
  }, []);

  // Setup live updates when counters change
  useEffect(() => {
    if (counters.length > 0) {
      // console.log('🔄 Setting up live updates for', counters.length, 'counters');
      setupLiveUpdates();
    }
    
    // Cleanup on unmount
    return () => {
      cleanupLiveUpdates();
    };
  }, [counters]);

  const loadCounters = async () => {
    try {
      const params = portfolioId ? { portfolioId: parseInt(portfolioId, 10) } : {};
      const response = await api.get('/counters', {}, { params });
      setCounters(response);
    } catch (err) {
      console.error('Error loading counters:', err);
      toast.error('Failed to load counters');
    }
  };

  const setupLiveUpdates = () => {
    const activeCounters = counters.filter(counter => counter.isActive);
    // console.log('🎯 Setting up live updates for active counters:', activeCounters.map(c => ({ id: c.id, name: c.name })));

    activeCounters.forEach(counter => {
      // console.log(`📡 Setting up polling for counter ${counter.name} (${counter.id})`);
      
      // Use direct fetch for public endpoint without authentication
      const pollCounter = async () => {
        const startTime = Date.now();
        // console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Starting poll for ${counter.name} (${counter.id})`);
        
        try {
          // Build the full URL
          const apiUrl = `${window.location.origin}/api/v1/public/counters/${counter.id}`;
          // console.log(`🌐 API URL: ${apiUrl}`);
          // console.log(`📊 Counter type: ${counter.type}`);
          
          // Create fetch request
          // console.log(`📤 Sending GET request...`);
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-API-Key': 'vip-api-1-defaultkey' // Dummy API key to satisfy filter
            },
            credentials: 'omit' // Don't send cookies since it's a public endpoint
          });
          
          const elapsed = Date.now() - startTime;
          // console.log(`⏱️ Response received in ${elapsed}ms`);
          // console.log(`📡 Status: ${response.status} ${response.statusText}`);
          // console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            const text = await response.text();
            // console.log(`📄 Raw response (${text.length} chars):`, text.substring(0, 200));
            
            if (!text || text.trim() === '') {
              return;
            }
            
            try {
              const data = JSON.parse(text);
              
              // Check if value actually changed
              const oldValue = liveCounterValues[counter.id]?.formattedCurrentValue;
              const changed = oldValue !== data.formattedCurrentValue;
              // console.log(`🔢 Value ${changed ? 'CHANGED' : 'unchanged'}: ${oldValue} → ${data.formattedCurrentValue}`);
              
              setLiveCounterValues(prev => {
                const newValues = {
                  ...prev,
                  [counter.id]: {
                    currentValue: data.currentValue,
                    formattedCurrentValue: data.formattedCurrentValue,
                    lastUpdated: Date.now()
                  }
                };
                // console.log(`💾 Updating state with new values`);
                return newValues;
              });
              
              // Force component re-render
              setUpdateTrigger(prev => prev + 1);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
            }
          } else {
            console.error(`HTTP error ${response.status} for ${counter.name}`);
          }
        } catch (error) {
          console.error('Network/fetch error:', error);
        }
        
        // console.log(`✅ Poll complete for ${counter.name} (took ${Date.now() - startTime}ms)\n`);
      };

      // Poll immediately, then every second
      pollCounter();
      const intervalId = setInterval(pollCounter, 1000);
      
      // Store interval ID for cleanup
      eventSourcesRef.current[counter.id] = { intervalId };
      // console.log(`📝 Started polling for counter ${counter.name} (${counter.id})`);
    });
  };

  const cleanupLiveUpdates = () => {
    // console.log('🧹 Cleaning up polling intervals:', Object.keys(eventSourcesRef.current));
    
    Object.entries(eventSourcesRef.current).forEach(([counterId, pollingData]) => {
      if (pollingData && pollingData.intervalId) {
        // console.log(`🔌 Clearing interval for counter ${counterId}`);
        clearInterval(pollingData.intervalId);
      }
    });
    eventSourcesRef.current = {};
    
    // Don't clear live values immediately to prevent flicker
    // They will be updated by the new polling intervals
  };

  const formatCounterValue = (counter) => {
    // Use live value if available, otherwise fall back to static value
    const liveValue = liveCounterValues[counter.id];
    if (liveValue && liveValue.formattedCurrentValue) {
      // console.log(`🎯 Using live value for ${counter.name}:`, liveValue.formattedCurrentValue, 'vs original:', counter.formattedCurrentValue);
      return liveValue.formattedCurrentValue;
    }
    
    // Fallback to original formatting logic
    const fallbackValue = counter.formattedCurrentValue || counter.currentValue?.toLocaleString() || '0';
    // console.log(`📊 Using fallback value for ${counter.name}:`, fallbackValue, '(no live value available)');
    return fallbackValue;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !startValue) {
      toast.error('Please fill in required fields');
      return;
    }

    if (counterType === 'TARGET_BASED' && (!targetValue || !targetDate)) {
      toast.error('Target-based counters require target value and date');
      return;
    }

    if (counterType === 'RATE_BASED' && !ratePerSecond) {
      toast.error('Rate-based counters require rate per second');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        name: name,
        type: counterType,
        startValue: parseFloat(startValue),
        showDecimals: showDecimals,
        numberFormat: numberFormat || null,
        ...(counterType === 'TARGET_BASED' && {
          targetValue: parseFloat(targetValue),
          targetDate: targetDate
        }),
        ...(counterType === 'RATE_BASED' && {
          ratePerSecond: parseFloat(ratePerSecond)
        })
      };

      if (editingCounter) {
        await api.put(`/counters/${editingCounter.id}`, requestData);
        toast.success('Counter updated successfully');
        setEditingCounter(null);
      } else {
        const params = portfolioId ? { portfolioId: parseInt(portfolioId, 10) } : {};
        await api.post('/counters', requestData, {}, { params });
        toast.success('Counter created successfully');
      }

      // Clear form
      setName('');
      setStartValue('');
      setTargetValue('');
      setTargetDate('');
      setRatePerSecond('');
      setShowDecimals(false);
      setNumberFormat('');
      setCounterType('TARGET_BASED');

      // Reload counters
      loadCounters();
    } catch (err) {
      console.error('Error saving counter:', err);
      setError(err.message || 'Failed to save counter');
      toast.error(`Error: ${err.message || 'Failed to save counter'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (counter) => {
    setEditingCounter(counter);
    setName(counter.name);
    setCounterType(counter.type);
    setStartValue(counter.startValue.toString());
    setTargetValue(counter.targetValue ? counter.targetValue.toString() : '');
    setTargetDate(counter.targetDate || '');
    setRatePerSecond(counter.ratePerSecond ? counter.ratePerSecond.toString() : '');
    setShowDecimals(counter.showDecimals || false);
    setNumberFormat(counter.numberFormat || '');
  };

  const handleDelete = async (counterId) => {
    if (!window.confirm('Are you sure you want to delete this counter?')) {
      return;
    }

    try {
      await api.delete(`/counters/${counterId}`);
      toast.success('Counter deleted successfully');
      loadCounters();
    } catch (err) {
      console.error('Error deleting counter:', err);
      toast.error('Failed to delete counter');
    }
  };

  const handleCopyEmbedCode = (embedCode) => {
    setSelectedEmbedCode(embedCode);
    setEmbedDialogOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedEmbedCode);
    toast.success('Embed code copied to clipboard');
    setEmbedDialogOpen(false);
  };

  const handleClear = () => {
    setName('');
    setStartValue('');
    setTargetValue('');
    setTargetDate('');
    setRatePerSecond('');
    setShowDecimals(false);
    setNumberFormat('');
    setCounterType('TARGET_BASED');
    setEditingCounter(null);
    setError(null);
  };

  return (
    <CustomErrorBoundary>
      <Box p={4}>
        <Typography variant="h4" gutterBottom>
          {portfolioName ? `${portfolioName} - Counter Creator` : 'Counter Creator'}
        </Typography>
        <Typography variant="body1" paragraph>
          Create real-time streaming counters that can be embedded on external websites.
          Counters update every second and support different calculation types.
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {editingCounter ? 'Edit Counter' : 'Create New Counter'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Counter Name"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Impact Counter"
                helperText="Display name for the counter"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Counter Type</InputLabel>
                <Select
                  value={counterType}
                  onChange={(e) => setCounterType(e.target.value)}
                  label="Counter Type"
                >
                  <MenuItem value="TARGET_BASED">Target-Based Counter</MenuItem>
                  <MenuItem value="RATE_BASED">Rate-Based Counter</MenuItem>
                  <MenuItem value="MANUAL">Manual Counter</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Start Value"
                variant="outlined"
                fullWidth
                type="number"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                placeholder="0"
                helperText="Initial counter value"
                sx={{ mb: 2 }}
              />
            </Grid>

            {counterType === 'TARGET_BASED' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Target Value"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="1000000"
                    helperText="Final target value"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Target Date"
                    variant="outlined"
                    fullWidth
                    type="datetime-local"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    helperText="When to reach target value"
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {counterType === 'RATE_BASED' && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Rate (per second)"
                  variant="outlined"
                  fullWidth
                  type="number"
                  step="0.01"
                  value={ratePerSecond}
                  onChange={(e) => setRatePerSecond(e.target.value)}
                  placeholder="0.1"
                  helperText="How much to increment per second"
                  sx={{ mb: 2 }}
                />
              </Grid>
            )}

            {/* Formatting Options */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Counter Format Options
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Number Format</InputLabel>
                <Select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  label="Number Format"
                >
                  <MenuItem value="">Auto (Browser Locale)</MenuItem>
                  <MenuItem value="US">US Format (1,234.56)</MenuItem>
                  <MenuItem value="EU">European Format (1.234,56)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" display="block" color="textSecondary">
                Choose number formatting style or let browser detect locale
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showDecimals}
                    onChange={(e) => setShowDecimals(e.target.checked)}
                  />
                }
                label="Show Decimals"
              />
              <Typography variant="caption" display="block" color="textSecondary">
                Display values with 2 decimal places (e.g., 1,234.56 vs 1,235)
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !startValue}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> :
               editingCounter ? 'Update Counter' : 'Create Counter'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClear}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        {/* Counters Table */}
        <Card sx={{ mt: 4 }}>
          <Box sx={{ p: 3, pb: 1 }}>
            <Typography variant="h5">Active Counters</Typography>
          </Box>
          <Divider />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Current Value</TableCell>
                  <TableCell>Start Value</TableCell>
                  <TableCell>Target/Rate</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {counters.map((counter) => (
                  <TableRow key={counter.id}>
                    <TableCell>{counter.name}</TableCell>
                    <TableCell>{counter.type}</TableCell>
                    <TableCell>
                      <Typography
                        variant="h6"
                        color="primary"
                        key={`counter-value-${counter.id}-${liveCounterValues[counter.id]?.lastUpdated || 0}`}
                        sx={{
                          fontWeight: liveCounterValues[counter.id] ? 'bold' : 'normal',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {formatCounterValue(counter)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {counter.showDecimals ?
                        counter.startValue?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) :
                        Math.floor(counter.startValue || 0).toLocaleString()
                      }
                    </TableCell>
                    <TableCell>
                      {counter.type === 'TARGET_BASED' && counter.targetValue &&
                        (counter.showDecimals ?
                          counter.targetValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) :
                          Math.floor(counter.targetValue).toLocaleString()
                        )}
                      {counter.type === 'RATE_BASED' && counter.ratePerSecond &&
                        `${counter.ratePerSecond}/sec`}
                      {counter.type === 'MANUAL' && 'Manual'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(counter)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(counter.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCopyEmbedCode(counter.embedCode)} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Live Counter Preview Section */}
        {counters.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ p: 3, pb: 1 }}>Live Counter Preview Examples</Typography>
            <Typography variant="body2" sx={{ px: 3, pb: 2, color: 'text.secondary' }}>
              Watch counters update in real-time as they would appear on external websites. Counters can be styled with CSS to match any website's design.
            </Typography>
            <Divider />
            
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {counters.filter(counter => counter.isActive).map((counter) => (
                  <Grid item xs={12} sm={6} md={4} key={counter.id}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        border: liveCounterValues[counter.id] ? '2px solid #4caf50' : '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}
                    >
                      <Typography variant="h6" gutterBottom color="text.secondary">
                        {counter.name}
                      </Typography>
                      
                      <Typography
                        variant="h3"
                        color="primary"
                        key={`preview-value-${counter.id}-${liveCounterValues[counter.id]?.lastUpdated || 0}`}
                        sx={{
                          fontWeight: 'bold',
                          mb: 1,
                          fontSize: { xs: '1.8rem', sm: '2.5rem' },
                          transition: 'all 0.3s ease',
                          transform: liveCounterValues[counter.id] ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {formatCounterValue(counter)}
                      </Typography>
                      
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              {counters.filter(counter => counter.isActive).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No active counters to preview. Create and activate a counter to see live updates.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        )}

        {/* Embed Code Dialog */}
        <Dialog open={embedDialogOpen} onClose={() => setEmbedDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Embed Code</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Copy this code and paste it into any website to embed the counter:
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={selectedEmbedCode}
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmbedDialogOpen(false)}>Close</Button>
            <Button onClick={copyToClipboard} variant="contained">Copy to Clipboard</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </CustomErrorBoundary>
  );
};

export default CounterCreator;
