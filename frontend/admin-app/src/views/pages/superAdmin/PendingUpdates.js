import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import apiService from '../../../services/api/apiService';
import moment from 'moment';
import Loader from 'shared-components/views/components/Loader';
import { toast } from 'react-toastify';

const PendingUpdates = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, event: null, newUrl: '' });

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/url-validation-events/pending');
      setEvents(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Failed to load pending updates');
      console.error('Error fetching pending updates:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      await apiService.post(`/url-validation-events/${eventId}/approve`);
      toast.success('URL update approved successfully');
      await fetchPendingEvents();
    } catch (err) {
      console.error('Error approving event:', err);
      toast.error('Failed to approve update');
    }
  };

  const handleReject = async (eventId) => {
    try {
      await apiService.post(`/url-validation-events/${eventId}/reject`);
      toast.success('URL update rejected');
      await fetchPendingEvents();
    } catch (err) {
      console.error('Error rejecting event:', err);
      toast.error('Failed to reject update');
    }
  };

  const handleOpenEditDialog = (event) => {
    setEditDialog({ open: true, event, newUrl: event.newUrl || '' });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, event: null, newUrl: '' });
  };

  const handleEditAndApprove = async () => {
    try {
      await apiService.put(`/url-validation-events/${editDialog.event.id}/update-url`, {
        newUrl: editDialog.newUrl
      }, {}, {});
      await apiService.post(`/url-validation-events/${editDialog.event.id}/approve`, {}, {}, {});
      toast.success('URL updated and approved successfully');
      handleCloseEditDialog();
      await fetchPendingEvents();
    } catch (err) {
      console.error('Error editing and approving event:', err);
      toast.error('Failed to edit and approve update');
    }
  };

  const getEventIcon = (eventType) => {
    if (eventType === 'URL_UPDATE_SUGGESTED') {
      return <LinkIcon color="primary" />;
    }
    return <WarningIcon color="warning" />;
  };

  const getEventTypeLabel = (eventType) => {
    if (eventType === 'URL_UPDATE_SUGGESTED') {
      return 'URL Update Suggested';
    }
    return 'URL Broken';
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Box>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        Pending Updates
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {events.length === 0 ? (
        <Alert severity="info">No pending updates</Alert>
      ) : (
        <List>
          {events.map((event) => (
            <ListItem
              key={event.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <Box display="flex" width="100%" alignItems="flex-start">
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {getEventIcon(event.eventType)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {event.companyExtractionData?.companyName || 'Unknown Company'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • {getEventTypeLabel(event.eventType)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} mt={0.5}>
                      {event.oldUrl && (
                        <Typography variant="body2" color="text.secondary">
                          Old: <Link href={event.oldUrl} target="_blank" sx={{ color: 'text.secondary' }}>{event.oldUrl}</Link>
                        </Typography>
                      )}
                      {event.newUrl ? (
                        <Typography variant="body2" color="text.secondary">
                          New: <Link href={event.newUrl} target="_blank" sx={{ color: 'text.secondary' }}>{event.newUrl}</Link>
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                          No replacement URL found - use "Edit & Approve" to provide one
                        </Typography>
                      )}
                      {event.errorMessage && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {event.errorMessage}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {moment(event.createdAt).format('MMM D, YYYY h:mm A')}
                      </Typography>
                    </Stack>
                  }
                />
              </Box>
              <Box display="flex" gap={1} mt={2} ml={7}>
                {event.newUrl && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApprove(event.id)}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditDialog(event)}
                >
                  Edit & Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={() => handleReject(event.id)}
                >
                  {event.newUrl ? 'Reject' : 'Dismiss'}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Updated URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New URL"
            type="url"
            fullWidth
            value={editDialog.newUrl}
            onChange={(e) => setEditDialog({ ...editDialog, newUrl: e.target.value })}
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleEditAndApprove}
            variant="contained"
            color="success"
            disabled={!editDialog.newUrl}
          >
            Update & Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingUpdates;
