import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import BaseSection from './BaseSection';
import { InfoRow } from '../CompanyProfileHelpers';

const CompanyOverviewSection = ({ data, onEdit }) => {
  return (
    <BaseSection
      title="Company Details"
      icon={<BusinessIcon />}
    >
      <Grid container spacing={3}>
        {/* Left Column - Company Fundamentals */}
        <Grid item xs={12} md={6}>
          <Box>
            <InfoRow 
              label="Founded"
              value={data.legal_entity_formation_date}
              icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="legal_entity_formation_date"
            />
            <InfoRow 
              label="Legal form"
              value={data.legal_form}
              icon={<AccountBalanceIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="legal_form"
            />
            <InfoRow 
              label="CEO/Founder"
              value={data.ceo_name}
              icon={<PersonIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="ceo_name"
            />
            <InfoRow 
              label="Number of employees"
              value={data.number_of_employees}
              icon={<GroupIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="number_of_employees"
            />
          </Box>
        </Grid>
        
        {/* Right Column - Metrics & Contact */}
        <Grid item xs={12} md={6}>
          <Box>
            <InfoRow 
              label="Total funding"
              value={data.total_funding_amount ? `${data.total_funding_amount} ${data.funding_currency || 'EUR'}` : 'N/A'}
              dataType={data.total_funding_amount_type}
              icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="total_funding_amount"
            />
            <InfoRow
              label="Phone"
              value={data.phone_number}
              icon={<PhoneIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="phone_number"
            />
            <InfoRow 
              label="Email"
              value={data.contact_email}
              icon={<EmailIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="contact_email"
            />
            <InfoRow 
              label="Website"
              value={data.url}
              icon={<LanguageIcon sx={{ fontSize: 16 }} />}
              onEdit={onEdit}
              fieldName="url"
            />
          </Box>
        </Grid>
        
      </Grid>
    </BaseSection>
  );
};

export default CompanyOverviewSection;