import React, { memo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import FormikTextInput from "shared-components/views/form/FormikTextInput";
import { socialMedia } from "shared-components/utils/constants";
import filters from "shared-components/filters";
import LinkIcon from '@mui/icons-material/Link';
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ventureSelectors } from "store/ducks/venture";
import CustomErrorBoundary from "../../../containers/CustomErrorBoundary";

const CompanyProfileSocialInputField = ({ name, followers, fetchFollowers, isFacebook, connectFacebook }) => {
  const { ventureId } = useParams();
  const venture = useSelector(ventureSelectors.getCurrentVenture(ventureId));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const { label, color } = socialMedia[name];

  return (
    <CustomErrorBoundary>
      <Box mb={2} display='flex' alignItems='center' gap={4}>
        <FormikTextInput
          sx={{ flexGrow: 1 }}
          name={name}
          placeholder='Type your answer here...'
          label={label}
          inputProps={{ maxLength: 250 }}
          onKeyDown={handleKeyDown}
          onBlur={() => fetchFollowers(name)}
          multiline
        />
        {followers > 0 && (
          <Box display='flex' alignItems='center' gap={1}>
            <Box backgroundColor={color} width={16} height={16}></Box>
            <Box>
              <Typography sx={{ mb: 0.5 }} variant='subtitleBold'>
                {filters.number(followers)}
              </Typography>
              <Typography variant='caption'>followers</Typography>
            </Box>
          </Box>
        )}
        <Button
          sx={{ visibility: isFacebook ? 'visible' : 'hidden' }}
          startIcon={<LinkIcon />}
          variant='outlined'
          onClick={connectFacebook}
        >
          {venture?.facebookConnected ? 'Adjust' : 'Link company page'}
        </Button>
      </Box>
    </CustomErrorBoundary>
  );
};

export default memo(CompanyProfileSocialInputField);
