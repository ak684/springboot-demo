import React, { memo, useState, useEffect } from 'react';
import { Box, Autocomplete, TextField, Chip, CircularProgress, Typography, Alert, Grid, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import StepperAnimation from 'views/common/stepper/StepperAnimation';
import StepperTitle from 'views/common/stepper/StepperTitle';
import StepperDescription from 'views/common/stepper/StepperDescription';
import StepperNextButton from 'views/common/stepper/StepperNextButton';
import FormikTextInput from 'shared-components/views/form/FormikTextInput';
import FormikRadioGroup from 'shared-components/views/form/FormikRadioGroup';
import FormikRadioButton from 'shared-components/views/form/FormikRadioButton';
import TextInput from 'shared-components/views/form/TextInput';
import { getTypography } from 'shared-components/utils/typography';
import CustomErrorBoundary from '../../../containers/CustomErrorBoundary';
import portfolioAggregatedThunks from 'store/ducks/portfolioAggregated/thunks';

// Time period translations for English and Slovak
const timePeriodTranslations = {
  'ytd': {
    english: 'Year to Date (YTD)',
    slovak: 'Od začiatku roka'
  },
  'mtd': {
    english: 'Month to Date (MTD)',
    slovak: 'Od začiatku mesiaca'
  },
  'today': {
    english: 'Today',
    slovak: 'Dnes'
  },
  'currentYearFull': {
    english: 'Current Year (Full)',
    slovak: 'Aktuálny rok (celý)'
  },
  'lastYearFull': {
    english: 'Last Year (Full)',
    slovak: 'Minulý rok (celý)'
  },
  'last5Years': {
    english: 'Last 5 Years',
    slovak: 'Posledných 5 rokov'
  },
  'sinceInception': {
    english: 'Since Inception',
    slovak: 'Od začiatku'
  }
};

const GenericWizardStep = ({ nextStep, values, setFieldValue, ventures, onSubmit, config, editMode }) => {
  const dispatch = useDispatch();
  const { portfolioId } = useParams();
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableDataSources, setAvailableDataSources] = useState({});
  const [mainIndicators, setMainIndicators] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && config.onEnterKey === 'nextStep') {
      e.preventDefault();
      e.stopPropagation();
      nextStep();
    }
  };

  // Load available data sources when ventures change
  useEffect(() => {
    if (config.name === 'sources' && values.ventures?.length > 0) {
      setLoading(true);
      const ventureIds = values.ventures.map(v => v.venture?.id || v.id || v);

      dispatch(portfolioAggregatedThunks.fetchAvailableDataSources({ portfolioId, ventureIds }))
        .unwrap()
        .then(result => {
          setAvailableDataSources(result || {});
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch data sources:', error);
          setAvailableDataSources({});
          setLoading(false);
        });
    }
  }, [config.name, values.ventures, dispatch, portfolioId]);

  // Update selectedYears for time period
  useEffect(() => {
    if (config.type === 'radio' && config.fieldName === 'timePeriod' && values.timePeriod) {
      const option = config.options.find(opt => opt.value === values.timePeriod);
      if (option && option.years) {
        setFieldValue('selectedYears', option.years);
      }
    }
  }, [config.type, config.fieldName, values.timePeriod, config.options, setFieldValue]);

  // Auto-populate time period custom labels when step loads (for edit mode or when returning to step)
  useEffect(() => {
    if (config.fieldName === 'timePeriodEnglish' && values.timePeriod) {
      const translation = timePeriodTranslations[values.timePeriod];
      if (translation) {
        // Only populate if fields are empty to avoid overwriting user input
        if (!values.timePeriodEnglish) {
          setFieldValue('timePeriodEnglish', translation.english);
        }
        if (!values.timePeriodSlovak) {
          setFieldValue('timePeriodSlovak', translation.slovak);
        }
      }
    }
  }, [config.fieldName, values.timePeriod, values.timePeriodEnglish, values.timePeriodSlovak, setFieldValue]);



  // Fetch main indicators when indicator type is "hover"
  useEffect(() => {
    if (config.type === 'radio' && config.conditionalFields && values.indicatorType === 'hover') {
      setLoading(true);
      dispatch(portfolioAggregatedThunks.fetchMainIndicators(portfolioId))
        .unwrap()
        .then((response) => {
          console.log('GenericWizardStep - Received main indicators:', response);
          console.log('GenericWizardStep - Main indicators count:', response?.length || 0);
          setMainIndicators(response || []);
        })
        .catch((error) => {
          console.error('Failed to fetch main indicators:', error);
          setMainIndicators([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dispatch, portfolioId, config.type, config.conditionalFields, values.indicatorType]);

  switch (config.type) {
    case 'multiStep':
      const currentStepConfig = config.steps[currentSubStep];
      const isLastSubStep = currentSubStep === config.steps.length - 1;

      const handleSubStepNext = () => {
        if (isLastSubStep) {
          nextStep(); // Go to next main step
        } else {
          // Auto-populate when moving from selection to customization
          if (currentSubStep === 0 && config.fieldName === 'timePeriod' && values.timePeriod) {
            const translation = timePeriodTranslations[values.timePeriod];
            if (translation) {
              if (!values.timePeriodEnglish) {
                setFieldValue('timePeriodEnglish', translation.english);
              }
              if (!values.timePeriodSlovak) {
                setFieldValue('timePeriodSlovak', translation.slovak);
              }
            }
          }
          setCurrentSubStep(currentSubStep + 1); // Go to next sub-step
        }
      };



      // Render the current sub-step inline with animation support
      const subStepConfig = { ...currentStepConfig };

      // Handle the sub-step rendering based on type
      if (subStepConfig.type === 'radio') {
        return (
          <CustomErrorBoundary>
            <StepperAnimation key={currentSubStep}>
              <Box>
                <StepperTitle>{subStepConfig.title}</StepperTitle>
                <StepperDescription>{subStepConfig.description}</StepperDescription>

                <FormikRadioGroup
                  name={subStepConfig.fieldName}
                  onClick={(value) => {
                    // Auto-populate time period labels for English and Slovak
                    if (subStepConfig.fieldName === 'timePeriod' && timePeriodTranslations[value]) {
                      // Only populate if fields are empty to avoid overwriting user input
                      if (!values.timePeriodEnglish) {
                        setFieldValue('timePeriodEnglish', timePeriodTranslations[value].english);
                      }
                      if (!values.timePeriodSlovak) {
                        setFieldValue('timePeriodSlovak', timePeriodTranslations[value].slovak);
                      }
                    }

                    if (subStepConfig.autoAdvance && !subStepConfig.conditionalFields) {
                      handleSubStepNext();
                    }
                  }}
                  gridItemProps={{ sm: 12, md: 6 }}
                >
                  {subStepConfig.options.map(option => (
                    <FormikRadioButton
                      key={option.value}
                      value={option.value}
                      label={
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                          <Typography variant="body2" color="text.secondary">{option.description}</Typography>
                          {option.hint && <Typography variant="caption" color="text.secondary">{option.hint}</Typography>}
                        </Box>
                      }
                    />
                  ))}
                </FormikRadioGroup>

                {/* Continuous Counter Toggle - Only show for prorated time periods */}
                {subStepConfig.fieldName === 'timePeriod' &&
                 values.timePeriod && ['ytd', 'mtd', 'today', 'sinceInception'].includes(values.timePeriod) && (
                  <Box sx={{
                    mt: 4,
                    p: 3,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    backgroundColor: 'primary.light',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.continuousCounter || false}
                          onChange={(e) => setFieldValue('continuousCounter', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Enable Continuous Counter
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Show live updating values that increment throughout the day based on your annual target
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                )}

                {/* Show next button when there are conditional fields, when auto-advance is disabled, or when explicitly requested */}
                {(subStepConfig.conditionalFields || !subStepConfig.autoAdvance || subStepConfig.showNextButton) && (
                  <StepperNextButton nextStep={handleSubStepNext} />
                )}
              </Box>
            </StepperAnimation>
          </CustomErrorBoundary>
        );
      } else if (subStepConfig.type === 'text') {
        return (
          <CustomErrorBoundary>
            <StepperAnimation key={currentSubStep}>
              <Box>
                <StepperTitle>{subStepConfig.title}</StepperTitle>
                <StepperDescription>{subStepConfig.description}</StepperDescription>
                <FormikTextInput
                  name={subStepConfig.fieldName}
                  placeholder={subStepConfig.placeholder}
                  inputProps={{ maxLength: subStepConfig.maxLength, style: { ...getTypography('h1') } }}
                  InputLabelProps={{ style: { ...getTypography('h1') } }}
                  onKeyDown={handleKeyDown}
                  autoFocus={subStepConfig.autoFocus}
                  multiline={subStepConfig.multiline}
                  rows={subStepConfig.rows}
                  fullWidth
                  required={subStepConfig.required}
                  letterCounter={subStepConfig.letterCounter}
                />

                {/* Slovak field if configured */}
                {subStepConfig.slovakField && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {subStepConfig.slovakField.label}
                    </Typography>
                    <FormikTextInput
                      name={subStepConfig.slovakField.fieldName}
                      placeholder={subStepConfig.slovakField.placeholder}
                      inputProps={{ maxLength: subStepConfig.slovakField.maxLength, style: { ...getTypography('h3') } }}
                      InputLabelProps={{ style: { ...getTypography('h3') } }}
                      multiline={subStepConfig.multiline}
                      rows={subStepConfig.rows}
                      fullWidth
                      letterCounter={subStepConfig.slovakField.maxLength && subStepConfig.slovakField.maxLength <= 100}
                    />
                  </Box>
                )}

                <StepperNextButton nextStep={handleSubStepNext} />
              </Box>
            </StepperAnimation>
          </CustomErrorBoundary>
        );
      }

      return null;

    case 'text':
      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>
              <FormikTextInput
                name={config.fieldName}
                placeholder={config.placeholder}
                inputProps={{ maxLength: config.maxLength, style: { ...getTypography('h1') } }}
                InputLabelProps={{ style: { ...getTypography('h1') } }}
                onKeyDown={handleKeyDown}
                autoFocus={config.autoFocus}
                multiline={config.multiline}
                rows={config.rows}
                fullWidth
                required={config.required}
                letterCounter={config.letterCounter}
              />

              {/* Slovak field if configured */}
              {config.slovakField && (
                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {config.slovakField.label}
                  </Typography>
                  <FormikTextInput
                    name={config.slovakField.fieldName}
                    placeholder={config.slovakField.placeholder}
                    inputProps={{ maxLength: config.slovakField.maxLength, style: { ...getTypography('h3') } }}
                    InputLabelProps={{ style: { ...getTypography('h3') } }}
                    multiline={config.multiline}
                    rows={config.rows}
                    fullWidth
                    letterCounter={config.slovakField.maxLength && config.slovakField.maxLength <= 100}
                  />
                </Box>
              )}

              <StepperNextButton nextStep={nextStep} />
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    case 'autocomplete':
      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>
              <Autocomplete
                sx={{ mr: 0.25 }}
                selectOnFocus
                options={config.options}
                freeSolo
                value={values[config.fieldName]}
                onChange={(_, value) => setFieldValue(config.fieldName, value || '')}
                onBlur={(e) => setFieldValue(config.fieldName, e.target.value)}
                renderInput={(params) => (
                  <TextInput
                    {...params}
                    value={params.inputProps.value}
                    variant='standard'
                    placeholder={config.placeholder}
                    inputProps={{
                      ...params.inputProps,
                      maxLength: config.maxLength,
                      style: { ...getTypography('h1') }
                    }}
                    letterCounter={config.letterCounter}
                  />
                )}
                onKeyDown={(e) => e.stopPropagation()}
              />

              {/* Slovak field if configured */}
              {config.slovakField && (
                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {config.slovakField.label}
                  </Typography>
                  <Autocomplete
                    sx={{ mr: 0.25 }}
                    selectOnFocus
                    options={config.slovakField.options || []}
                    freeSolo
                    value={values[config.slovakField.fieldName]}
                    onChange={(_, value) => setFieldValue(config.slovakField.fieldName, value || '')}
                    onBlur={(e) => setFieldValue(config.slovakField.fieldName, e.target.value)}
                    renderInput={(params) => (
                      <TextInput
                        {...params}
                        value={params.inputProps.value}
                        variant='standard'
                        placeholder={config.slovakField.placeholder}
                        inputProps={{
                          ...params.inputProps,
                          maxLength: config.slovakField.maxLength,
                          style: { ...getTypography('h3') }
                        }}
                        letterCounter={config.slovakField.maxLength && config.slovakField.maxLength <= 100}
                      />
                    )}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </Box>
              )}

              <StepperNextButton nextStep={nextStep} />
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    case 'multi-select':
      // Format grouped options for Autocomplete - calculate inside render so it updates
      const groupedOptions = React.useMemo(() => {
        const options = [];
        
        // Add products
        if (availableDataSources.products) {
          availableDataSources.products.forEach(item => {
            options.push({ ...item, group: '📦 Products/Services' });
          });
        }
        
        // Add stakeholders
        if (availableDataSources.stakeholders) {
          availableDataSources.stakeholders.forEach(item => {
            options.push({ ...item, group: '👥 Stakeholders' });
          });
        }
        
        // Add indicators
        if (availableDataSources.indicators) {
          availableDataSources.indicators.forEach(item => {
            options.push({ ...item, group: '📊 Indicators' });
          });
        }
        
        return options;
      }, [availableDataSources]);

      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>
              <Grid container spacing={3}>
                {/* Ventures selection */}
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={ventures}
                    getOptionLabel={(option) => option.venture?.name || option.name}
                    value={values.ventures || []}
                    onChange={(_, newValue) => {
                      setFieldValue('ventures', newValue);
                      setFieldValue('dataSources', []); // Clear sources when ventures change
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Ventures" placeholder={config.venturesPlaceholder} />
                    )}
                  />
                </Grid>

                {/* Data sources selection with grouping */}
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={groupedOptions}
                    groupBy={(option) => option.group}
                    getOptionLabel={(option) => option.sourceName}
                    value={values.dataSources || []}
                    onChange={(_, newValue) => setFieldValue('dataSources', newValue)}
                    loading={loading}
                    disabled={!values.ventures?.length}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Data Sources"
                        placeholder={config.sourcesPlaceholder}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderGroup={(params) => (
                      <li key={params.key}>
                        <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 'bold' }}>
                          {params.group}
                        </Typography>
                        <ul style={{ padding: 0 }}>{params.children}</ul>
                      </li>
                    )}
                  />
                </Grid>
              </Grid>
              <StepperNextButton nextStep={nextStep} />
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    case 'radio':
      const showHint = config.showHint && values.indicators?.some(ind => 
        config.hintKeywords?.some(keyword => ind.toLowerCase().includes(keyword))
      );

      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>
              
              {showHint && <Alert severity="info" sx={{ mb: 3 }}>{config.hintMessage}</Alert>}
              
              <FormikRadioGroup
                name={config.fieldName}
                onClick={(value) => {
                  // Auto-populate time period labels for English and Slovak
                  if (config.fieldName === 'timePeriod' && timePeriodTranslations[value]) {
                    // Only populate if fields are empty to avoid overwriting user input
                    if (!values.timePeriodEnglish) {
                      setFieldValue('timePeriodEnglish', timePeriodTranslations[value].english);
                    }
                    if (!values.timePeriodSlovak) {
                      setFieldValue('timePeriodSlovak', timePeriodTranslations[value].slovak);
                    }
                  }

                  if (config.autoAdvance && !config.conditionalFields) {
                    nextStep();
                  }
                }}
                gridItemProps={{ sm: 12, md: 6 }}
              >
                {config.options.map(option => (
                  <FormikRadioButton
                    key={option.value}
                    value={option.value}
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{option.description}</Typography>
                        {option.hint && <Typography variant="caption" color="text.secondary">{option.hint}</Typography>}
                      </Box>
                    }
                  />
                ))}
              </FormikRadioGroup>
              
              {/* Continuous Counter Toggle - Only show for prorated time periods */}
              {config.fieldName === 'timePeriod' && 
               values.timePeriod && ['ytd', 'mtd', 'today', 'sinceInception'].includes(values.timePeriod) && (
                <Box sx={{ 
                  mt: 4, 
                  p: 3, 
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  backgroundColor: 'primary.light',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.continuousCounter || false}
                        onChange={(e) => setFieldValue('continuousCounter', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1">Display as continuous counter</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Show real-time incrementing value on dashboards
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              )}

              {config.showIndicators && values.indicators?.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Your indicators:</strong> {values.indicators.slice(0, 3).join(', ')}
                    {values.indicators.length > 3 && ` and ${values.indicators.length - 3} more`}
                  </Typography>
                </Box>
              )}

              {/* Conditional fields for hover indicator type */}
              {config.conditionalFields && values[config.fieldName] && config.conditionalFields[values[config.fieldName]] && (
                <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {config.conditionalFields[values[config.fieldName]].map((field, index) => (
                    <Box key={field.name} sx={{ mb: index < config.conditionalFields[values[config.fieldName]].length - 1 ? 3 : 0 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>{field.label}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{field.description}</Typography>

                      {field.type === 'select' && (
                        <FormControl fullWidth>
                          <Select
                            value={values[field.fieldName] || ''}
                            onChange={(e) => setFieldValue(field.fieldName, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Select an option...</em>
                            </MenuItem>
                            {mainIndicators.map(indicator => (
                              <MenuItem key={indicator.value} value={indicator.value}>
                                {indicator.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {field.type === 'radio' && (
                        <FormikRadioGroup
                          name={field.fieldName}
                          type={field.fieldName === 'hoverSlot' ? 'number' : undefined}
                          gridItemProps={{ sm: 12, md: 4 }}
                        >
                          {field.options.map(option => (
                            <FormikRadioButton
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            />
                          ))}
                        </FormikRadioGroup>
                      )}
                    </Box>
                  ))}
                </Box>
              )}



              {/* Show next button when there are conditional fields, when auto-advance is disabled, or when explicitly requested */}
              {(config.conditionalFields || !config.autoAdvance || config.showNextButton) && (
                <StepperNextButton nextStep={nextStep} />
              )}
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );



    case 'review':
      const description = typeof config.description === 'function' 
        ? config.description(editMode) 
        : config.description;
      const buttonText = typeof config.submitButtonText === 'function'
        ? config.submitButtonText(editMode)
        : (editMode ? 'Update Indicator' : 'Create Indicator');
        
      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{description}</StepperDescription>
              
              <Grid container spacing={3}>
                {config.fields.map(field => (
                  <Grid item xs={12} sm={field.sm || 6} key={field.name}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>{field.label}</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {field.render ? field.render(values) : values[field.name] || 'Not specified'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Box mt={{ xs: 0, sm: 4 }} display='flex' alignItems='center'>
                <Button
                  type="submit"
                  onClick={onSubmit}
                  endIcon={<CheckIcon />}
                  fullWidth={false}
                >
                  {buttonText}
                </Button>
              </Box>
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    case 'select':
      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>{config.label}</InputLabel>
                <Select
                  value={values[config.fieldName] || ''}
                  onChange={(e) => setFieldValue(config.fieldName, e.target.value)}
                  label={config.label}
                >
                  {config.options?.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <StepperNextButton nextStep={nextStep} />
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    case 'formatting':
      return (
        <CustomErrorBoundary>
          <StepperAnimation>
            <Box>
              <StepperTitle>{config.title}</StepperTitle>
              <StepperDescription>{config.description}</StepperDescription>
              
              <Box sx={{ mt: 4 }}>
                {/* Decimal Places */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Decimal Places
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={values.decimalPlaces || 0}
                      onChange={(e) => setFieldValue('decimalPlaces', e.target.value)}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 1.5,
                          fontSize: '1rem'
                        }
                      }}
                    >
                      <MenuItem value={0}>No decimals (e.g. 15)</MenuItem>
                      <MenuItem value={1}>One decimal (e.g. 15.7)</MenuItem>
                      <MenuItem value={2}>Two decimals (e.g. 15.73)</MenuItem>
                      <MenuItem value={3}>Three decimals (e.g. 15.732)</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Choose how many decimal places to display in your aggregated values
                  </Typography>
                </Box>

                {/* Number Format */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Number Style
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={values.numberFormat || 'EU'}
                      onChange={(e) => setFieldValue('numberFormat', e.target.value)}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 1.5,
                          fontSize: '1rem'
                        }
                      }}
                    >
                      <MenuItem value="US">
                        <Box>
                          <Typography>US Format</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uses comma for thousands, period for decimals (1,234.56)
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="EU">
                        <Box>
                          <Typography>EU Format</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uses period for thousands, comma for decimals (1.234,56)
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Select your preferred thousands and decimal separator style
                  </Typography>
                </Box>
              </Box>

              <StepperNextButton nextStep={() => {
                // Ensure default values are set when advancing from formatting step
                if (values.decimalPlaces === undefined) {
                  setFieldValue('decimalPlaces', 0);
                }
                if (!values.numberFormat) {
                  setFieldValue('numberFormat', 'EU');
                }
                nextStep();
              }} />
            </Box>
          </StepperAnimation>
        </CustomErrorBoundary>
      );

    default:
      return null;
  }
};

export default memo(GenericWizardStep);
