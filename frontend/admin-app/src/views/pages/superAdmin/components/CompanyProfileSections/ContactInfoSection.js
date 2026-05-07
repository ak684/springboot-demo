import React from 'react';
import { Box } from '@mui/material';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BaseSection from './BaseSection';
import { InfoRow } from '../CompanyProfileHelpers';

const ContactInfoSection = ({ data, onEdit }) => {
  return (
    <BaseSection
      title="Contact Information"
      icon={<ContactMailIcon />}
    >
      <Box>
        {/* Contact Info section is now empty - consider removing or repurposing */}
        <Typography sx={{ 
          fontSize: '16px',
          color: '#666666',
          fontStyle: 'italic',
          textAlign: 'center',
          py: 2
        }}>
          Contact information has been moved to other sections
        </Typography>
      </Box>
    </BaseSection>
  );
};

export default ContactInfoSection;