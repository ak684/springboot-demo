import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import { toast } from 'react-toastify';
import api from 'services/api';
import { getBranding } from 'shared-components/utils/branding';

const StudentAccessDialog = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const branding = getBranding();
  const supportEmail = branding.supportEmail;
  const companyName = branding.companyName;

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send email to backend for processing
      await api.post('/auth/student-access-request', { email });
      toast.success('Request submitted successfully! You will receive your personal login details within 24 hours.');
      setEmail('');
      onClose();
    } catch (error) {
      toast.error(`Failed to submit request. Please try again or contact ${supportEmail} directly.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailIngo = () => {
    const subject = encodeURIComponent(`Student Access Request for ${companyName}`);
    const body = encodeURIComponent(
      `Dear team,\n\nI am a student from the Innovating for Impact class and would like to request personal login details for ${companyName}.\n\nThank you.`
    );
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div" color="primary">
            Student Access - Innovating for Impact Class
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
          Dear student of the Innovating for Impact Class. You continue to have free access to{' '}
          {companyName} during your time in the Innovating for Impact class.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mb: 4, fontWeight: 'medium' }}>
          Please choose one of the following options to get your personal login details:
        </Typography>

        <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="h6" gutterBottom color="primary">
            Option 1: Request via Form (Recommended)
          </Typography>
          <Typography variant="body2" paragraph>
            Enter your email address below and click send. You will receive your personal login details within 24 hours.
          </Typography>
          
          <TextField
            fullWidth
            label="Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            variant="outlined"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {isSubmitting ? 'Submitting...' : 'Send Request'}
          </Button>
        </Box>

        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
          <Typography variant="h6" gutterBottom>
            Option 2: Email Directly
          </Typography>
          <Typography variant="body2" paragraph>
            Send an email to {supportEmail} and you will receive your personal login within 24 hours.
          </Typography>
          
          <Button
            variant="outlined"
            onClick={handleEmailIngo}
            startIcon={<EmailIcon />}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Email {supportEmail}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="text">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentAccessDialog;
