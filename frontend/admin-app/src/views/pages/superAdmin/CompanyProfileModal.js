import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Zoom
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { toast } from "react-toastify";
import { v1LongTimeout } from "services/api";
import ConfirmModal from "shared-components/views/components/modal/ConfirmModal";

// Import new section components
import CompanyHeaderSection from './components/CompanyProfileSections/CompanyHeaderSection';
import CompanyOverviewSection from './components/CompanyProfileSections/CompanyOverviewSection';
import SustainabilityScoresSection from './components/CompanyProfileSections/SustainabilityScoresSection';
import TechnologyClusterSection from './components/CompanyProfileSections/TechnologyClusterSection';
import CoreProductsSection from './components/CompanyProfileSections/CoreProductsSection';
import ESGMaterialitySection from './components/CompanyProfileSections/ESGMaterialitySection';
import TheoryOfChangeSection from './components/CompanyProfileSections/TheoryOfChangeSection';
import CarbonEmissionsSection from './components/CompanyProfileSections/CarbonEmissionsSection';
import FinancialDataSection from './components/CompanyProfileSections/FinancialDataSection';
import SocialMediaSection from './components/CompanyProfileSections/SocialMediaSection';
import CertificationsSection from './components/CompanyProfileSections/CertificationsSection';
import ESGRiskScoreSection from './components/CompanyProfileSections/ESGRiskScoreSection';
import ESGForesightScoreSection from './components/CompanyProfileSections/ESGForesightScoreSection';
import PatentInformationSection from './components/CompanyProfileSections/PatentInformationSection';
import CompanyPolarAreaSection from './components/CompanyProfileSections/CompanyPolarAreaSection';
import CompanyScoringOverviewSection from './components/CompanyProfileSections/CompanyScoringOverviewSection';
import GrowthLikelihoodSection from './components/CompanyProfileSections/GrowthLikelihoodSection';
import CompanyImpactRatioSection from './components/CompanyProfileSections/CompanyImpactRatioSection';
import CompanyTripleBottomLineSection from './components/CompanyProfileSections/CompanyTripleBottomLineSection';
import CompanySdgContributionSection from './components/CompanyProfileSections/CompanySdgContributionSection';
import CompanyStakeholderGeographySection from './components/CompanyProfileSections/CompanyStakeholderGeographySection';
import CompanyNotesSection from './components/CompanyProfileSections/CompanyNotesSection';

// Styled components for the redesigned modal
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(1), // Subtle rounding, not completely square
    height: '90vh',
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    maxWidth: '2000px'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: '#fafafa', // Very light gray background
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  backgroundColor: '#fafafa',
  padding: theme.spacing(3),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#c0c0c0',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#a0a0a0',
    }
  }
}));

// New component for section containers (replaces cards)
const SectionContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  // No border or shadow - clean look
}));

// Section header matching screenshot style
const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#666666',
  marginBottom: theme.spacing(2)
}));

// Row container for label/value pairs
const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 0),
  '&:not(:last-child)': {
    borderBottom: '1px solid #f5f5f5'
  }
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: '#666666',
  fontWeight: 400
}));

const InfoValue = styled(Box)(({ theme }) => ({
  fontSize: '13px',
  color: '#333333',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

// Data quality indicator dot
const QualityDot = styled(Box)(({ isActual }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: isActual ? '#4caf50' : '#ff9800',
  flexShrink: 0
}));

const CompanyProfileModal = ({ open, onClose, companyData, onSave, onDelete, availableTags = [], portfolioId }) => {
  const [localCompanyData, setLocalCompanyData] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // State for editing company data
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [editedCurrency, setEditedCurrency] = useState('EUR');
  const [editedDataType, setEditedDataType] = useState('n.a.');
  
  // State for tag management
  const [tagInput, setTagInput] = useState('');
  
  // State to track if we're in a rerun operation
  const [isRerunning, setIsRerunning] = useState(false);
  
  // Polar-area chart state
  const [polarChartData, setPolarChartData] = useState(null);
  const [polarChartLoading, setPolarChartLoading] = useState(false);
  const [polarChartError, setPolarChartError] = useState(false);

  // Delete confirmation dialog state (for superadmins)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOption, setDeleteOption] = useState(null); // 'portfolio' or 'database'

  // Simple remove confirmation dialog state (for non-superadmins)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Normalize company data to ensure all required fields exist
  const normalizeCompanyData = (data) => {
    if (!data) {
      console.error('normalizeCompanyData received null/undefined data');
      return null;
    }
    
    console.log('normalizeCompanyData input:', data);
    console.log('Input data keys:', Object.keys(data));
    console.log('Emissions breakdown present?', data.emissions_breakdown ? 'YES' : 'NO');
    if (data.emissions_breakdown) {
      console.log('Emissions breakdown length:', data.emissions_breakdown.length);
      console.log('First emission item:', data.emissions_breakdown[0]);
    }
    
    const normalized = {
      ...data,
      // Ensure social media objects exist
      social_media_links: data.social_media_links || {},
      social_media_follower_counts: data.social_media_follower_counts || {},
      // Ensure ESG data structure exists
      esg_materiality_analysis: data.esg_materiality_analysis || { topics: [] },
      // Ensure array fields are arrays
      theory_of_change: Array.isArray(data.theory_of_change) ? data.theory_of_change : [],
      impact_scoring: Array.isArray(data.impact_scoring) ? data.impact_scoring : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      // Ensure emissions breakdown array exists
      emissions_breakdown: Array.isArray(data.emissions_breakdown) ? data.emissions_breakdown : [],
      // Ensure core products/services structure exists
      core_products_services: data.core_products_services || { category_title: '', items: [] },
      // Add any other normalizations as needed
    };
    
    console.log('normalizeCompanyData output:', normalized);
    console.log('Normalized emissions_breakdown:', normalized.emissions_breakdown);
    return normalized;
  };

  useEffect(() => {
    console.log('[CompanyProfileModal] useEffect - companyData changed:', companyData);
    if (companyData) {
      const normalized = normalizeCompanyData(companyData);
      setLocalCompanyData(normalized);
      console.log('[CompanyProfileModal] localCompanyData set with emissions_breakdown:', normalized.emissions_breakdown);
    }
  }, [companyData]);

  useEffect(() => {
    let isMounted = true;

    const fetchPolarChartData = async () => {
      if (!companyData?.id || !open) {
        setPolarChartData(null);
        setPolarChartError(false);
        return;
      }

      setPolarChartLoading(true);
      setPolarChartError(false);

      try {
        const polarAreaUrl = portfolioId
          ? `/companies/profile/${companyData.id}/polar-area?portfolioId=${portfolioId}`
          : `/companies/profile/${companyData.id}/polar-area`;
        const response = await v1LongTimeout.get(polarAreaUrl);
        if (isMounted) {
          setPolarChartData(response.data);
        }
      } catch (err) {
        console.error('Error fetching polar-area chart data:', err);
        if (isMounted) {
          setPolarChartError(true);
          setPolarChartData(null);
        }
      } finally {
        if (isMounted) {
          setPolarChartLoading(false);
        }
      }
    };

    fetchPolarChartData();

    return () => {
      isMounted = false;
    };
  }, [companyData?.id, open]);

  // Check if user is superadmin on mount (for edit button visibility)
  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      try {
        const response = await v1LongTimeout.get('/companies/is-superadmin');
        setIsSuperAdmin(response.data.isSuperAdmin);
      } catch (error) {
        console.error('Error checking superadmin status:', error);
        setIsSuperAdmin(false);
      }
    };

    if (open) {
      checkSuperAdminStatus();
    }
  }, [open]);

  // Tags are now passed as props from parent component (no API call needed)

  const handleEditField = (fieldName, currentValue, fieldType) => {
    // Special handling for file upload (company logo)
    if (fieldType === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (limit to 2MB for base64)
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Image size must be less than 2MB');
          return;
        }
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64String = reader.result;
          
          try {
            // Update using the existing endpoint
            const updatePayload = {
              [fieldName]: base64String
            };
            
            const response = await v1LongTimeout.put(
              `/companies/${localCompanyData.id}`,
              updatePayload
            );
            
            if (response.status === 200 && response.data) {
              // Update local state with new logo URL
              const updatedData = normalizeCompanyData(response.data);
              setLocalCompanyData(updatedData);
              
              // Call onSave to update parent
              if (onSave) {
                try {
                  await onSave(updatedData);
                } catch (err) {
                  console.error('Parent save failed:', err);
                }
              }
              
              toast.success('Logo updated successfully');
            }
          } catch (error) {
            console.error('Error updating logo:', error);
            toast.error('Failed to update logo');
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    
    setEditingField(fieldName);
    
    // For annual sales fields, handle formatted values and extract the year
    if (fieldName.startsWith('annual_sales_')) {
      const year = fieldName.replace('annual_sales_', '');
      const currencyField = `currency_${year}`;
      const dataTypeField = `annual_sales_${year}_type`;

      // Set the current value - it might be formatted like "1.5M"
      setEditedValue(currentValue || '');

      // Set currency and data type
      setEditedCurrency(localCompanyData[currencyField] || 'EUR');
      setEditedDataType(localCompanyData[dataTypeField] || 'n.a.');

      // Log for debugging
      console.log(`Editing ${fieldName}: value='${currentValue}', currency='${localCompanyData[currencyField]}', type='${localCompanyData[dataTypeField]}'`);
    } else if (fieldName === 'total_funding_amount') {
      // Handle total funding amount similar to annual sales
      const currencyField = 'funding_currency';
      const dataTypeField = 'total_funding_amount_type';

      // Set the current value - it might be formatted like "2.5M"
      setEditedValue(currentValue || '');

      // Set currency and data type
      setEditedCurrency(localCompanyData[currencyField] || 'EUR');
      setEditedDataType(localCompanyData[dataTypeField] || 'n.a.');

      // Log for debugging
      console.log(`Editing ${fieldName}: value='${currentValue}', currency='${localCompanyData[currencyField]}', type='${localCompanyData[dataTypeField]}'`);
    } else {
      setEditedValue(currentValue || '');
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveField = async (fieldNameOrPayload, value) => {
    if (!localCompanyData?.id) {
      toast.error('Unable to save: missing company ID');
      return;
    }

    // Don't save fields during rerun operations
    if (isRerunning) {
      console.log('Skipping field save during rerun operation');
      return;
    }

    try {
      // Support both single field update and multi-field update
      let updatePayload;
      let fieldDescription;

      if (typeof fieldNameOrPayload === 'string') {
        // Single field update: handleSaveField('fieldName', value)
        updatePayload = {
          [fieldNameOrPayload]: value
        };
        fieldDescription = fieldNameOrPayload;
      } else if (typeof fieldNameOrPayload === 'object' && fieldNameOrPayload !== null) {
        // Multi-field update: handleSaveField({ field1: value1, field2: value2 })
        updatePayload = fieldNameOrPayload;
        fieldDescription = Object.keys(fieldNameOrPayload).join(', ');
      } else {
        toast.error('Invalid update parameters');
        return;
      }

      // Call the API to update the company
      const response = await v1LongTimeout.put(
        `/companies/${localCompanyData.id}`,
        updatePayload
      );

      if (response.status === 200 && response.data) {
        // Update local state with the response data
        const updatedData = normalizeCompanyData(response.data);
        setLocalCompanyData(updatedData);

        // Also call onSave to update parent component - wrap in try-catch
        if (onSave) {
          try {
            onSave(response.data);
          } catch (parentError) {
            console.warn('Parent onSave handler threw an error:', parentError);
            // Don't show error toast - the save was successful
          }
        }
        // Success - no toast needed for inline field saves to avoid clutter
        return true; // Indicate success
      } else {
        toast.error(`Failed to save ${fieldDescription}. Please try again.`);
        return false;
      }
    } catch (error) {
      // Only show error if it's an actual HTTP error
      if (error.response || error.request) {
        toast.error(`Failed to save. Please try again.`);
      }
      return false;
    }
  };

  const handleSaveEdit = async () => {
    if (!editingField || !localCompanyData?.id) {
      toast.error('Unable to save: missing data');
      return;
    }
    
    // Don't save edits during rerun operations
    if (isRerunning) {
      console.log('Skipping edit save during rerun operation');
      handleCloseEdit();
      return;
    }

    try {
      // Prepare the update payload
      const updatePayload = {
        [editingField]: editedValue
      };
      
      // Special handling for cluster confidence score (remove % sign)
      if (editingField === 'cluster_confidence_score') {
        updatePayload[editingField] = editedValue.replace('%', '').trim();
      }
      
      // For annual sales fields, also update the currency and data type
      if (editingField.startsWith('annual_sales_')) {
        const year = editingField.replace('annual_sales_', '');
        const currencyField = `currency_${year}`;
        const dataTypeField = `annual_sales_${year}_type`;

        // Validate consistency: if value is empty/N/A, force type to n.a.
        if (!editedValue || editedValue.trim() === '' ||
            editedValue.toUpperCase() === 'N/A' ||
            editedValue.toUpperCase() === 'N.A.') {
          updatePayload[dataTypeField] = 'n.a.';
          updatePayload[currencyField] = null;
          console.log(`Forcing type to 'n.a.' and clearing currency for empty sales value`);
        } else {
          // Value exists - ensure type is not n.a.
          if (editedDataType === 'n.a.') {
            updatePayload[dataTypeField] = 'estimate'; // Default to estimate
            console.log(`Sales value exists but type was 'n.a.' - changing to 'estimate'`);
          } else {
            updatePayload[dataTypeField] = editedDataType;
          }
          updatePayload[currencyField] = editedCurrency || 'EUR';
        }
      } else if (editingField === 'total_funding_amount') {
        // Handle total funding amount similar to annual sales
        const currencyField = 'funding_currency';
        const dataTypeField = 'total_funding_amount_type';

        // Validate consistency: if value is empty/N/A, force type to n.a.
        if (!editedValue || editedValue.trim() === '' ||
            editedValue.toUpperCase() === 'N/A' ||
            editedValue.toUpperCase() === 'N.A.') {
          updatePayload[dataTypeField] = 'n.a.';
          updatePayload[currencyField] = null;
          console.log(`Forcing type to 'n.a.' and clearing currency for empty funding value`);
        } else {
          // Value exists - ensure type is not n.a.
          if (editedDataType === 'n.a.') {
            updatePayload[dataTypeField] = 'estimate'; // Default to estimate
            console.log(`Funding value exists but type was 'n.a.' - changing to 'estimate'`);
          } else {
            updatePayload[dataTypeField] = editedDataType;
          }
          updatePayload[currencyField] = editedCurrency || 'EUR';
        }
      }
      
      // Make API call to update the field
      const response = await v1LongTimeout.put(
        `/companies/${localCompanyData.id}`,
        updatePayload
      );
      
      // Check for successful HTTP status
      if (response.status === 200 && response.data) {
        console.log('Update response received:', response);
        
        // Normalize the response data before setting it
        const normalizedData = normalizeCompanyData(response.data);
        setLocalCompanyData(normalizedData);
        
        // Call parent's onSave to update the grid - wrap in try-catch to prevent it from affecting our success handling
        if (onSave) {
          try {
            onSave(response.data); // Pass actual data to parent - it will do its own transformation
          } catch (parentError) {
            console.warn('Parent onSave handler threw an error:', parentError);
            // Don't show error toast - the save was successful
          }
        }
        
        toast.success(`Successfully updated ${editingField.replace(/_/g, ' ')}`);
      } else {
        // Unexpected response structure
        console.error('Unexpected response structure:', response);
        toast.error('Received unexpected response from server');
      }
      
    } catch (error) {
      // Only show error toast if this is an actual HTTP error
      if (error.response) {
        console.error('Error updating company data:', error);
        const errorMessage = error.response?.data?.error || 'Failed to update company data';
        toast.error(errorMessage);
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        toast.error('Failed to send update request');
      }
    } finally {
      handleCloseEdit();
    }
  };

  const handleDeleteClick = () => {
    setDeleteOption(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteOption(null);
  };

  const handleDeleteConfirm = async () => {
    if (!localCompanyData || !deleteOption) {
      return;
    }

    setIsDeleting(true);
    try {
      if (deleteOption === 'portfolio') {
        if (!portfolioId) {
          toast.error('Cannot remove from portfolio: missing portfolio context');
          return;
        }
        await v1LongTimeout.delete(
          `/companies/${localCompanyData.id}/portfolio/${portfolioId}`
        );
        toast.success('Company removed from portfolio successfully');
      } else {
        await v1LongTimeout.delete(`/companies/${localCompanyData.id}`);
        toast.success('Company deleted from database successfully');
      }

      setDeleteDialogOpen(false);
      setDeleteOption(null);
      onClose();

      // Trigger refresh in parent - pass skipApiCall flag since we already made the call
      if (onDelete) {
        onDelete(localCompanyData.id, deleteOption, true);
      }
    } catch (error) {
      console.error(`Error ${deleteOption === 'portfolio' ? 'removing from portfolio' : 'deleting from database'}:`, error);
      toast.error(`Failed to ${deleteOption === 'portfolio' ? 'remove company from portfolio' : 'delete company from database'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler for non-superadmin removal from portfolio
  const handleRemoveClick = () => {
    setRemoveDialogOpen(true);
  };

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false);
  };

  const handleRemoveConfirm = async () => {
    if (!localCompanyData || !portfolioId) {
      toast.error('Cannot remove from portfolio: missing data');
      return;
    }

    setIsRemoving(true);
    try {
      // Use the new portfolio member endpoint
      await v1LongTimeout.delete(
        `/companies/portfolio/${portfolioId}/company/${localCompanyData.id}`
      );
      toast.success('Company removed from portfolio successfully');

      setRemoveDialogOpen(false);
      onClose();

      // Trigger refresh in parent
      if (onDelete) {
        onDelete(localCompanyData.id, 'portfolio', true);
      }
    } catch (error) {
      console.error('Error removing company from portfolio:', error);
      toast.error('Failed to remove company from portfolio');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingField(null);
    setEditedValue('');
    setEditedCurrency('EUR');
    setEditedDataType('n.a.');
  };

  const handleRerun = async (type, companyId, userInstructions = null) => {
    // Set rerunning flag at the start
    setIsRerunning(true);

    try {
      let endpoint;
      if (type === 'emissions') {
        endpoint = 'rerun-emissions';
      } else if (type === 'esg-risk') {
        endpoint = 'rerun-esg-risk';
      } else if (type === 'theory-of-change') {
        endpoint = 'rerun-theory-of-change';
      } else if (type === 'narrative') {
        endpoint = 'rerun-narrative';
      } else {
        console.error(`Unknown rerun type: ${type}`);
        setIsRerunning(false);
        return;
      }
      console.log(`Starting ${type} rerun for company ${companyId}`);

      // Build request body
      const requestBody = {
        companyIds: [companyId],
        dryRun: false
      };

      if (userInstructions) {
        requestBody.userInstructions = userInstructions;
        console.log('User instructions:', userInstructions);
      }

      const response = await v1LongTimeout.post(
        `/companies/${endpoint}`,
        requestBody
      );
      
      console.log(`${type} rerun response:`, response.data);
      
      // Check if the rerun was successful - be more explicit about status check
      if (response.status === 200) {
        const isSuccess = (
          (response.data.success_count && response.data.success_count > 0) ||
          (response.data.results && response.data.results.length > 0 && 
           response.data.results.some(r => r.status === 'success'))
        );
        
        if (isSuccess) {
          let successMessage;
          if (type === 'emissions') {
            successMessage = 'Emissions recalculated successfully';
          } else if (type === 'esg-risk') {
            successMessage = 'ESG scores recalculated successfully';
          } else if (type === 'theory-of-change') {
            successMessage = 'Theory of Change regenerated successfully';
          } else if (type === 'narrative') {
            successMessage = 'Foresight snapshot narrative regenerated successfully';
          } else {
            successMessage = 'Data recalculated successfully';
          }
          toast.success(successMessage);
          
          // Refresh the company profile data
          console.log(`Refreshing profile data for company ${companyId}`);
          try {
            const refreshedProfileUrl = portfolioId
              ? `/companies/profile/${companyId}?portfolioId=${portfolioId}`
              : `/companies/profile/${companyId}`;
            const profileResponse = await v1LongTimeout.get(refreshedProfileUrl);
            if (profileResponse.status === 200 && profileResponse.data) {
              const updatedData = normalizeCompanyData(profileResponse.data);
              setLocalCompanyData(updatedData);
              
              // Also update parent component - wrap in try-catch
              if (onSave) {
                try {
                  onSave(profileResponse.data);
                } catch (parentError) {
                  console.warn('Parent onSave handler threw an error:', parentError);
                  // Don't show error - the rerun was successful
                }
              }
            }
          } catch (profileError) {
            console.warn('Failed to refresh profile after rerun:', profileError);
            // Don't show error toast - the rerun itself was successful
          }

          // For narrative rerun, also refresh the polar chart response so the
          // new narrative text appears without a manual reload.
          if (type === 'narrative') {
            try {
              const polarAreaUrl = portfolioId
                ? `/companies/profile/${companyId}/polar-area?portfolioId=${portfolioId}`
                : `/companies/profile/${companyId}/polar-area`;
              const polarResponse = await v1LongTimeout.get(polarAreaUrl);
              if (polarResponse.status === 200 && polarResponse.data) {
                setPolarChartData(polarResponse.data);
              }
            } catch (polarError) {
              console.warn('Failed to refresh polar chart after narrative rerun:', polarError);
            }
          }
        } else {
          console.warn(`${type} rerun completed but no data was updated:`, response.data);
          toast.warning('Rerun completed but no data was updated');
        }
      } else {
        // Non-200 status
        console.error(`Unexpected status ${response.status} for ${type} rerun`);
        toast.error(`Unexpected response from server (status ${response.status})`);
      }
    } catch (error) {
      // Only show error toast for actual HTTP errors
      if (error.response) {
        console.error(`Error rerunning ${type}:`, error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.error || `Failed to rerun ${type === 'emissions' ? 'emissions' : 'ESG'} calculation`;
        toast.error(errorMessage);
      } else if (error.request) {
        console.error('No response received for rerun:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up rerun request:', error.message);
        toast.error('Failed to send rerun request');
      }
    } finally {
      // Always clear the rerunning flag
      setIsRerunning(false);
    }
  };

  if (!localCompanyData) {
    return null;
  }

  return (
    <>
      <StyledDialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        TransitionComponent={Zoom}
        transitionDuration={300}
      >
        <StyledDialogTitle>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600 }}>
            {localCompanyData.company_name ? `${localCompanyData.company_name}'s Company Profile` : 'Company Profile'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          <Box sx={{ maxWidth: '95%', mx: 'auto' }}>
            {/* Company Header with Logo, Description, and Address */}
            <CompanyHeaderSection data={localCompanyData} onEdit={isSuperAdmin ? handleEditField : undefined} />

            {/* Company Overview */}
            <CompanyOverviewSection data={localCompanyData} onEdit={isSuperAdmin ? handleEditField : undefined} />

            {/* Polar-Area Performance Overview */}
            <CompanyPolarAreaSection
              polarData={polarChartData}
              loading={polarChartLoading}
              error={polarChartError}
              companyId={localCompanyData.id}
              onRerun={isSuperAdmin ? handleRerun : undefined}
            />

            {/* Core Products/Services */}
            <CoreProductsSection data={localCompanyData} />

            {/* Sustainability Scores */}
            <SustainabilityScoresSection data={localCompanyData} />

            {/* Technology Cluster */}
            <TechnologyClusterSection data={localCompanyData} onEdit={handleEditField} />

            {/* ESG Materiality Analysis */}
            <ESGMaterialitySection data={localCompanyData} />

            {/* ESG Risk Scores */}
            <ESGRiskScoreSection
              data={localCompanyData}
              companyId={localCompanyData.id}
              onRerun={handleRerun}
            />

            {/* ESG Foresight Scores */}
            <ESGForesightScoreSection
              data={localCompanyData}
            />

            {/* Theory of Change */}
            <TheoryOfChangeSection
              data={localCompanyData}
              companyId={localCompanyData.id}
              onRerun={isSuperAdmin ? handleRerun : undefined}
            />

            {/* Impact Ratio - Positive vs Negative */}
            <CompanyImpactRatioSection data={localCompanyData} />

            {/* Triple Bottom Line - Biosphere/Society/Economy */}
            <CompanyTripleBottomLineSection data={localCompanyData} />

            {/* SDG Contribution Breakdown */}
            <CompanySdgContributionSection data={localCompanyData} />

            {/* Stakeholder Impact Geography */}
            <CompanyStakeholderGeographySection data={localCompanyData} />

            {/* Impact Scoring Overview */}
            <CompanyScoringOverviewSection data={localCompanyData} />

            {/* Growth Likelihood */}
            <GrowthLikelihoodSection data={localCompanyData} />

            {/* Financial Data */}
            <FinancialDataSection data={localCompanyData} onEdit={handleEditField} />

            {/* Carbon Emissions */}
            <CarbonEmissionsSection
              data={localCompanyData}
              companyId={localCompanyData.id}
              onRerun={isSuperAdmin ? handleRerun : undefined}
            />

            {/* Certifications & Awards */}
            <CertificationsSection data={localCompanyData} onEdit={handleEditField} />

            {/* Social Media */}
            <SocialMediaSection data={localCompanyData} onEdit={isSuperAdmin ? handleSaveField : undefined} />

            {/* Patent Information */}
            <PatentInformationSection data={localCompanyData} />

            {/* Internal Notes - Portfolio scoped */}
            <CompanyNotesSection
              companyId={localCompanyData.id}
              portfolioId={portfolioId}
            />

            {/* Tags Section - More compact */}
            <Box sx={{ 
              backgroundColor: '#ffffff',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Typography sx={{ 
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#666666'
              }}>
                Tags
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {localCompanyData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    onDelete={() => {
                      const updatedTags = localCompanyData.tags.filter((_, i) => i !== index);
                      setLocalCompanyData(prev => ({ ...prev, tags: updatedTags }));
                      handleSaveField('tags', updatedTags);
                    }}
                    sx={{ 
                      height: 28,
                      fontSize: '14px',
                      backgroundColor: '#f0f0f0',
                      '& .MuiChip-deleteIcon': {
                        fontSize: 18
                      }
                    }}
                  />
                ))}
                <Autocomplete
                  value={null}
                  onChange={(event, newValue) => {
                    if (newValue && !localCompanyData.tags.includes(newValue)) {
                      const updatedTags = [...localCompanyData.tags, newValue];
                      setLocalCompanyData(prev => ({ ...prev, tags: updatedTags }));
                      handleSaveField('tags', updatedTags);
                      setTagInput('');
                    }
                  }}
                  inputValue={tagInput}
                  onInputChange={(event, newInputValue) => {
                    setTagInput(newInputValue);
                  }}
                  options={availableTags.filter(tag => !localCompanyData.tags.includes(tag))}
                  freeSolo
                  autoSelect
                  clearOnBlur
                  size="small"
                  sx={{ minWidth: 150 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Add tag..."
                      size="small"
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          height: 32,
                          fontSize: '14px',
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>
        </StyledDialogContent>
        
        <DialogActions sx={{
          p: 2,
          backgroundColor: '#fafafa',
          justifyContent: 'space-between'
        }}>
          {isSuperAdmin ? (
            <Button
              onClick={handleDeleteClick}
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Delete Company
            </Button>
          ) : portfolioId ? (
            <Button
              onClick={handleRemoveClick}
              color="error"
              startIcon={<DeleteIcon />}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Remove from Portfolio
            </Button>
          ) : (
            <div /> // Empty div to maintain space-between layout
          )}
          <Button
            onClick={onClose}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </StyledDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit {editingField?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={(editingField?.startsWith('annual_sales_') || editingField === 'total_funding_amount') ? 4 : 12}>
              <TextField
                autoFocus
                margin="dense"
                fullWidth
                label={editingField?.startsWith('annual_sales_') ? 'Sales Amount' :
                       editingField === 'total_funding_amount' ? 'Funding Amount' : undefined}
                multiline={editingField?.includes('description') || editingField?.includes('justification')}
                rows={editingField?.includes('description') || editingField?.includes('justification') ? 4 : 1}
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                placeholder={(editingField?.startsWith('annual_sales_') || editingField === 'total_funding_amount') ? 'e.g., 1.5M, 500K, 2B' : ''}
              />
            </Grid>
            {(editingField?.startsWith('annual_sales_') || editingField === 'total_funding_amount') && (
              <>
                <Grid item xs={4}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={editedCurrency}
                      onChange={(e) => setEditedCurrency(e.target.value)}
                      label="Currency"
                    >
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="JPY">JPY</MenuItem>
                      <MenuItem value="CNY">CNY</MenuItem>
                      <MenuItem value="CHF">CHF</MenuItem>
                      <MenuItem value="CAD">CAD</MenuItem>
                      <MenuItem value="AUD">AUD</MenuItem>
                      <MenuItem value="SEK">SEK</MenuItem>
                      <MenuItem value="NOK">NOK</MenuItem>
                      <MenuItem value="DKK">DKK</MenuItem>
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="SGD">SGD</MenuItem>
                      <MenuItem value="HKD">HKD</MenuItem>
                      <MenuItem value="KRW">KRW</MenuItem>
                      <MenuItem value="RUB">RUB</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Data Type</InputLabel>
                    <Select
                      value={editedDataType}
                      onChange={(e) => setEditedDataType(e.target.value)}
                      label="Data Type"
                      disabled={!editedValue || editedValue.trim() === '' || editedValue.toUpperCase() === 'N/A'}
                    >
                      <MenuItem value="actual">Actual</MenuItem>
                      <MenuItem value="estimate">Estimate</MenuItem>
                      <MenuItem value="n.a.">N/A</MenuItem>
                    </Select>
                    {(!editedValue || editedValue.trim() === '') && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Type is automatically set to N/A when no value
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Delete Company
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            How would you like to delete "{localCompanyData?.company_name || 'this company'}"?
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {portfolioId && (
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderColor: deleteOption === 'portfolio' ? 'primary.main' : 'divider',
                  borderWidth: deleteOption === 'portfolio' ? 2 : 1,
                  backgroundColor: deleteOption === 'portfolio' ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: deleteOption === 'portfolio' ? 'action.selected' : '#f5f5f5' }
                }}
                onClick={() => !isDeleting && setDeleteOption('portfolio')}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Remove from this portfolio only
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The company will be removed from the current portfolio but will remain in the database
                  and accessible from other portfolios.
                </Typography>
              </Card>
            )}

            <Card
              variant="outlined"
              sx={{
                p: 2,
                cursor: 'pointer',
                borderColor: deleteOption === 'database' ? 'error.main' : 'error.light',
                borderWidth: deleteOption === 'database' ? 2 : 1,
                backgroundColor: deleteOption === 'database' ? 'error.lighter' : 'transparent',
                '&:hover': { backgroundColor: deleteOption === 'database' ? 'error.lighter' : '#fff5f5' }
              }}
              onClick={() => !isDeleting && setDeleteOption('database')}
            >
              <Typography variant="subtitle1" fontWeight={600} color="error">
                Delete from entire database
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will permanently delete the company and all associated data (news events, patents, etc.)
                from all portfolios. This action cannot be undone.
              </Typography>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting || !deleteOption}
            variant="contained"
            color="error"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Simple Remove Confirmation Dialog for non-superadmins */}
      <ConfirmModal
        open={removeDialogOpen}
        onClose={handleRemoveCancel}
        confirm={handleRemoveConfirm}
        title="Remove Company from Portfolio"
        primary={`Are you sure you want to remove "${localCompanyData?.company_name || 'this company'}" from the portfolio?`}
        secondary="The company will still exist in the database and can be added back later."
        confirmTitle={isRemoving ? 'Removing...' : 'Remove'}
      />

    </>
  );
};

export default CompanyProfileModal;
