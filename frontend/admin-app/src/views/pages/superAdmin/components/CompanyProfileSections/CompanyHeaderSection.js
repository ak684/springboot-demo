import React, { useState } from 'react';
import { Grid, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';

import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { InfoRow } from '../CompanyProfileHelpers';
import apiService from '../../../../../services/api/apiService';
import { toast } from 'react-toastify';

const CompanyHeaderSection = ({ data, onEdit }) => {
  const [trackNews, setTrackNews] = useState(data?.track_news || false);
  const [isTogglingNews, setIsTogglingNews] = useState(false);

  const handleTrackNewsToggle = async () => {
    if (!data?.id) return;

    setIsTogglingNews(true);
    const newValue = !trackNews;

    try {
      await apiService.put(
        `/companies/${data.id}/track-news?enabled=${newValue}`
      );
      setTrackNews(newValue);
      toast.success(
        newValue
          ? 'News tracking enabled for this company'
          : 'News tracking disabled for this company'
      );
    } catch (error) {
      console.error('Error toggling news tracking:', error);
      toast.error('Failed to toggle news tracking');
    } finally {
      setIsTogglingNews(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Company Name and Industry Chips in Grey Background */}
      <Box sx={{ pt: 2, mb: 2 }}>
        {/* Company Name */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          '&:hover .company-name-edit-button': {
            opacity: onEdit ? 1 : 0
          }
        }}>
          <Typography sx={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#333333',
            lineHeight: 1.2
          }}>
            {data.company_name || 'Company Name'}
          </Typography>
          {onEdit && (
            <Tooltip title="Edit company name">
              <IconButton
                size="small"
                onClick={() => onEdit('company_name', data.company_name)}
                className="company-name-edit-button"
                sx={{
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  padding: '6px',
                  '& .MuiSvgIcon-root': {
                    fontSize: '20px'
                  }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Industry Sectors and News Tracking */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {/* Industry Sectors */}
          {data.industry_sectors && (
            <Box>
              {Array.isArray(data.industry_sectors) ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {data.industry_sectors.map((sector, index) => (
                    <Chip
                      key={index}
                      label={sector}
                      size="small"
                      sx={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#bbdefb'
                        }
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Chip
                  label={data.industry_sectors}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: '#bbdefb'
                    }
                  }}
                />
              )}
            </Box>
          )}

          {/* News Tracking Toggle - Bell Icon */}
          <Tooltip title={trackNews ? 'News tracking enabled - click to disable' : 'Enable news tracking for this company'}>
            <span>
              <IconButton
                onClick={handleTrackNewsToggle}
                disabled={isTogglingNews}
                sx={{
                  color: trackNews ? '#2e7d32' : '#757575',
                  padding: '0 4px',
                  '&:hover': {
                    backgroundColor: trackNews ? 'rgba(46, 125, 50, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {trackNews ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Company Overview Section Title */}
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
            <BusinessIcon />
          </Box>
          Company Overview
        </Typography>
      </Box>

      {/* White Card with Logo + Description/Address */}
      <Box sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 2,
        overflow: 'visible',
        p: 3
      }}>
        <Grid container spacing={4}>
          {/* Left Column - Logo */}
          <Grid item xs={12} md={3}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-start',
              position: 'relative'
            }}>
              <Box sx={{ position: 'relative' }}>
                {data.company_logo && data.company_logo !== 'N/A' ? (
                  <img
                    src={data.company_logo}
                    alt="Company Logo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 120,
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BusinessIcon sx={{ fontSize: 48, color: '#ccc' }} />
                  </Box>
                )}
                {onEdit && (
                  <Tooltip title="Edit company logo">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit('company_logo', data.company_logo, 'file')}
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        right: -8,
                        backgroundColor: 'white',
                        boxShadow: 1,
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white'
                        }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Right Column - Description and Address */}
          <Grid item xs={12} md={9}>
            <Box>
              {/* Company Description */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ 
                  fontSize: '16px',
                  color: '#333333',
                  lineHeight: 1.6,
                  mb: 2
                }}>
                  {data.company_description || 'No description available'}
                </Typography>
              </Box>
              
              {/* Address */}
              <Box>
                <InfoRow
                  label="Headquarters"
                  value={data.headquarter_address}
                  icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                  onEdit={onEdit}
                  fieldName="headquarter_address"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CompanyHeaderSection;