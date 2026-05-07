import React, { useState } from 'react';
import { Grid, Box, Typography, Paper, Link, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import BaseSection from './BaseSection';
import { EmptyState } from '../CompanyProfileHelpers';
import { toast } from 'react-toastify';

const SocialMediaCard = ({ platform, link, followers, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(platform, link, followers);
    }
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 1
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {onEdit && isHovered && (
        <IconButton
          size="small"
          onClick={handleEditClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1, fontWeight: 600 }}>
        {platform}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <Link
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          View Profile
        </Link>
      </Typography>
      {followers && followers !== 'N/A' && (
        <Typography variant="caption" color="text.secondary">
          {typeof followers === 'number' ? followers.toLocaleString() : followers} followers
        </Typography>
      )}
    </Paper>
  );
};

const SocialMediaSection = ({ data, onEdit }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editedLink, setEditedLink] = useState('');
  const [editedFollowers, setEditedFollowers] = useState('');
  const [saving, setSaving] = useState(false);

  console.log('[SocialMediaSection] Full data object:', data);
  console.log('[SocialMediaSection] Social media links:', data.social_media_links);
  console.log('[SocialMediaSection] Social media follower counts:', data.social_media_follower_counts);

  const socialPlatforms = ['twitter', 'facebook', 'linkedin', 'instagram', 'youtube', 'tiktok', 'bluesky'];

  // Check both data structures - direct fields and nested objects
  const activePlatforms = socialPlatforms.filter(platform => {
    const directLink = data[`social_media_${platform}`];
    const nestedLink = data.social_media_links?.[platform];
    const hasLink = (directLink && directLink !== 'N/A') || (nestedLink && nestedLink !== 'N/A');

    console.log(`[SocialMediaSection] Platform ${platform}:`, {
      directLink,
      nestedLink,
      hasLink
    });

    return hasLink;
  });

  const handleEditClick = (platform, currentLink, currentFollowers) => {
    setEditingPlatform(platform);
    setEditedLink(currentLink || '');
    setEditedFollowers(currentFollowers ? String(currentFollowers) : '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || !editingPlatform) {
      return;
    }

    // Validate follower count if provided
    if (editedFollowers && editedFollowers.trim() !== '') {
      const followerCount = parseInt(editedFollowers, 10);
      if (isNaN(followerCount) || followerCount < 0) {
        toast.error('Please enter a valid follower count');
        return;
      }
    }

    setSaving(true);

    try {
      // Update both fields in a single API call
      const updatedLinks = {
        ...(data.social_media_links || {}),
        [editingPlatform]: editedLink
      };

      const followerCount = editedFollowers && editedFollowers.trim() !== ''
        ? parseInt(editedFollowers, 10)
        : null;

      const updatedFollowers = {
        ...(data.social_media_follower_counts || {}),
        [editingPlatform]: followerCount
      };

      // Call the parent's edit handler with both fields in a single payload
      const success = await onEdit({
        social_media_links: updatedLinks,
        social_media_follower_counts: updatedFollowers
      });

      // Only close dialog if save was successful
      if (success !== false) {
        handleCloseEdit();
      }
    } catch (error) {
      console.error('Error saving social media data:', error);
      toast.error('Failed to save social media data');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setEditingPlatform(null);
    setEditedLink('');
    setEditedFollowers('');
    setSaving(false);
  };

  if (activePlatforms.length === 0) {
    return (
      <BaseSection
        title="Social Media Presence"
        subtitle="No social media profiles found"
        icon={<ShareIcon />}
      >
        <EmptyState
          message="No social media profiles have been found for this company."
          icon={<ShareIcon />}
        />
      </BaseSection>
    );
  }

  return (
    <>
      <BaseSection
        title="Social Media Presence"
        subtitle={`${activePlatforms.length} platform${activePlatforms.length > 1 ? 's' : ''} found`}
        icon={<ShareIcon />}
      >
        <Grid container spacing={2}>
          {activePlatforms.map(platform => {
            // Handle both data structures
            const directLink = data[`social_media_${platform}`];
            const nestedLink = data.social_media_links?.[platform];
            const link = directLink && directLink !== 'N/A' ? directLink : nestedLink;

            const directFollowers = data[`social_media_${platform}_followers`];
            const nestedFollowers = data.social_media_follower_counts?.[platform];
            const followers = directFollowers && directFollowers !== 'N/A' ? directFollowers : nestedFollowers;

            console.log(`[SocialMediaSection] Rendering ${platform}:`, {
              link,
              followers
            });

            return (
              <Grid item xs={12} sm={6} md={4} key={platform}>
                <SocialMediaCard
                  platform={platform}
                  link={link}
                  followers={followers}
                  onEdit={onEdit ? handleEditClick : undefined}
                />
              </Grid>
            );
          })}
        </Grid>
      </BaseSection>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit {editingPlatform ? editingPlatform.charAt(0).toUpperCase() + editingPlatform.slice(1) : 'Social Media'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Profile URL"
              value={editedLink}
              onChange={(e) => setEditedLink(e.target.value)}
              placeholder={`https://${editingPlatform}.com/...`}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Follower Count"
              type="number"
              value={editedFollowers}
              onChange={(e) => setEditedFollowers(e.target.value)}
              placeholder="e.g., 5000"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SocialMediaSection;