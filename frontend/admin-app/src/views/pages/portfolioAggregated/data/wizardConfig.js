import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

const currentYear = new Date().getFullYear();

export const wizardSteps = [
  {
    name: 'name',
    type: 'text',
    title: 'Indicator Name',
    description: 'What would you like to call this aggregated indicator?',
    fieldName: 'name',
    placeholder: 'e.g., Total Families Housed',
    maxLength: 250,
    required: true,
    autoFocus: true,
    onEnterKey: 'nextStep',
    // Slovak field configuration
    slovakField: {
      fieldName: 'nameSlovak',
      placeholder: 'e.g., Celkový počet ubytovaných rodín',
      maxLength: 250,
      label: 'Indicator Name Slovak (Optional)'
    }
  },
  

  
  {
    name: 'category',
    type: 'autocomplete',
    title: 'Impact Area',
    description: 'What impact area category does this indicator belong to? Choose from common impact areas or type your own.',
    fieldName: 'category',
    placeholder: 'Select or type an impact area...',
    options: [
      'Housing', 'Environmental', 'Social Care', 'Economic', 'Health', 'Education',
      'Employment', 'Advocacy & Awareness', 'Diversity & Inclusion', 'Financial Inclusion',
      'Climate Action', 'Energy Access', 'Water & Sanitation', 'Food Security',
      'Gender Equality', 'Community Development', 'Technology Access', 'Governance',
      'Infrastructure', 'Innovation'
    ],
    maxLength: 100,
    letterCounter: true
  },
  
  {
    name: 'unit',
    type: 'autocomplete',
    title: 'Unit of Measurement',
    description: 'What unit will this indicator be measured in? Choose from common units or type your own.',
    fieldName: 'unit',
    placeholder: 'Select or type a unit...',
    options: [
      'people', 'families', 'households', 'individuals', 'children', 'students',
      'jobs', 'employees', 'businesses', 'companies', 'tons', 'kilograms', 'pounds',
      'liters', 'gallons', 'kilowatt hours', 'megawatts', 'dollars', 'euros',
      'pounds sterling', 'percentage', 'percent', 'hours', 'days', 'months', 'years',
      'projects', 'programs', 'initiatives', 'units', 'items', 'products', 'services',
      'hectares', 'acres', 'square meters', 'kilometers', 'miles'
    ],
    maxLength: 50,
    letterCounter: true,
    // Slovak field configuration
    slovakField: {
      fieldName: 'unitSlovak',
      placeholder: 'Vyberte alebo napíšte jednotku...',
      maxLength: 50,
      label: 'Unit of Measurement Slovak (Optional)',
      options: [
        'ľudia', 'rodiny', 'domácnosti', 'jednotlivci', 'deti', 'študenti',
        'pracovné miesta', 'zamestnanci', 'podniky', 'spoločnosti', 'tony', 'kilogramy', 'libry',
        'litre', 'galóny', 'kilowatthodiny', 'megawatty', 'doláry', 'eurá',
        'libry šterlingov', 'percento', 'percentá', 'hodiny', 'dni', 'mesiace', 'roky',
        'projekty', 'programy', 'iniciatívy', 'jednotky', 'položky', 'produkty', 'služby',
        'hektáre', 'akre', 'štvorcové metre', 'kilometre', 'míle'
      ]
    }
  },
  
  {
    name: 'sources',
    type: 'multi-select',
    title: 'Select Data Sources',
    description: 'Choose ventures and data sources to aggregate. You can select products/services, stakeholders, or indicators from across your portfolio.',
    venturesPlaceholder: 'Choose one or more ventures to include',
    sourcesPlaceholder: 'Select data sources (products, stakeholders, or indicators)'
  },
  

  
  {
    name: 'timePeriod',
    type: 'multiStep',
    title: 'Select Time Period',
    description: 'Choose how to calculate and display this indicator.',
    fieldName: 'timePeriod',
    steps: [
      {
        name: 'selection',
        title: 'Select Time Period',
        description: 'Choose how to calculate and display this indicator.',
        type: 'radio',
        fieldName: 'timePeriod',
        autoAdvance: false,
        showNextButton: true,
        options: [
          // Prorated periods
          {
            value: 'ytd',
            label: 'Year to Date (YTD)',
            description: `${currentYear} from Jan 1 through today`,
            hint: '✨ Supports continuous counter',
            years: [currentYear]
          },
          {
            value: 'mtd',
            label: 'Month to Date (MTD)',
            description: `${new Date().toLocaleDateString('default', { month: 'long' })} through today`,
            hint: '✨ Supports continuous counter',
            years: [currentYear]
          },
          {
            value: 'today',
            label: 'Today',
            description: 'Daily rate based on annual total',
            hint: '✨ Supports continuous counter',
            years: [currentYear]
          },
          // Full periods
          {
            value: 'currentYearFull',
            label: 'Current Year (Full)',
            description: `${currentYear} total`,
            years: [currentYear]
          },
          {
            value: 'lastYearFull',
            label: 'Last Year (Full)',
            description: `${currentYear - 1} total`,
            years: [currentYear - 1]
          },
          {
            value: 'last5Years',
            label: 'Last 5 Years',
            description: `${currentYear - 4} to ${currentYear - 1}`,
            years: Array.from({length: 5}, (_, i) => currentYear - 4 + i)
          },
          {
            value: 'sinceInception',
            label: 'Since Inception',
            description: 'All available years',
            hint: '✨ Supports continuous counter',
            years: Array.from({length: 10}, (_, i) => currentYear - i)
          }
        ]
      },
      {
        name: 'customization',
        title: 'Customize Time Period Labels',
        description: 'Customize how this time period will be displayed in your reports and dashboards. The fields are pre-filled with default labels that you can modify.',
        type: 'text',
        fieldName: 'timePeriodEnglish',
        placeholder: 'e.g., Q1 2024, First Half 2024, Custom Period',
        maxLength: 100,
        letterCounter: true,
        onEnterKey: 'nextStep',
        // Slovak field configuration
        slovakField: {
          fieldName: 'timePeriodSlovak',
          placeholder: 'e.g., Q1 2024, Prvá polovica 2024, Vlastné obdobie',
          maxLength: 100,
          label: 'Time Period Label Slovak (Optional)'
        }
      }
    ]
  },

  {
    name: 'calculation',
    type: 'radio',
    title: 'Configure Calculation Method',
    description: 'Choose how you want to aggregate the values across your selected ventures.',
    fieldName: 'aggregationType',
    autoAdvance: true,
    showNextButton: true,
    options: [
      {
        value: 'SUM',
        label: 'Sum',
        description: 'Add all values together across ventures'
      },
      {
        value: 'AVERAGE',
        label: 'Average',
        description: 'Calculate the mean value across ventures'
      }
    ]
  },
  
  {
    name: 'formatting',
    type: 'formatting',
    title: 'Number Display Format',
    description: 'Choose how your aggregated values should be displayed on your dashboards and reports.'
  },
  
  {
    name: 'indicatorType',
    type: 'radio',
    title: 'Indicator Type',
    description: 'Choose whether this is a main indicator or a hover detail for an existing main indicator.',
    fieldName: 'indicatorType',
    autoAdvance: true,
    options: [
      {
        value: 'main',
        label: 'Main Indicator',
        description: 'This will be displayed as a primary indicator value'
      },
      {
        value: 'hover',
        label: 'Hover Detail',
        description: 'This will be displayed as additional detail when hovering over a main indicator'
      }
    ],
    // Dynamic fields based on selection
    conditionalFields: {
      hover: [
        {
          name: 'parentIndicatorId',
          type: 'select',
          label: 'Select Main Indicator',
          description: 'Choose which main indicator this hover detail belongs to',
          fieldName: 'parentIndicatorId',
          optionsSource: 'mainIndicators' // This will be populated dynamically
        },
        {
          name: 'hoverSlot',
          type: 'radio',
          label: 'Hover Position',
          description: 'Choose which hover slot (1, 2, or 3) this detail should occupy',
          fieldName: 'hoverSlot',
          options: [
            { value: 1, label: 'Hover 1' },
            { value: 2, label: 'Hover 2' },
            { value: 3, label: 'Hover 3' }
          ]
        }
      ]
    }
  },
  
  {
    name: 'review',
    type: 'review',
    title: 'Review Your Aggregated Indicator',
    description: (editMode) => editMode 
      ? 'Please review the details below and click "Update Indicator" to save your changes.'
      : 'Please review the details below and click "Create Indicator" to save your aggregated indicator.',
    submitButtonText: (editMode) => editMode ? 'Update Indicator' : 'Create Indicator',
    fields: [
      { name: 'name', label: 'Indicator Name' },
      { name: 'nameSlovak', label: 'Indicator Name Slovak (Optional)' },
      { name: 'category', label: 'Category' },
      { name: 'unit', label: 'Unit of Measurement' },
      { name: 'unitSlovak', label: 'Unit of Measurement Slovak (Optional)' },
      {
        name: 'aggregationType',
        label: 'Calculation Method',
        render: (values) => {
          const labels = {
            'SUM': 'Sum - Add all values together',
            'AVERAGE': 'Average - Calculate mean value'
          };
          return labels[values.aggregationType] || values.aggregationType;
        }
      },
      {
        name: 'decimalPlaces',
        label: 'Number Format',
        render: (values) => {
          const decimalText = values.decimalPlaces === 0 ? 'No decimals' : `${values.decimalPlaces} decimal${values.decimalPlaces > 1 ? 's' : ''}`;
          const formatText = values.numberFormat === 'EU' ? 'EU format (1.234,56)' : 'US format (1,234.56)';
          return `${decimalText}, ${formatText}`;
        }
      },
      {
        name: 'timePeriod',
        label: 'Time Period',
        render: (values) => {
          if (!values.timePeriod) return 'None selected';
          const periodLabels = {
            'ytd': 'Year to Date (YTD)',
            'mtd': 'Month to Date (MTD)',
            'today': 'Today',
            'currentYearFull': 'Current Year (Full)',
            'lastYearFull': 'Last Year (Full)',
            'last5Years': 'Last 5 Years',
            'sinceInception': 'Since Inception'
          };
          // Show the enum/calculation type, not the custom label
          const displayLabel = periodLabels[values.timePeriod] || values.timePeriod;
          return (
            <Box>
              <Chip
                label={displayLabel}
                size="small"
                color="info"
                variant="outlined"
              />
              {values.selectedYear && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  Year: {values.selectedYear}
                </Typography>
              )}
            </Box>
          );
        }
      },
      { name: 'timePeriodEnglish', label: 'Time Period Label (Optional)' },
      { name: 'timePeriodSlovak', label: 'Time Period Label Slovak (Optional)' },
      {
        name: 'continuousCounter',
        label: 'Continuous Counter',
        render: (values) => {
          if (values.continuousCounter && ['ytd', 'mtd', 'today'].includes(values.timePeriod)) {
            return <Chip label="Enabled - Live Counter" size="small" color="success" />;
          }
          return null;
        }
      },
      {
        name: 'indicatorType',
        label: 'Indicator Type',
        render: (values) => {
          if (values.indicatorType === 'hover') {
            return (
              <Box>
                <Chip label="Hover Detail" size="small" color="warning" variant="outlined" />
                {values.parentIndicatorId && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Parent: Main Indicator #{values.parentIndicatorId} | Slot: {values.hoverSlot}
                  </Typography>
                )}
              </Box>
            );
          }
          return <Chip label="Main Indicator" size="small" color="success" variant="outlined" />;
        }
      },
      {
        name: 'ventures',
        label: 'Selected Ventures',
        sm: 12,
        render: (values) => {
          if (!values.ventures?.length) return 'None selected';
          return values.ventures.map((v, i) => (
            <Chip key={i} label={v.venture?.name || v.name} size="small" sx={{ mr: 1, mb: 1 }} color="primary" variant="outlined" />
          ));
        }
      },
      {
        name: 'dataSources',
        label: 'Data Sources',
        sm: 12,
        render: (values) => {
          if (!values.dataSources?.length) return 'None specified';
          return values.dataSources.map((source, i) => (
            <Chip key={i} label={source.sourceName} size="small" sx={{ mr: 1, mb: 1 }} color="secondary" variant="outlined" />
          ));
        }
      }
    ]
  }
];
